import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowLeft,
  Check,
  X,
  Star,
  Gauge,
  DollarSign,
  Brain,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

interface Model {
  id: string;
  name: string;
  provider: string;
  contextWindow: string;
  inputPrice: string;
  outputPrice: string;
  latency: string;
  quality: number; // 1-5
  speed: number; // 1-5
  cost: number; // 1-5 (5 = cheapest)
  reasoning: boolean;
  vision: boolean;
  streaming: boolean;
  functionCalling: boolean;
  jsonMode: boolean;
  bestFor: string;
}

const MODELS: Model[] = [
  {
    id: "gpt-4o", name: "GPT-4o", provider: "OpenAI",
    contextWindow: "128K", inputPrice: "$2.50", outputPrice: "$10.00",
    latency: "~200ms", quality: 5, speed: 4, cost: 3,
    reasoning: true, vision: true, streaming: true, functionCalling: true, jsonMode: true,
    bestFor: "Best all-around model",
  },
  {
    id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI",
    contextWindow: "128K", inputPrice: "$0.15", outputPrice: "$0.60",
    latency: "~80ms", quality: 3, speed: 5, cost: 5,
    reasoning: false, vision: true, streaming: true, functionCalling: true, jsonMode: true,
    bestFor: "Best value for simple tasks",
  },
  {
    id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic",
    contextWindow: "200K", inputPrice: "$3.00", outputPrice: "$15.00",
    latency: "~250ms", quality: 5, speed: 3, cost: 2,
    reasoning: true, vision: true, streaming: true, functionCalling: true, jsonMode: true,
    bestFor: "Best for reasoning & code",
  },
  {
    id: "claude-haiku-3.5", name: "Claude Haiku 3.5", provider: "Anthropic",
    contextWindow: "200K", inputPrice: "$0.80", outputPrice: "$4.00",
    latency: "~100ms", quality: 3, speed: 5, cost: 4,
    reasoning: false, vision: true, streaming: true, functionCalling: true, jsonMode: true,
    bestFor: "Fast & affordable Anthropic",
  },
  {
    id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google",
    contextWindow: "1M", inputPrice: "$1.25", outputPrice: "$5.00",
    latency: "~180ms", quality: 4, speed: 4, cost: 3,
    reasoning: true, vision: true, streaming: true, functionCalling: true, jsonMode: true,
    bestFor: "Largest context window",
  },
  {
    id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google",
    contextWindow: "1M", inputPrice: "$0.15", outputPrice: "$0.60",
    latency: "~50ms", quality: 3, speed: 5, cost: 5,
    reasoning: false, vision: true, streaming: true, functionCalling: true, jsonMode: true,
    bestFor: "Fastest response time",
  },
  {
    id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta",
    contextWindow: "128K", inputPrice: "$0.20", outputPrice: "$0.60",
    latency: "~150ms", quality: 4, speed: 4, cost: 5,
    reasoning: true, vision: true, streaming: true, functionCalling: true, jsonMode: true,
    bestFor: "Best open-source model",
  },
  {
    id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek",
    contextWindow: "64K", inputPrice: "$0.55", outputPrice: "$2.19",
    latency: "~2s", quality: 5, speed: 2, cost: 4,
    reasoning: true, vision: false, streaming: true, functionCalling: false, jsonMode: true,
    bestFor: "Best for deep reasoning",
  },
  {
    id: "mistral-large", name: "Mistral Large", provider: "Mistral",
    contextWindow: "128K", inputPrice: "$2.00", outputPrice: "$6.00",
    latency: "~160ms", quality: 4, speed: 4, cost: 3,
    reasoning: true, vision: false, streaming: true, functionCalling: true, jsonMode: true,
    bestFor: "Strong European alternative",
  },
];

const SORT_OPTIONS = [
  { id: "quality", label: "Quality", icon: <Star className="size-3" /> },
  { id: "speed", label: "Speed", icon: <Gauge className="size-3" /> },
  { id: "cost", label: "Cheapest", icon: <DollarSign className="size-3" /> },
];

function RatingDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`size-1.5 rounded-full ${i < value ? "bg-foreground" : "bg-accent/70"}`} />
      ))}
    </div>
  );
}

