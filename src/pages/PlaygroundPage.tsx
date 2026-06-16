import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  Zap,
  Settings,
  Loader2,
  Sparkles,
  DollarSign,
  Hash,
  MessageSquare,
  Trash2,
  Send,
  Key,
  AlertTriangle,
  Image,
  Volume2,
  Database,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CodeSnippets } from "@/components/CodeSnippets";

type EndpointTab = "chat" | "embeddings" | "images" | "audio" | "moderations";

const ENDPOINT_TABS: { id: EndpointTab; label: string; icon: React.ReactNode; endpoint: string }[] = [
  { id: "chat", label: "Chat", icon: <MessageSquare className="size-3.5" />, endpoint: "/v1/chat/completions" },
  { id: "embeddings", label: "Embeddings", icon: <Database className="size-3.5" />, endpoint: "/v1/embeddings" },
  { id: "images", label: "Images", icon: <Image className="size-3.5" />, endpoint: "/v1/images/generations" },
  { id: "audio", label: "Audio", icon: <Volume2 className="size-3.5" />, endpoint: "/v1/audio/speech" },
  { id: "moderations", label: "Moderation", icon: <Shield className="size-3.5" />, endpoint: "/v1/moderations" },
];

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

interface Model {
  id: string;
  name: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
  maxTokens: number;
  description: string;
}

