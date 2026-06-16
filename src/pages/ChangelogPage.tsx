import { motion } from "framer-motion";
import { Zap, ArrowLeft, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type ChangeType = "feature" | "improvement" | "fix" | "breaking";

const TAG_STYLES: Record<ChangeType, { bg: string; text: string; label: string }> = {
  feature: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "New" },
  improvement: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Improved" },
  fix: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Fix" },
  breaking: { bg: "bg-red-500/10", text: "text-red-400", label: "Breaking" },
};

/* Hardcoded fallback */
const FALLBACK: { version: string; title: string; content: string; type: ChangeType; publishedAt: number }[] = [
  { version: "2.4.0", title: "Claude Opus 4 & Enhanced Caching", content: "- [feature] Added Claude Opus 4 (200K context, vision)\n- [feature] Added Claude Sonnet 4 at $3/$15 per 1M\n- [improvement] Semantic cache hit rate 28%→38%\n- [fix] Fixed rate limit headers not forwarded", type: "feature", publishedAt: 1718150000000 },
  { version: "2.3.0", title: "Playground & Llama 4 Support", content: "- [feature] API Playground — test any model in browser\n- [feature] Added Llama 4 Maverick ($0.20/$0.60 per 1M)\n- [improvement] Model selector real-time status\n- [fix] Fixed streaming final chunk drop", type: "feature", publishedAt: 1716800000000 },
  { version: "2.2.0", title: "Team Management & Webhooks", content: "- [feature] Team management — invite, roles\n- [feature] Webhook notifications\n- [feature] Added DeepSeek R1\n- [breaking] Deprecated v1/completions endpoint", type: "feature", publishedAt: 1715600000000 },
  { version: "2.1.0", title: "Auto-Failover & GPT-4.1", content: "- [feature] Auto-failover routing\n- [feature] Added GPT-4.1 support\n- [feature] Added Grok-3 from xAI\n- [improvement] Provider-specific debug info", type: "feature", publishedAt: 1714400000000 },
  { version: "2.0.0", title: "AdalahCredit 2.0 — Complete Rewrite", content: "- [feature] New routing engine sub-50ms\n- [feature] Redesigned dashboard\n- [feature] SDKs: Python, Node.js, Go, Rust\n- [breaking] API keys use sk-ac- prefix\n- [breaking] Base URL changed", type: "feature", publishedAt: 1712700000000 },
];

function parseChanges(content: string): { type: ChangeType; text: string }[] {
  return content.split("\n").filter(Boolean).map((line) => {
    const match = line.match(/\[(feature|improvement|fix|breaking)\]\s*(.*)/);
    if (match) return { type: match[1] as ChangeType, text: match[2] };
    return { type: "improvement" as ChangeType, text: line.replace(/^-\s*/, "") };
  });
}

export function ChangelogPage() {
  const dbEntries = useQuery(api.changelogFunctions.list);
  type EntryLike = { version: string; title: string; content: string; type: ChangeType; publishedAt: number };
  const entries: EntryLike[] = (dbEntries && dbEntries.length > 0 ? dbEntries : FALLBACK) as EntryLike[];

  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold">AdalahCredit</span>
            <span className="text-[10px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">Changelog</span>
          </Link>
          <Link to="/docs" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Documentation →</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Changelog</h1>
          <p className="text-sm text-muted-foreground mb-12">New features, improvements, and fixes in AdalahCredit.</p>
        </motion.div>

        {/* Loading skeleton */}
        {dbEntries === undefined && (
          <div className="space-y-8">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-accent/50 rounded w-24 mb-3" />
                <div className="h-5 bg-accent/50 rounded w-2/3 mb-2" />
                <div className="h-3 bg-accent/50 rounded w-full mb-1" />
                <div className="h-3 bg-accent/50 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-0 w-px bg-accent/50 hidden sm:block" />
          <div className="space-y-12">
            {entries.map((entry, idx) => {
              const changes = parseChanges(entry.content);
              return (
                <motion.article key={entry.version} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="relative sm:pl-10">
                  <div className="absolute left-0 top-1.5 size-[15px] rounded-full border-2 border-border bg-background hidden sm:flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-foreground/40" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-foreground bg-accent/50 px-2 py-0.5 rounded">
                      <Tag className="size-2.5" /> v{entry.version}
                    </span>
                    <span className="text-xs text-muted-foreground">{fmtDate(entry.publishedAt)}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">{entry.title}</h2>
                  <div className="space-y-1.5 mt-3">
                    {changes.map((c, i) => {
                      const tag = TAG_STYLES[c.type] || TAG_STYLES.improvement;
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${tag.bg} ${tag.text}`}>{tag.label}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{c.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border mt-16 pt-6 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to AdalahCredit
          </Link>
          <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Blog →</Link>
        </div>
      </main>
    </div>
  );
}