function FeatureCell({ supported }: { supported: boolean }) {
  return supported ? (
    <Check className="size-3.5 text-emerald-400 mx-auto" />
  ) : (
    <X className="size-3.5 text-muted-foreground mx-auto" />
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export function ComparePage() {
  const [sortBy, setSortBy] = useState("quality");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const providers = [...new Set(MODELS.map((m) => m.provider))];

  const toggleProvider = (p: string) => {
    setSelectedProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const filtered = MODELS.filter(
    (m) => selectedProviders.length === 0 || selectedProviders.includes(m.provider)
  ).sort((a, b) => {
    if (sortBy === "quality") return b.quality - a.quality;
    if (sortBy === "speed") return b.speed - a.speed;
    if (sortBy === "cost") return b.cost - a.cost;
    return 0;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold">AdalahCredit</span>
            <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">Compare</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/signup" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Get Started</Link>
            <Link to="/docs" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Docs →</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10 sm:py-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Compare Models</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Side-by-side comparison of all supported models. Find the right model for your use case based on quality, speed, and cost.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          {/* Provider filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">Provider:</span>
            <div className="flex gap-1.5 shrink-0">
              {providers.map((p) => (
                <button
                  key={p}
                  onClick={() => toggleProvider(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    selectedProviders.includes(p) || selectedProviders.length === 0
                      ? selectedProviders.includes(p)
                        ? "bg-foreground text-background"
                        : "bg-accent/50 text-muted-foreground border border-border"
                      : "bg-accent/30 text-muted-foreground border border-border"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sort by:</span>
            <div className="flex gap-1.5">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    sortBy === s.id
                      ? "bg-foreground text-background"
                      : "bg-accent/50 text-muted-foreground border border-border hover:text-foreground"
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden space-y-3 mb-6">
          {filtered.map((m) => (
            <div key={m.id} className="bg-accent/30 border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-8 rounded-lg bg-accent/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {m.provider[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground/80">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground">{m.provider}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                <div><span className="text-muted-foreground">Context:</span> <span className="text-muted-foreground font-mono">{m.contextWindow}</span></div>
                <div><span className="text-muted-foreground">Latency:</span> <span className="text-muted-foreground font-mono">{m.latency}</span></div>
                <div><span className="text-muted-foreground">Input:</span> <span className="text-muted-foreground font-mono">{m.inputPrice}/M</span></div>
                <div><span className="text-muted-foreground">Output:</span> <span className="text-muted-foreground font-mono">{m.outputPrice}/M</span></div>
              </div>
              <div className="flex items-center gap-3 text-[10px] mb-2">
                <div className="flex items-center gap-1"><span className="text-muted-foreground">Quality:</span> <RatingDots value={m.quality} /></div>
                <div className="flex items-center gap-1"><span className="text-muted-foreground">Speed:</span> <RatingDots value={m.speed} /></div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.vision && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Vision</span>}
                {m.reasoning && <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Reasoning</span>}
                {m.functionCalling && <span className="text-[8px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">Functions</span>}
                {m.streaming && <span className="text-[8px] bg-zinc-500/10 text-muted-foreground px-1.5 py-0.5 rounded">Streaming</span>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{m.bestFor}</p>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block bg-accent/30 border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-[10px] font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-[#0b0b0d] z-10 min-w-[180px]">Model</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Context</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Input / 1M</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output / 1M</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Latency</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quality</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Speed</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Vision</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Reasoning</th>
                <th className="text-center py-3 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Functions</th>
                <th className="text-left py-3 px-4 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Best For</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-border hover:bg-accent/30 transition-colors ${i === 0 ? "bg-accent/30" : ""}`}>
                  <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                    <div className="flex items-center gap-3">
                      <div className="size-7 rounded-md bg-accent/50 flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        {m.provider[0]}
                      </div>
                      <div>
                        <div className="font-medium text-foreground/80">{m.name}</div>
                        <div className="text-[9px] text-muted-foreground">{m.provider}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-3 text-muted-foreground font-mono tabular-nums">{m.contextWindow}</td>
                  <td className="text-center py-3 px-3 text-muted-foreground font-mono tabular-nums">{m.inputPrice}</td>
                  <td className="text-center py-3 px-3 text-muted-foreground font-mono tabular-nums">{m.outputPrice}</td>
                  <td className="text-center py-3 px-3 text-muted-foreground font-mono tabular-nums">{m.latency}</td>
                  <td className="py-3 px-3"><div className="flex justify-center"><RatingDots value={m.quality} /></div></td>
                  <td className="py-3 px-3"><div className="flex justify-center"><RatingDots value={m.speed} /></div></td>
                  <td className="text-center py-3 px-3"><FeatureCell supported={m.vision} /></td>
                  <td className="text-center py-3 px-3"><FeatureCell supported={m.reasoning} /></td>
                  <td className="text-center py-3 px-3"><FeatureCell supported={m.functionCalling} /></td>
                  <td className="py-3 px-4 text-muted-foreground">{m.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: <Star className="size-4 text-amber-400" />, title: "Best Quality", desc: "GPT-4o and Claude Sonnet 4 lead in overall quality across benchmarks." },
            { icon: <Gauge className="size-4 text-blue-400" />, title: "Fastest", desc: "Gemini 2.5 Flash at ~50ms TTFB. GPT-4o Mini is a close second." },
            { icon: <DollarSign className="size-4 text-emerald-400" />, title: "Most Affordable", desc: "GPT-4o Mini and Gemini 2.5 Flash at $0.15/M input tokens." },
          ].map((tip) => (
            <div key={tip.title} className="bg-accent/30 border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {tip.icon}
                <h3 className="text-xs font-medium text-foreground">{tip.title}</h3>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 py-8 bg-accent/30 border border-border rounded-xl">
          <Brain className="size-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">Can't decide?</h3>
          <p className="text-xs text-muted-foreground mb-4">Use AdalahCredit's Smart Routing to automatically pick the best model per request.</p>
          <div className="flex justify-center gap-3">
            <Link to="/playground" className="text-xs font-medium bg-foreground text-background px-5 py-2 rounded-lg hover:opacity-90 transition-colors">
              Try in Playground
            </Link>
            <Link to="/docs" className="text-xs font-medium text-foreground/70 bg-accent/50 border border-border px-5 py-2 rounded-lg hover:bg-accent transition-colors">
              Read Docs
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6 mt-10 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to AdalahCredit
          </Link>
          <Link to="/sdks" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">SDK Libraries →</Link>
        </div>
      </main>
    </div>
  );
}