const MODELS: Model[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", inputPrice: 2.5, outputPrice: 10, maxTokens: 128000, description: "Fast and capable" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI", inputPrice: 2, outputPrice: 8, maxTokens: 1047576, description: "Most capable GPT" },
  { id: "o3", name: "o3", provider: "OpenAI", inputPrice: 10, outputPrice: 40, maxTokens: 200000, description: "Advanced reasoning" },
  { id: "claude-opus-4", name: "Claude Opus 4", provider: "Anthropic", inputPrice: 15, outputPrice: 75, maxTokens: 200000, description: "Most capable Claude" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", inputPrice: 3, outputPrice: 15, maxTokens: 200000, description: "Balanced performance" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", inputPrice: 1.25, outputPrice: 10, maxTokens: 1000000, description: "1M context window" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", inputPrice: 0.15, outputPrice: 0.6, maxTokens: 1000000, description: "Fast and affordable" },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", inputPrice: 0.2, outputPrice: 0.6, maxTokens: 128000, description: "Open source leader" },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", inputPrice: 0.55, outputPrice: 2.19, maxTokens: 64000, description: "Reasoning model" },
  { id: "mistral-large", name: "Mistral Large", provider: "Mistral", inputPrice: 2, outputPrice: 6, maxTokens: 128000, description: "European powerhouse" },
];

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const SAMPLE_RESPONSES: Record<string, string> = {
  default: "Hello! I'm an AI assistant powered by AdalahCredit. I can help you with a wide variety of tasks including writing, analysis, coding, math, and more.\n\nHow can I help you today?",
  code: "Here's a simple Python function to calculate the Fibonacci sequence:\n\n```python\ndef fibonacci(n: int) -> list[int]:\n    \"\"\"Generate the first n Fibonacci numbers.\"\"\"\n    if n <= 0:\n        return []\n    if n == 1:\n        return [0]\n    \n    fib = [0, 1]\n    for _ in range(2, n):\n        fib.append(fib[-1] + fib[-2])\n    return fib\n\n# Example usage\nprint(fibonacci(10))\n# Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\n```\n\nThis uses an iterative approach with O(n) time and space complexity.",
  explain: "A **large language model (LLM)** is a neural network trained on massive amounts of text data to understand and generate human language.\n\n**Key concepts:**\n\n1. **Transformer Architecture** — Uses self-attention mechanisms to understand relationships between words regardless of their position in text\n\n2. **Training** — The model learns patterns from billions of text examples, adjusting billions of parameters to predict the next token\n\n3. **Inference** — Given a prompt, the model generates text by repeatedly predicting the most likely next token\n\n4. **Context Window** — The maximum amount of text the model can process at once (e.g., 128K tokens)\n\nCredit provides unified access to all major LLMs through a single API.",
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function ModelSelector({ selected, onSelect }: { selected: Model; onSelect: (m: Model) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-accent/50 border border-border rounded-lg px-3 py-2 hover:border-border transition-colors min-w-[200px]"
      >
        <div className="flex-1 text-left">
          <div className="text-xs font-medium text-foreground/80">{selected.name}</div>
          <div className="text-[10px] text-muted-foreground">{selected.provider}</div>
        </div>
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 mt-1 w-72 bg-[#141416] border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto"
            >
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onSelect(m); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors ${selected.id === m.id ? "bg-accent/50" : ""}`}
                >
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground/80">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground">{m.provider} • {m.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-muted-foreground tabular-nums">${m.inputPrice} / ${m.outputPrice}</div>
                    <div className="text-[8px] text-muted-foreground">in / out per 1M</div>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ message, onDelete }: { message: Message; onDelete?: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (message.role === "system") {
    return (
      <div className="bg-accent/30 border border-border rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System</span>
          {onDelete && (
            <button onClick={onDelete} className="p-0.5 hover:bg-accent/50 rounded transition-colors">
              <Trash2 className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
      {message.role === "assistant" && (
        <div className="size-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-border flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="size-3 text-blue-400" />
        </div>
      )}
      <div className={`max-w-[80%] ${message.role === "user" ? "bg-accent/50" : "bg-accent/30 border border-border"} rounded-xl px-4 py-3 group relative`}>
        <pre className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap font-sans">{message.content}</pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1 rounded bg-accent/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-muted-foreground" />}
        </button>
      </div>
      {message.role === "user" && (
        <div className="size-7 rounded-lg bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/80 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[9px] font-bold text-foreground/70">U</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<EndpointTab>("chat");
  const [model, setModel] = useState(MODELS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [showSystem, setShowSystem] = useState(true);
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<{ prompt: number; completion: number; latency: number } | null>(null);
  // Phase 3 endpoint states
  const [embeddingInput, setEmbeddingInput] = useState("The quick brown fox jumps over the lazy dog.");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [embeddingResult, setEmbeddingResult] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("A futuristic city skyline at sunset, cyberpunk style");
  const [imageModel, setImageModel] = useState("dall-e-3");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [audioText, setAudioText] = useState("Hello! Welcome to AdalahCredit, your unified AI gateway.");
  const [audioVoice, setAudioVoice] = useState("alloy");
  const [audioResult, setAudioResult] = useState<string | null>(null);
  const [modInput, setModInput] = useState("I love programming and building cool things!");
  const [modResult, setModResult] = useState<string | null>(null);
  const [endpointLoading, setEndpointLoading] = useState(false);
  const [endpointError, setEndpointError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get user's API keys for quick selection
  const myKeys = useQuery(api.apiKeys.listMyKeys);
  const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_URL?.replace(".cloud", ".site") || "";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-select first active key
  useEffect(() => {
    if (!apiKey && myKeys && myKeys.length > 0) {
      const activeKey = myKeys.find(k => k.status === "active");
      if (activeKey) setApiKey(activeKey.keyPrefix);
    }
  }, [myKeys, apiKey]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setApiError(null);
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Build messages array with system prompt
    const allMessages: Message[] = [];
    if (systemPrompt.trim()) {
      allMessages.push({ role: "system", content: systemPrompt.trim() });
    }
    allMessages.push(...messages, userMsg);

    // If no real API key, fall back to sample responses
    if (!apiKey || !apiKey.startsWith("sk-ac-")) {
      const lowerInput = input.toLowerCase();
      let responseKey = "default";
      if (lowerInput.includes("code") || lowerInput.includes("function") || lowerInput.includes("python")) responseKey = "code";
      else if (lowerInput.includes("explain") || lowerInput.includes("what is") || lowerInput.includes("how")) responseKey = "explain";
      const response = SAMPLE_RESPONSES[responseKey] || SAMPLE_RESPONSES.default;
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
        setLoading(false);
        setLastUsage(null);
        setApiError("⚠️ Mode demo — masukkan API key yang valid (sk-ac-...) untuk response AI asli");
      }, 600 + Math.random() * 800);
      return;
    }

    // Real API call
    const startTime = Date.now();
    try {
      const resp = await fetch(`${CONVEX_SITE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model.id,
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          temperature,
          max_tokens: maxTokens,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setApiError(data?.error?.message || `Error ${resp.status}`);
        setLoading(false);
        return;
      }

      const content = data.choices?.[0]?.message?.content || "(empty response)";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      setLastUsage({
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        latency: Date.now() - startTime,
      });
    } catch (err: any) {
      setApiError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  const estimatedTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
  const estimatedCost = ((estimatedTokens / 1_000_000) * model.inputPrice + (estimatedTokens / 1_000_000) * model.outputPrice).toFixed(6);

  /* ── Phase 3 endpoint handlers ── */
  const handleEndpointCall = async (endpoint: string, body: unknown) => {
    setEndpointLoading(true);
    setEndpointError(null);
    try {
      const resp = await fetch(`${CONVEX_SITE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error?.message || "Request failed");
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setEndpointError(msg);
      return null;
    } finally {
      setEndpointLoading(false);
    }
  };

  const handleEmbedding = async () => {
    const result = await handleEndpointCall("/v1/embeddings", {
      model: embeddingModel,
      input: embeddingInput,
    });
    if (result) setEmbeddingResult(JSON.stringify(result, null, 2));
  };

  const handleImageGen = async () => {
    const result = await handleEndpointCall("/v1/images/generations", {
      model: imageModel,
      prompt: imagePrompt,
      size: imageSize,
    });
    if (result) setImageResult(JSON.stringify(result, null, 2));
  };

  const handleAudioSpeech = async () => {
    setEndpointLoading(true);
    setEndpointError(null);
    try {
      const resp = await fetch(`${CONVEX_SITE_URL}/v1/audio/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ model: "tts-1", input: audioText, voice: audioVoice }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err?.error?.message || "TTS failed");
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setAudioResult(url);
    } catch (err: unknown) {
      setEndpointError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setEndpointLoading(false);
    }
  };

  const handleModeration = async () => {
    const result = await handleEndpointCall("/v1/moderations", {
      input: modInput,
    });
    if (result) setModResult(JSON.stringify(result, null, 2));
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
              <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
                <Zap className="size-3.5 text-background" />
              </div>
              <span className="text-sm font-semibold">AdalahCredit</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Playground</span>
          </div>

          <div className="flex items-center gap-3">
            <ModelSelector selected={model} onSelect={setModel} />
            {/* API Key input */}
            <div className="hidden sm:flex items-center gap-1.5 bg-accent/30 border border-border rounded-lg px-2.5 py-1.5">
              <Key className="size-3 text-muted-foreground shrink-0" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ac-..."
                className="bg-transparent text-xs text-foreground/70 outline-none w-28 placeholder-muted-foreground font-mono"
              />
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? "bg-accent/70 text-foreground" : "hover:bg-accent/50 text-muted-foreground"}`}
            >
              <Settings className="size-4" />
            </button>
            <button onClick={handleClear} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground transition-colors" title="Clear chat">
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Endpoint tabs */}
      <div className="border-b border-border bg-background/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1 px-4 sm:px-6 py-1.5 overflow-x-auto">
          {ENDPOINT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <span className="ml-2 text-[10px] text-muted-foreground font-mono hidden sm:inline">
            {ENDPOINT_TABS.find(t => t.id === activeTab)?.endpoint}
          </span>
        </div>
      </div>

      {activeTab !== "chat" ? (
        /* ══════════════════════════════════════════════════════
           PHASE 3 ENDPOINT PANELS
           ══════════════════════════════════════════════════════ */
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Error display */}
            {endpointError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                {endpointError}
              </div>
            )}

            {activeTab === "embeddings" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Text Embeddings</h2>
                  <p className="text-xs text-muted-foreground">Convert text to vector representations for search, clustering, and classification.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Model</label>
                    <select value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)}
                      className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-foreground/30 transition-colors">
                      <option value="text-embedding-3-small">text-embedding-3-small ($0.02/1M)</option>
                      <option value="text-embedding-3-large">text-embedding-3-large ($0.13/1M)</option>
                      <option value="text-embedding-ada-002">text-embedding-ada-002 ($0.10/1M)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Input Text</label>
                    <textarea value={embeddingInput} onChange={(e) => setEmbeddingInput(e.target.value)}
                      className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm outline-none resize-none min-h-[80px] focus:border-foreground/30 transition-colors" rows={3} />
                  </div>
                  <button onClick={handleEmbedding} disabled={endpointLoading}
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                    {endpointLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Database className="size-3.5" />}
                    Generate Embedding
                  </button>
                </div>
                {embeddingResult && (
                  <div className="bg-accent/20 border border-border rounded-lg p-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Response</span>
                      <button onClick={() => { navigator.clipboard.writeText(embeddingResult); }}
                        className="text-xs text-muted-foreground hover:text-foreground"><Copy className="size-3" /></button>
                    </div>
                    <pre className="text-[11px] text-foreground/70 overflow-x-auto max-h-64 overflow-y-auto font-mono leading-relaxed">{embeddingResult}</pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === "images" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Image Generation</h2>
                  <p className="text-xs text-muted-foreground">Generate images from text prompts using DALL-E, Stable Diffusion, Flux, and more.</p>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Model</label>
                      <select value={imageModel} onChange={(e) => setImageModel(e.target.value)}
                        className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-foreground/30 transition-colors">
                        <option value="dall-e-3">DALL-E 3</option>
                        <option value="dall-e-2">DALL-E 2</option>
                        <option value="gpt-image-1">GPT Image 1</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Size</label>
                      <select value={imageSize} onChange={(e) => setImageSize(e.target.value)}
                        className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-foreground/30 transition-colors">
                        <option value="1024x1024">1024×1024</option>
                        <option value="1024x1792">1024×1792 (Portrait)</option>
                        <option value="1792x1024">1792×1024 (Landscape)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prompt</label>
                    <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)}
                      className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm outline-none resize-none min-h-[80px] focus:border-foreground/30 transition-colors" rows={3} />
                  </div>
                  <button onClick={handleImageGen} disabled={endpointLoading}
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                    {endpointLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Generate Image
                  </button>
                </div>
                {imageResult && (
                  <div className="bg-accent/20 border border-border rounded-lg p-4">
                    <span className="text-xs font-medium text-muted-foreground mb-2 block">Response</span>
                    <pre className="text-[11px] text-foreground/70 overflow-x-auto max-h-64 overflow-y-auto font-mono leading-relaxed">{imageResult}</pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === "audio" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Text to Speech</h2>
                  <p className="text-xs text-muted-foreground">Convert text to natural-sounding speech using OpenAI TTS, ElevenLabs, and more.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Voice</label>
                    <select value={audioVoice} onChange={(e) => setAudioVoice(e.target.value)}
                      className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-foreground/30 transition-colors">
                      <option value="alloy">Alloy</option>
                      <option value="echo">Echo</option>
                      <option value="fable">Fable</option>
                      <option value="onyx">Onyx</option>
                      <option value="nova">Nova</option>
                      <option value="shimmer">Shimmer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Text</label>
                    <textarea value={audioText} onChange={(e) => setAudioText(e.target.value)}
                      className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm outline-none resize-none min-h-[80px] focus:border-foreground/30 transition-colors" rows={3} />
                  </div>
                  <button onClick={handleAudioSpeech} disabled={endpointLoading}
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                    {endpointLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Volume2 className="size-3.5" />}
                    Generate Speech
                  </button>
                </div>
                {audioResult && (
                  <div className="bg-accent/20 border border-border rounded-lg p-4">
                    <span className="text-xs font-medium text-muted-foreground mb-2 block">Audio Output</span>
                    <audio controls src={audioResult} className="w-full mt-1" />
                  </div>
                )}
              </div>
            )}

            {activeTab === "moderations" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Content Moderation</h2>
                  <p className="text-xs text-muted-foreground">Check text for harmful content. Free to use — no credits deducted.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Input Text</label>
                    <textarea value={modInput} onChange={(e) => setModInput(e.target.value)}
                      className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm outline-none resize-none min-h-[80px] focus:border-foreground/30 transition-colors" rows={3} />
                  </div>
                  <button onClick={handleModeration} disabled={endpointLoading}
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                    {endpointLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Shield className="size-3.5" />}
                    Check Content
                  </button>
                </div>
                {modResult && (
                  <div className="bg-accent/20 border border-border rounded-lg p-4">
                    <span className="text-xs font-medium text-muted-foreground mb-2 block">Moderation Result</span>
                    <pre className="text-[11px] text-foreground/70 overflow-x-auto max-h-64 overflow-y-auto font-mono leading-relaxed">{modResult}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
      <div className="flex-1 flex overflow-hidden">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {/* System prompt */}
              {showSystem && (
                <div className="bg-accent/30 border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System Prompt</span>
                    <button onClick={() => setShowSystem(false)} className="text-[10px] text-muted-foreground hover:text-muted-foreground transition-colors">Hide</button>
                  </div>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full bg-transparent text-xs text-muted-foreground outline-none resize-none leading-relaxed min-h-[40px]"
                    rows={2}
                  />
                </div>
              )}

              {/* Empty state */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-border flex items-center justify-center mb-4">
                    <MessageSquare className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground/70 mb-1">Start a conversation</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Test any AI model through AdalahCredit's unified API. Type a message below to begin.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-6 justify-center">
                    {["Write a Python function", "Explain quantum computing", "Draft an email", "Generate a haiku"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-[11px] text-muted-foreground bg-accent/30 border border-border px-3 py-1.5 rounded-lg hover:text-foreground/70 hover:border-border transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}

              {/* Loading */}
              {loading && (
                <div className="flex gap-3">
                  <div className="size-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-border flex items-center justify-center shrink-0">
                    <Loader2 className="size-3 text-blue-400 animate-spin" />
                  </div>
                  <div className="bg-accent/30 border border-border rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="size-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-border px-4 sm:px-6 py-4 shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-accent/30 border border-border rounded-xl px-4 py-3 focus-within:border-border transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                  className="flex-1 bg-transparent text-sm text-foreground/80 placeholder-muted-foreground outline-none resize-none min-h-[24px] max-h-32 leading-relaxed"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={`shrink-0 p-2 rounded-lg transition-colors ${input.trim() && !loading ? "bg-foreground text-background hover:opacity-90" : "bg-accent/50 text-muted-foreground"}`}
                >
                  <Send className="size-4" />
                </button>
              </div>
              {/* Error display */}
              {apiError && (
                <div className="flex items-center gap-2 mt-2 text-[11px] text-amber-400/80">
                  <AlertTriangle className="size-3 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  {lastUsage ? (
                    <>
                      <span className="flex items-center gap-1 text-muted-foreground"><Hash className="size-2.5" /> {lastUsage.prompt + lastUsage.completion} tokens</span>
                      <span className="flex items-center gap-1 text-muted-foreground">⏱ {lastUsage.latency}ms</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1"><Hash className="size-2.5" /> ~{estimatedTokens} tokens</span>
                      <span className="flex items-center gap-1"><DollarSign className="size-2.5" /> ~${estimatedCost}</span>
                    </>
                  )}
                </div>
                <span>{model.name} • {model.provider} {!apiKey?.startsWith("sk-ac-") && "• Demo mode"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings sidebar */}
        <AnimatePresence>
          {showSettings && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border overflow-hidden shrink-0 hidden sm:block"
            >
              <div className="w-64 p-4 space-y-5">
                <h3 className="text-xs font-medium text-foreground/70">Parameters</h3>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-muted-foreground">Temperature</label>
                    <span className="text-[11px] text-foreground/70 tabular-nums font-mono">{temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1 bg-accent/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>Precise</span><span>Creative</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-muted-foreground">Max Tokens</label>
                    <span className="text-[11px] text-foreground/70 tabular-nums font-mono">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max={model.maxTokens > 16384 ? 16384 : model.maxTokens}
                    step="256"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full h-1 bg-accent/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs font-medium text-foreground/70 mb-3">Model Info</h3>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="text-foreground/70">{model.provider}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Context</span><span className="text-foreground/70 tabular-nums">{(model.maxTokens / 1000).toFixed(0)}K tokens</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Input price</span><span className="text-foreground/70 tabular-nums">${model.inputPrice}/1M</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Output price</span><span className="text-foreground/70 tabular-nums">${model.outputPrice}/1M</span></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs font-medium text-foreground/70 mb-3">API Key</h3>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ac-..."
                    className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground/70 outline-none focus:border-border font-mono mb-1 placeholder-muted-foreground"
                  />
                  <p className="text-[9px] text-muted-foreground mb-1">Buat API key di <Link to="/dashboard" className="text-blue-400 hover:underline">Dashboard</Link></p>
                  {myKeys && myKeys.filter(k => k.status === "active").length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-[9px] text-muted-foreground">Keys kamu:</p>
                      {myKeys.filter(k => k.status === "active").map(k => (
                        <button
                          key={k._id}
                          onClick={() => setApiKey(k.keyPrefix)}
                          className="w-full text-left text-[10px] text-muted-foreground hover:text-foreground/70 bg-accent/30 px-2 py-1 rounded transition-colors font-mono truncate"
                        >
                          {k.name}: {k.keyPrefix}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs font-medium text-foreground/70 mb-3">Code Snippets</h3>
                  <CodeSnippets
                    baseUrl={CONVEX_SITE_URL}
                    apiKey={apiKey || "sk-ac-YOUR_API_KEY"}
                    model={model.id}
                    prompt={messages.length > 0 ? messages[messages.length - 1]?.content ?? "Hello" : "Hello"}
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs font-medium text-foreground/70 mb-3">Quick Actions</h3>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setShowSystem(!showSystem)}
                      className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground/70 py-1 transition-colors"
                    >
                      {showSystem ? "Hide" : "Show"} system prompt
                    </button>
                    <button
                      onClick={handleClear}
                      className="w-full text-left text-[11px] text-muted-foreground hover:text-red-400 py-1 transition-colors"
                    >
                      Clear conversation
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}
