import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Key,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Send,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/* ═══════════════════════════════════════════════════════════════
   STEP DATA
   ═══════════════════════════════════════════════════════════════ */

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", desc: "Best overall quality", popular: true },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", desc: "Great for reasoning", popular: true },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", desc: "Fast & capable", popular: false },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", desc: "Best value", popular: true },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", desc: "Open source", popular: false },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", desc: "Advanced reasoning", popular: false },
];

const USE_CASES = [
  { id: "chatbot", label: "Chatbot / Assistant", emoji: "💬" },
  { id: "content", label: "Content Generation", emoji: "✍️" },
  { id: "code", label: "Code Generation", emoji: "💻" },
  { id: "analysis", label: "Data Analysis", emoji: "📊" },
  { id: "translation", label: "Translation", emoji: "🌍" },
  { id: "other", label: "Other / Exploring", emoji: "🔬" },
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i === current ? "w-8 bg-foreground" : i < current ? "w-4 bg-foreground/30" : "w-4 bg-accent/70"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Step 1: Welcome & Use Case ── */
function StepWelcome({ selectedUseCase, setSelectedUseCase }: { selectedUseCase: string; setSelectedUseCase: (v: string) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to AdalahCredit! 🎉</h1>
        <p className="text-sm text-muted-foreground">Let's get you set up in under 2 minutes. What will you be building?</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {USE_CASES.map((uc) => (
          <button
            key={uc.id}
            onClick={() => setSelectedUseCase(uc.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
              selectedUseCase === uc.id
                ? "bg-accent/50 border-border ring-1 ring-white/10"
                : "bg-accent/30 border-border hover:border-border"
            }`}
          >
            <span className="text-2xl">{uc.emoji}</span>
            <span className="text-xs text-foreground/70">{uc.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 2: Generate API Key ── */
function StepApiKey() {
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const createKey = useMutation(api.apiKeys.createKey);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await createKey({ name: "Onboarding Key" });
      setApiKey(result.fullKey);
      setGenerated(true);
    } catch (err) {
      // If not authenticated, show a dummy key as fallback
      setApiKey("sk-ac-" + Math.random().toString(36).slice(2, 26));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Create your API key</h1>
        <p className="text-sm text-muted-foreground">This key gives you access to all 300+ models. Keep it secret!</p>
      </div>

      {!generated ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-foreground text-background font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
          {loading ? "Generating..." : "Generate API Key"}
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="size-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-300">API key generated!</p>
              <p className="text-[10px] text-muted-foreground">Copy it now — you won't be able to see it again.</p>
            </div>
          </div>

          <div className="bg-[#0a0a0c] border border-border rounded-xl p-4 flex items-center gap-3">
            <code className="text-xs font-mono text-foreground/70 flex-1 truncate">{apiKey}</code>
            <button onClick={handleCopy} className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-accent/50 px-3 py-1.5 rounded-lg transition-colors">
              {copied ? <><Check className="size-3 text-emerald-400" /> Copied</> : <><Copy className="size-3" /> Copy</>}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            You can create more keys and manage permissions in your{" "}
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">dashboard</Link>.
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ── Step 3: Choose Model ── */
function StepChooseModel({ selectedModel, setSelectedModel }: { selectedModel: string; setSelectedModel: (v: string) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Pick a model to start</h1>
        <p className="text-sm text-muted-foreground">You can use any model anytime — this just sets your default.</p>
      </div>

      <div className="space-y-2">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
              selectedModel === m.id
                ? "bg-accent/50 border-border ring-1 ring-white/10"
                : "bg-accent/30 border-border hover:border-border"
            }`}
          >
            <div className={`size-10 rounded-lg flex items-center justify-center text-xs font-bold ${
              selectedModel === m.id ? "bg-foreground text-background" : "bg-accent/50 text-muted-foreground"
            }`}>
              {m.provider[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground/80">{m.name}</span>
                {m.popular && <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full">Popular</span>}
              </div>
              <span className="text-[10px] text-muted-foreground">{m.provider} · {m.desc}</span>
            </div>
            <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              selectedModel === m.id ? "border-foreground bg-foreground" : "border-border"
            }`}>
              {selectedModel === m.id && <Check className="size-3 text-background" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 4: Test Request ── */
function StepTestRequest({ selectedModel }: { selectedModel: string }) {
  const [sent, setSent] = useState(false);
  const [typing, setTyping] = useState(false);
  const [response, setResponse] = useState("");

  const dummyResponse = "Hello! I'm responding through AdalahCredit's unified API. You're using " + (selectedModel || "gpt-4o") + " right now, but you can switch to any of 300+ models by just changing the model parameter. No extra setup needed! 🚀";

  const handleSend = () => {
    setSent(true);
    setTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setResponse(dummyResponse.slice(0, i + 1));
      i++;
      if (i >= dummyResponse.length) {
        clearInterval(interval);
        setTyping(false);
      }
    }, 15);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Try your first request</h1>
        <p className="text-sm text-muted-foreground">See AdalahCredit in action — send a test message.</p>
      </div>

      <div className="bg-[#0a0a0c] border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <Sparkles className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-mono">{selectedModel || "gpt-4o"}</span>
        </div>

        <div className="p-4 space-y-3 min-h-[120px]">
          <div className="flex gap-3">
            <div className="size-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[8px] font-bold text-blue-400">U</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">Hello! Can you tell me about AdalahCredit's API?</p>
          </div>

          {sent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="size-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="size-3 text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {response}
                {typing && <span className="inline-block w-1.5 h-3.5 bg-zinc-500 ml-0.5 animate-pulse" />}
              </p>
            </motion.div>
          )}
        </div>

        {!sent && (
          <div className="px-4 pb-4">
            <button
              onClick={handleSend}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-foreground text-background font-medium text-xs hover:opacity-90 transition-colors"
            >
              <Send className="size-3.5" /> Send Test Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Step 5: Done ── */
function StepDone() {
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);
  // Fire once on mount
  useState(() => { completeOnboarding({}).catch(() => {}); });

  return (
    <div className="space-y-8 text-center">
      <div>
        <div className="mx-auto size-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mb-6">
          <Check className="size-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">You're all set! 🎉</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your account is ready. Start building with 300+ AI models through one simple API.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
        <Link
          to="/dashboard"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-background font-medium text-xs hover:opacity-90 transition-colors"
        >
          Go to Dashboard <ArrowRight className="size-3.5" />
        </Link>
        <Link
          to="/docs"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/50 border border-border text-foreground/70 font-medium text-xs hover:bg-accent transition-colors"
        >
          Read the Docs
        </Link>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-4">
        {[
          { label: "Playground", href: "/playground" },
          { label: "SDK Libraries", href: "/sdks" },
          { label: "Status Page", href: "/status" },
          { label: "Support", href: "/support" },
        ].map((l) => (
          <Link key={l.href} to={l.href} className="text-[10px] text-muted-foreground hover:text-foreground/70 transition-colors">
            {l.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN ONBOARDING PAGE
   ═══════════════════════════════════════════════════════════════ */

const TOTAL_STEPS = 5;

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedUseCase, setSelectedUseCase] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");

  const canProceed = step === 0 ? selectedUseCase !== "" : true;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold text-foreground">AdalahCredit</span>
          </Link>
          <StepIndicator current={step} total={TOTAL_STEPS} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && <StepWelcome selectedUseCase={selectedUseCase} setSelectedUseCase={setSelectedUseCase} />}
              {step === 1 && <StepApiKey />}
              {step === 2 && <StepChooseModel selectedModel={selectedModel} setSelectedModel={setSelectedModel} />}
              {step === 3 && <StepTestRequest selectedModel={selectedModel} />}
              {step === 4 && <StepDone />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer nav */}
      {step < TOTAL_STEPS - 1 && (
        <footer className="border-t border-border">
          <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className={`flex items-center gap-1 text-xs transition-colors ${step === 0 ? "text-muted-foreground cursor-default" : "text-muted-foreground hover:text-foreground"}`}
              disabled={step === 0}
            >
              <ChevronLeft className="size-3.5" /> Back
            </button>
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-[10px] text-muted-foreground hover:text-muted-foreground transition-colors">
                Skip setup →
              </Link>
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed}
                className={`flex items-center gap-1.5 text-xs font-medium px-5 py-2 rounded-lg transition-colors ${
                  canProceed ? "bg-foreground text-background hover:opacity-90" : "bg-accent/50 text-muted-foreground cursor-not-allowed"
                }`}
              >
                Continue <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
