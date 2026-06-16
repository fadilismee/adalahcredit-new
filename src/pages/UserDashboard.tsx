import { useState, Fragment, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Key, Copy, Check, Eye, EyeOff, Plus, Trash2, BarChart3, Activity,
  Zap, CreditCard, Settings, LogOut, Clock, Shield,
  Layers, Terminal, ExternalLink, Download, Home, BookOpen,
  Wallet, Menu, AlertTriangle, Tag, DollarSign, Edit2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useEnsureProfile } from "@/hooks/useEnsureProfile";
import type { Id } from "../../convex/_generated/dataModel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencyToggle } from "@/lib/currency";
import { NotificationBell } from "@/components/NotificationBell";
import { UsageOverTimeChart, CostOverTimeChart, ModelBreakdownChart, LatencyChart } from "@/components/AnalyticsCharts";

/* ═══════════════════════════════════════════════════════════════
   TYPES & HELPERS
   ═══════════════════════════════════════════════════════════════ */

type Tab = "overview" | "keys" | "usage" | "logs" | "billing" | "aliases" | "limits" | "settings" | "team" | "webhooks";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="size-4" /> },
  { id: "keys", label: "API Keys", icon: <Key className="size-4" /> },
  { id: "usage", label: "Usage", icon: <Activity className="size-4" /> },
  { id: "logs", label: "Logs", icon: <Terminal className="size-4" /> },
  { id: "billing", label: "Billing", icon: <CreditCard className="size-4" /> },
  { id: "aliases", label: "Model Aliases", icon: <Tag className="size-4" /> },
  { id: "limits", label: "Spending Limits", icon: <DollarSign className="size-4" /> },
  { id: "team", label: "Team", icon: <Layers className="size-4" /> },
  { id: "webhooks", label: "Webhooks", icon: <ExternalLink className="size-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="size-4" /> },
];

/** FIX H17: CopyButton now copies actual text passed (not just prefix) */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-muted-foreground hover:text-foreground/70 transition-colors">
      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function StatCard({ title, value, change, icon: Icon, positive }: { title: string; value: string; change?: string; icon: React.FC<{ className?: string }>; positive?: boolean }) {
  return (
    <div className="bg-accent/30 border border-border rounded-xl p-4 hover:border-border transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="size-7 rounded-lg bg-accent/50 flex items-center justify-center">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="text-xl font-bold text-foreground tabular-nums">{value}</div>
      {change && (
        <div className={`text-[10px] mt-0.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {change} vs last period
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: OVERVIEW
   ═══════════════════════════════════════════════════════════════ */

function SpendingAlertBanner() {
  const alert = useQuery(api.usage.getSpendingAlert);
  if (!alert || alert.level === "none") return null;

  const colors: Record<string, string> = {
    warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    critical: "border-red-500/30 bg-red-500/10 text-red-300",
    exhausted: "border-red-600/40 bg-red-600/15 text-red-200",
  };
  // FIX M19: Handle unknown levels gracefully
  const colorClass = colors[alert.level] ?? colors.warning;

  return (
    <div className={`border rounded-xl px-4 py-3 mb-4 flex items-center justify-between ${colorClass}`}>
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="size-4 shrink-0" />
        <span>{alert.message}</span>
      </div>
      <Link to="/topup" className="text-xs font-medium bg-accent hover:bg-accent/70 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
        Top Up →
      </Link>
    </div>
  );
}

function OverviewTab() {
  const stats = useQuery(api.usage.getMyStats);
  const keys = useQuery(api.apiKeys.listMyKeys);
  const sub = useQuery(api.billing.getMySubscription);

  const activeKeys = keys?.filter((k) => k.status === "active").length ?? 0;

  if (stats === undefined || keys === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-accent/30 border border-border rounded-xl h-24" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-accent/30 border border-border rounded-xl h-40" />
          <div className="bg-accent/30 border border-border rounded-xl h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SpendingAlertBanner />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Requests" value={stats?.totalRequests ?? "0"} change={stats?.requestsChange} icon={Activity} positive />
        <StatCard title="Total Spend" value={stats?.totalSpend ?? "$0.00"} icon={CreditCard} />
        <StatCard title="Avg Latency" value={stats?.avgLatency ?? "0ms"} icon={Clock} positive={false} />
        <StatCard title="Success Rate" value={stats?.successRate ?? "100%"} icon={Shield} positive />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Active Keys Summary */}
        <div className="bg-accent/30 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-foreground/70">API Keys</h3>
            <span className="text-[10px] text-muted-foreground">{activeKeys} active</span>
          </div>
          <div className="space-y-2">
            {keys?.filter((k) => k.status === "active").slice(0, 3).map((k) => (
              <div key={k._id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <Key className="size-3 text-muted-foreground" />
                  <span className="text-xs text-foreground/70">{k.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{k.keyPrefix}</span>
              </div>
            ))}
            {(!keys || keys.length === 0) && (
              <p className="text-xs text-muted-foreground py-2">Belum ada API key. Buat di tab API Keys.</p>
            )}
          </div>
        </div>

        {/* Credits */}
        <div className="bg-accent/30 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-foreground/70">Credits</h3>
            <Link to="/topup" className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors">
              Top Up →
            </Link>
          </div>
          {sub ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Used</span>
                  <span className="text-foreground/70">{sub.usedCreditsFormatted} / {sub.monthlyCreditsFormatted}</span>
                </div>
                <div className="h-1.5 bg-accent/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(sub.usagePercent, 100)}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Plan</span>
                <span className="text-foreground/70 capitalize">{sub.plan}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Remaining</span>
                <span className="text-emerald-400 font-medium">{sub.remainingCredits}</span>
              </div>
              {/* Spending Alerts */}
              {sub.usagePercent >= 100 && (
                <div className="flex items-start gap-2 bg-red-500/[0.06] border border-red-500/20 rounded-lg p-2.5 mt-2">
                  <AlertTriangle className="size-3.5 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-red-400">Kredit habis! Top up segera untuk melanjutkan API calls.</span>
                </div>
              )}
              {sub.usagePercent >= 90 && sub.usagePercent < 100 && (
                <div className="flex items-start gap-2 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-2.5 mt-2">
                  <AlertTriangle className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-amber-400">Kredit tinggal {(100 - sub.usagePercent).toFixed(0)}% — pertimbangkan top up.</span>
                </div>
              )}
              {sub.usagePercent >= 80 && sub.usagePercent < 90 && (
                <div className="flex items-start gap-2 bg-yellow-500/[0.06] border border-yellow-500/20 rounded-lg p-2.5 mt-2">
                  <AlertTriangle className="size-3.5 text-yellow-400 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-yellow-400">Kredit sudah 80% terpakai.</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">Loading...</p>
          )}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <UsageOverTimeChart />
        <CostOverTimeChart />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ModelBreakdownChart />
        <LatencyChart />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: API KEYS
   ═══════════════════════════════════════════════════════════════ */

function ApiKeysTab() {
  const keys = useQuery(api.apiKeys.listMyKeys);
  const createKey = useMutation(api.apiKeys.createKey);
  const revokeKey = useMutation(api.apiKeys.revokeKey);
  const deleteKey = useMutation(api.apiKeys.deleteKey);

  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newFullKey, setNewFullKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  if (keys === undefined) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between">
          <div className="h-8 w-40 bg-accent/30 rounded" />
          <div className="h-8 w-28 bg-accent/30 rounded" />
        </div>
        {[1,2,3].map(i => <div key={i} className="bg-accent/30 border border-border rounded-xl h-16" />)}
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      const result = await createKey({ name: newKeyName.trim() });
      setNewFullKey(result.fullKey);
      setNewKeyName("");
    } catch (err: any) {
      alert(err.message || "Gagal membuat key");
    }
  };

  const toggleVisible = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">API Keys</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">{keys?.filter((k) => k.status === "active").length ?? 0} active keys</p>
        </div>
        <button onClick={() => { setShowCreate(true); setNewFullKey(null); }}
          className="flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-2 rounded-lg hover:opacity-90 transition-colors">
          <Plus className="size-3.5" /> Create Key
        </button>
      </div>

      {/* New key created — show once */}
      {newFullKey && (
        <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl p-4 space-y-2">
          <p className="text-xs text-emerald-400 font-medium">✅ Key berhasil dibuat! Simpan sekarang — tidak bisa dilihat lagi.</p>
          <div className="flex items-center gap-2 bg-background/30 rounded-lg px-3 py-2">
            <code className="text-xs text-foreground font-mono flex-1 break-all">{newFullKey}</code>
            <CopyButton text={newFullKey} />
          </div>
          <button onClick={() => setNewFullKey(null)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Tutup</button>
        </div>
      )}

      {/* Create form */}
      {showCreate && !newFullKey && (
        <div className="bg-accent/30 border border-border rounded-xl p-4 space-y-3">
          <label className="text-xs text-muted-foreground">Nama Key</label>
          <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production"
            className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-border" />
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors">
              Generate
            </button>
            <button onClick={() => setShowCreate(false)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="space-y-2">
        {keys?.map((k: any) => (
          <div key={k._id} className={`bg-accent/30 border border-border rounded-xl p-4 hover:border-border transition-colors ${k.status === "revoked" ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground/80">{k.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${k.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {k.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {k.status === "active" && (
                  <>
                    <button onClick={() => toggleVisible(k._id)} className="text-muted-foreground hover:text-foreground/70 transition-colors p-1">
                      {visibleKeys.has(k._id) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                    <button onClick={async () => { if (confirm("Revoke key ini?")) await revokeKey({ keyId: k._id as Id<"apiKeys"> }); }}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1">
                      <Shield className="size-3.5" />
                    </button>
                  </>
                )}
                <button onClick={async () => { if (confirm("Hapus key ini permanen?")) await deleteKey({ keyId: k._id as Id<"apiKeys"> }); }}
                  className="text-muted-foreground hover:text-red-400 transition-colors p-1">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[11px] text-muted-foreground font-mono">
                {visibleKeys.has(k._id) ? k.keyPrefix : "sk-ac-••••••••••••"}
              </code>
              <CopyButton text={k.keyPrefix} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span>Created {new Date(k.createdAt).toLocaleDateString("id-ID")}</span>
              {k.lastUsedAt && <span>Last used {new Date(k.lastUsedAt).toLocaleString("id-ID")}</span>}
              <span>Rate limit: {k.rateLimit} RPM</span>
            </div>
          </div>
        ))}
        {(!keys || keys.length === 0) && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Belum ada API key. Klik "Create Key" untuk mulai.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: USAGE
   ═══════════════════════════════════════════════════════════════ */

function UsageTab() {
  const stats = useQuery(api.usage.getMyStats);
  const dailyUsage = useQuery(api.usage.getDailyUsage, { days: 14 });
  const modelBreakdown = useQuery(api.usage.getModelBreakdown);

  if (stats === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-accent/30 border border-border rounded-xl h-24" />)}
        </div>
        <div className="bg-accent/30 border border-border rounded-xl h-40" />
        <div className="bg-accent/30 border border-border rounded-xl h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Requests" value={stats?.totalRequests ?? "0"} change={stats?.requestsChange} icon={Activity} positive />
        <StatCard title="Spend" value={stats?.totalSpend ?? "$0.00"} icon={CreditCard} />
        <StatCard title="Avg Latency" value={stats?.avgLatency ?? "0ms"} icon={Clock} positive={false} />
        <StatCard title="Success Rate" value={stats?.successRate ?? "100%"} icon={Shield} positive />
      </div>

      {/* Daily requests + cost chart */}
      {dailyUsage && dailyUsage.length > 0 && (
        <div className="bg-accent/30 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-foreground/70">Request & Spending (14 hari)</h3>
            <div className="flex items-center gap-3 text-[9px]">
              <span className="flex items-center gap-1"><span className="size-2 bg-blue-500/80 rounded-sm inline-block" /> Requests</span>
              <span className="flex items-center gap-1"><span className="size-2 bg-emerald-500/80 rounded-sm inline-block" /> Cost</span>
            </div>
          </div>
          {/* FIX L1: Pre-compute max values outside the loop (O(n) instead of O(n²)) */}
          <div className="flex items-end gap-1 h-28">
            {(() => {
              const maxReq = Math.max(...dailyUsage.map((x) => x.totalRequests), 1);
              const maxCost = Math.max(...dailyUsage.map((x: any) => x.totalCost ?? 0), 1);
              return dailyUsage.map((d) => {
              const hReq = (d.totalRequests / maxReq) * 100;
              const hCost = ((d as any).totalCost ?? 0) / maxCost * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex gap-px items-end" style={{ height: '100%' }}>
                    <div className="flex-1 bg-blue-500/80 rounded-sm transition-all" style={{ height: `${hReq}%`, minHeight: 2 }} />
                    <div className="flex-1 bg-emerald-500/60 rounded-sm transition-all" style={{ height: `${hCost}%`, minHeight: 2 }} />
                  </div>
                  <span className="text-[7px] text-muted-foreground">{d.date.slice(5)}</span>
                  <div className="absolute bottom-full mb-1 bg-secondary border border-border rounded px-2 py-1 text-[9px] text-foreground/70 hidden group-hover:block z-10 whitespace-nowrap">
                    {d.totalRequests} req · ${(((d as any).totalCost ?? 0) / 100).toFixed(2)}
                  </div>
                </div>
              );
            });
            })()}
          </div>
        </div>
      )}

      {/* Model breakdown table */}
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-medium text-foreground/70">Model Breakdown (30 hari)</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground text-left border-b border-border">
              <th className="p-3 font-medium">Model</th>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium text-right">Requests</th>
              <th className="p-3 font-medium text-right">Tokens</th>
              <th className="p-3 font-medium text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {modelBreakdown?.map((m) => (
              <tr key={m.model} className="hover:bg-accent/30">
                <td className="p-3 text-foreground/80 font-medium">{m.model}</td>
                <td className="p-3 text-muted-foreground">{m.provider}</td>
                <td className="p-3 text-right text-muted-foreground tabular-nums">{m.requests.toLocaleString()}</td>
                <td className="p-3 text-right text-muted-foreground tabular-nums">{m.tokens.toLocaleString()}</td>
                <td className="p-3 text-right text-foreground/70 tabular-nums">${(m.cost / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!modelBreakdown || modelBreakdown.length === 0) && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Belum ada data usage. Mulai gunakan API key untuk melihat statistik.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: LOGS
   ═══════════════════════════════════════════════════════════════ */

function LogsTab() {
  const logs = useQuery(api.usage.getRecentLogs, { limit: 100 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exportFmt, setExportFmt] = useState<"csv" | "json" | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // FIX M17: Close export dropdown on click outside
  const exportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!exportFmt) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportFmt(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportFmt]);

  const handleExport = (fmt: "csv" | "json") => {
    if (!logs || logs.length === 0) return;
    let content: string;
    let mime: string;
    let ext: string;
    if (fmt === "json") {
      content = JSON.stringify(logs.map((l) => ({ time: l.time, model: l.model, provider: l.provider, status: l.status, inputTokens: l.inputTokens, outputTokens: l.outputTokens, latencyMs: l.latencyMs, cost: l.cost, error: l.errorMessage })), null, 2);
      mime = "application/json";
      ext = "json";
    } else {
      const header = "time,model,provider,status,inputTokens,outputTokens,latencyMs,cost,error";
      const rows = logs.map((l) => `${l.time},${l.model},${l.provider},${l.status},${l.inputTokens},${l.outputTokens},${l.latencyMs},${l.cost},"${l.errorMessage || ""}"`);
      content = [header, ...rows].join("\n");
      mime = "text/csv";
      ext = "csv";
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adalahcredit-usage-${new Date().toISOString().split("T")[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportFmt(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Request Logs</h2>
        <div ref={exportRef} className="flex items-center gap-2 relative">
          <button onClick={() => setExportFmt(exportFmt ? null : "csv")} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/30 border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors">
            <Download className="size-3" /> Export
          </button>
          {exportFmt !== null && (
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-10 overflow-hidden">
              <button onClick={() => handleExport("csv")} className="block w-full text-left text-xs text-foreground/70 hover:bg-accent/50 px-4 py-2">Export CSV</button>
              <button onClick={() => handleExport("json")} className="block w-full text-left text-xs text-foreground/70 hover:bg-accent/50 px-4 py-2">Export JSON</button>
            </div>
          )}
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="text" placeholder="Search model, provider..." value={searchQ} onChange={(e) => { setSearchQ(e.target.value); setPage(0); }}
          className="flex-1 bg-accent/30 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground/70 placeholder:text-muted-foreground outline-none focus:border-border" />
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          className="bg-accent/30 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground/70 outline-none">
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="rate_limited">Rate Limited</option>
        </select>
      </div>

      {/* Loading skeleton */}
      {logs === undefined && (
        <div className="bg-accent/30 border border-border rounded-xl p-4 space-y-3 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-accent/50 rounded" />)}
        </div>
      )}

      {(() => {
        const filtered = (logs ?? []).filter((l) => {
          const matchSearch = !searchQ || l.model.toLowerCase().includes(searchQ.toLowerCase()) || l.provider.toLowerCase().includes(searchQ.toLowerCase());
          const matchStatus = filterStatus === "all" || l.status === filterStatus;
          return matchSearch && matchStatus;
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

        return (<>
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground text-left border-b border-border">
              <th className="p-3 font-medium w-6"></th>
              <th className="p-3 font-medium">Time</th>
              <th className="p-3 font-medium">Model</th>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium text-right">Status</th>
              <th className="p-3 font-medium text-right">Tokens</th>
              <th className="p-3 font-medium text-right">Latency</th>
              <th className="p-3 font-medium text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono">
            {paged.map((log) => (
              <Fragment key={log._id}>
                <tr onClick={() => setExpandedId(expandedId === log._id ? null : log._id)} className="hover:bg-accent/30 cursor-pointer">
                  <td className="p-3 text-muted-foreground">{expandedId === log._id ? "▼" : "▶"}</td>
                  <td className="p-3 text-muted-foreground">{log.time}</td>
                  <td className="p-3 text-foreground/70">{log.model}</td>
                  <td className="p-3 text-muted-foreground">{log.provider}</td>
                  <td className="p-3 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${log.status === "success" ? "bg-emerald-500/10 text-emerald-400" : log.status === "rate_limited" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-right text-muted-foreground">{(log.inputTokens + log.outputTokens).toLocaleString()}</td>
                  <td className="p-3 text-right text-muted-foreground">{log.latencyMs}ms</td>
                  <td className="p-3 text-right text-foreground/70">${(log.cost / 100).toFixed(4)}</td>
                </tr>
                {expandedId === log._id && (
                  <tr>
                    <td colSpan={8} className="bg-accent/30 p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-muted-foreground block">Input Tokens</span><span className="text-foreground/70">{log.inputTokens.toLocaleString()}</span></div>
                        <div><span className="text-muted-foreground block">Output Tokens</span><span className="text-foreground/70">{log.outputTokens.toLocaleString()}</span></div>
                        <div><span className="text-muted-foreground block">Latency</span><span className="text-foreground/70">{log.latencyMs}ms</span></div>
                        <div><span className="text-muted-foreground block">Cost</span><span className="text-foreground/70">${(log.cost / 100).toFixed(6)}</span></div>
                        <div><span className="text-muted-foreground block">Timestamp</span><span className="text-foreground/70">{new Date(log.createdAt).toLocaleString("id-ID")}</span></div>
                        <div><span className="text-muted-foreground block">API Key</span><span className="text-foreground/70 truncate block">{String(log.apiKeyId).slice(-8)}</span></div>
                        {log.errorMessage && <div className="col-span-2"><span className="text-muted-foreground block">Error</span><span className="text-red-400">{log.errorMessage}</span></div>}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {paged.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {searchQ || filterStatus !== "all" ? "Tidak ada hasil yang cocok." : "Belum ada request logs. Logs akan muncul saat API digunakan."}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-muted-foreground">{filtered.length} results · Page {page + 1}/{totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="text-xs text-muted-foreground hover:text-foreground bg-accent/30 border border-border px-3 py-1 rounded-lg disabled:opacity-30">Prev</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="text-xs text-muted-foreground hover:text-foreground bg-accent/30 border border-border px-3 py-1 rounded-lg disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
        </>);
      })()}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: BILLING
   ═══════════════════════════════════════════════════════════════ */

function BillingTab() {
  const sub = useQuery(api.billing.getMySubscription);
  const myPlan = useQuery(api.subscriptionEngine.getMyPlan);
  const transactions = useQuery(api.billing.getTransactionHistory, { limit: 20 });
  const subOrders = useQuery(api.subscriptionEngine.getMySubscriptionOrders, { limit: 10 });

  if (sub === undefined && myPlan === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-accent/30 border border-border rounded-xl h-36" />
        <div className="bg-accent/30 border border-border rounded-xl h-48" />
        <div className="bg-accent/30 border border-border rounded-xl h-32" />
      </div>
    );
  }

  const planData = myPlan ?? null;

  return (
    <div className="space-y-6">
      {/* Current plan + balance */}
      <div className="bg-accent/30 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Plan: <span className="capitalize">{planData?.planName ?? sub?.plan ?? "Free"}</span>
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Model tier: <span className="capitalize font-medium">{planData?.modelTier ?? "free"}</span>
              {planData?.allowedModelTiers && ` (${planData.allowedModelTiers.join(", ")})`}
            </p>
          </div>
          <Link to="/topup" className="flex items-center gap-1.5 text-xs font-medium text-black bg-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-300 transition-colors">
            <Wallet className="size-3.5" /> Upgrade / Top Up
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Monthly Credits</div>
            <div className="text-lg font-bold text-foreground">{planData?.monthlyCreditsFormatted ?? sub?.monthlyCreditsFormatted ?? "$0.00"}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Used</div>
            <div className="text-lg font-bold text-foreground">{planData?.usedCreditsFormatted ?? sub?.usedCreditsFormatted ?? "$0.00"}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Remaining</div>
            <div className="text-lg font-bold text-emerald-400">{planData?.remainingFormatted ?? sub?.remainingCredits ?? "$0.00"}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">PAYG Balance</div>
            <div className="text-lg font-bold text-blue-400">{planData?.balanceFormatted ?? "$0.00"}</div>
          </div>
        </div>

        {/* Total available */}
        <div className="mt-3 flex items-center justify-between bg-accent/40 rounded-lg px-3 py-2">
          <span className="text-[10px] text-muted-foreground">Total Tersedia (Credits + PAYG)</span>
          <span className="text-sm font-bold text-emerald-400">{planData?.totalAvailableFormatted ?? "$0.00"}</span>
        </div>

        {/* Usage bar */}
        {(sub || planData) && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Pemakaian Credit</span>
              <span>{sub?.usagePercent ?? 0}%</span>
            </div>
            <div className="h-1.5 bg-accent/50 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${(sub?.usagePercent ?? 0) > 80 ? "bg-red-500" : (sub?.usagePercent ?? 0) > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(sub?.usagePercent ?? 0, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">{planData?.daysLeft ?? sub?.daysLeft ?? 0} hari tersisa</p>
              <p className="text-[10px] text-muted-foreground">Rate limit: {planData?.rateLimit ?? 10} RPM</p>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Orders */}
      {subOrders && subOrders.length > 0 && (
        <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Riwayat Order</h3>
          </div>
          <div className="divide-y divide-border">
            {subOrders.map((o) => (
              <div key={o._id} className="p-4 flex items-center justify-between hover:bg-accent/20 transition-colors">
                <div>
                  <div className="text-xs text-foreground/70">
                    {o.type === "topup" ? "Top-up PAYG" : `${o.type === "new" ? "Langganan" : "Upgrade"} ${o.plan?.toUpperCase() ?? ""}`}
                    {" — "}Rp {o.amountIdr.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    {o.creditAmountCents ? ` • $${(o.creditAmountCents / 100).toFixed(2)}` : ""}
                  </div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                  o.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" :
                  o.status === "paid" ? "bg-blue-500/10 text-blue-400" :
                  o.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                  o.status === "rejected" ? "bg-red-500/10 text-red-400" :
                  "bg-zinc-500/10 text-zinc-400"
                }`}>
                  {o.status === "confirmed" ? "✓ Dikonfirmasi" :
                   o.status === "paid" ? "Menunggu Admin" :
                   o.status === "pending" ? "Belum Bayar" :
                   o.status === "rejected" ? "Ditolak" : o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Riwayat Transaksi</h3>
        </div>
        <div className="divide-y divide-border">
          {transactions?.map((tx) => (
            <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
              <div>
                <div className="text-xs text-foreground/70">{tx.description}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("id-ID")}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-medium tabular-nums ${tx.type === "credit" || tx.type === "refund" ? "text-emerald-400" : "text-foreground/70"}`}>
                  {tx.type === "credit" || tx.type === "refund" ? "+" : "-"}${(tx.amount / 100).toFixed(2)}
                </div>
                <div className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block ${tx.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : tx.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Belum ada transaksi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: SETTINGS
   ═══════════════════════════════════════════════════════════════ */

function SettingsTab() {
  const { profile } = useEnsureProfile();
  const updateProfile = useMutation(api.profiles.updateProfile);
  const deleteAccount = useMutation(api.users.deleteAccount);
  // FIX M16: Use controlled value, sync from profile when loaded
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [delConfirm, setDelConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuthActions();

  // Sync name from profile when loaded (FIX M16)
  useEffect(() => {
    if (profile?.displayName && !name) setName(profile.displayName);
  }, [profile?.displayName]);

  // FIX M3: Error handling for save
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaveErr("");
    try {
      await updateProfile({ displayName: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setSaveErr(e?.message ?? "Failed to save");
    }
  };

  // FIX M1: Wire up delete account with confirmation
  const handleDelete = async () => {
    if (!delConfirm) { setDelConfirm(true); return; }
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      navigate("/login");
    } catch (e: any) {
      setSaveErr(e?.message ?? "Failed to delete account");
      setDeleting(false);
      setDelConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-accent/30 border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama"
              className="w-full sm:w-80 bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Email</label>
            <input type="email" value={profile?.email ?? ""} disabled
              className="w-full sm:w-80 bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none cursor-not-allowed" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Referral Code</label>
            <div className="flex items-center gap-2">
              <code className="text-sm text-foreground/70 font-mono bg-accent/30 border border-border rounded-lg px-3 py-2">
                {profile?.referralCode ?? "..."}
              </code>
              {profile?.referralCode && <CopyButton text={profile.referralCode} />}
            </div>
          </div>
        </div>
        {saveErr && <p className="text-xs text-red-400">{saveErr}</p>}
        <button onClick={handleSave} className="flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors">
          {saved ? <><Check className="size-3.5 text-emerald-600" /> Saved</> : "Save Changes"}
        </button>
      </div>

      {/* Danger zone — FIX M1: working delete with confirmation */}
      <div className="bg-red-500/[0.02] border border-red-500/[0.08] rounded-xl p-5">
        <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-3">Menghapus akun akan menghapus semua data termasuk API keys, usage logs, dan saldo credit.</p>
        {delConfirm && (
          <p className="text-xs text-red-400 mb-2 font-medium">⚠️ Yakin? Klik lagi untuk konfirmasi hapus akun secara permanen.</p>
        )}
        <button onClick={handleDelete} disabled={deleting}
          className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50">
          {deleting ? "Menghapus..." : delConfirm ? "Konfirmasi Hapus Akun" : "Delete Account"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: TEAM (placeholder — backed by real data when team exists)
   ═══════════════════════════════════════════════════════════════ */

function TeamTab() {
  const { profile } = useEnsureProfile();
  const team = useQuery(api.teamFunctions.getMyTeam);
  const createTeam = useMutation(api.teamFunctions.createTeam);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  if (team === undefined) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-accent/30 border border-border rounded-xl h-20" />
        <div className="bg-accent/30 border border-border rounded-xl h-48" />
      </div>
    );
  }

  // FIX M6: Show error to user instead of just console.error
  const [teamErr, setTeamErr] = useState("");
  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    setTeamErr("");
    try {
      await createTeam({ name: teamName.trim() });
      setTeamName("");
    } catch (e: any) {
      setTeamErr(e?.message ?? "Gagal membuat team");
    }
    setCreating(false);
  };

  const ROLE_COLORS: Record<string, string> = {
    owner: "text-emerald-400 bg-emerald-500/10",
    admin: "text-blue-400 bg-blue-500/10",
    member: "text-muted-foreground bg-zinc-500/10",
    viewer: "text-muted-foreground bg-zinc-500/10",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Team</h2>
      </div>

      {team ? (
        <>
          <div className="bg-accent/30 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground/80">{team.name}</h3>
              <span className="text-[10px] text-muted-foreground">{team.members.length} member{team.members.length > 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-border">
              {team.members.map((m) => (
                <div key={m._id} className="flex items-center gap-3 py-2.5">
                  <div className="size-8 rounded-full bg-accent/50 flex items-center justify-center text-xs text-muted-foreground font-medium">
                    {(m.displayName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground/80">{m.displayName}</div>
                    <div className="text-[10px] text-muted-foreground">{m.email}</div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role] || ROLE_COLORS.member}`}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-500/[0.04] border border-blue-500/[0.08] rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground/70">Info:</strong> Fitur invite member via email akan segera hadir. Hubungi admin untuk menambah anggota tim.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="bg-accent/30 border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 py-2">
              <div className="size-8 rounded-full bg-accent/50 flex items-center justify-center text-xs text-muted-foreground font-medium">
                {(profile?.displayName ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground/80">{profile?.displayName ?? "You"}</div>
                <div className="text-[10px] text-muted-foreground">{profile?.email ?? ""}</div>
              </div>
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Owner</span>
            </div>
          </div>
          <div className="bg-accent/30 border border-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground/80 mb-2">Buat Team</h3>
            <p className="text-xs text-muted-foreground mb-3">Buat team untuk berbagi API keys dan usage limits dengan anggota tim.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nama team..."
                className="flex-1 bg-accent/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground/70 outline-none placeholder-muted-foreground focus:border-border"
              />
              <button
                onClick={handleCreateTeam}
                disabled={!teamName.trim() || creating}
                className="flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              >
                <Plus className="size-3.5" /> Buat
              </button>
            </div>
            {teamErr && <p className="text-xs text-red-400 mt-2">{teamErr}</p>}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: WEBHOOKS (real Convex data)
   ═══════════════════════════════════════════════════════════════ */

function WebhooksTab() {
  const webhooks = useQuery(api.webhookFunctions.listMyWebhooks);
  const createWebhook = useMutation(api.webhookFunctions.createWebhook);
  const deleteWebhook = useMutation(api.webhookFunctions.deleteWebhook);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["usage.limit", "key.created"]);
  const [creating, setCreating] = useState(false);

  const AVAILABLE_EVENTS = ["usage.limit", "key.created", "key.revoked", "billing.topup", "request.error"];

  if (webhooks === undefined) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between">
          <div className="h-8 w-32 bg-accent/30 rounded" />
          <div className="h-8 w-24 bg-accent/30 rounded" />
        </div>
        <div className="bg-accent/30 border border-border rounded-xl h-36" />
      </div>
    );
  }

  // FIX M7: Show error to user for webhook create/delete
  const [whErr, setWhErr] = useState("");
  const handleCreate = async () => {
    if (!newUrl.trim()) return;
    setCreating(true);
    setWhErr("");
    try {
      await createWebhook({ url: newUrl.trim(), events: newEvents });
      setNewUrl("");
      setShowAdd(false);
    } catch (e: any) { setWhErr(e?.message ?? "Gagal membuat webhook"); }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Webhooks</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="size-3.5" /> Add Webhook
        </button>
      </div>
      {whErr && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{whErr}</p>}

      {showAdd && (
        <div className="bg-accent/30 border border-border rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Endpoint URL</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-server.com/webhooks"
              className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground/70 outline-none placeholder-muted-foreground focus:border-border font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Events</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_EVENTS.map(ev => (
                <button
                  key={ev}
                  onClick={() => setNewEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                    newEvents.includes(ev) ? "border-border bg-accent/50 text-foreground/80" : "border-border text-muted-foreground hover:text-muted-foreground"
                  }`}
                >
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground px-3 py-1.5 hover:text-foreground/70 transition-colors">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!newUrl.trim() || creating}
              className="text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Webhook"}
            </button>
          </div>
        </div>
      )}

      {webhooks && webhooks.length > 0 ? (
        <div className="bg-accent/30 border border-border rounded-xl divide-y divide-border">
          {webhooks.map(wh => (
            <div key={wh._id} className="p-4 flex items-start gap-3">
              <div className="size-8 rounded-lg bg-accent/50 flex items-center justify-center shrink-0 mt-0.5">
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground/80 font-mono truncate">{wh.url}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {wh.events.map(ev => (
                    <span key={ev} className="text-[9px] text-muted-foreground bg-accent/30 px-1.5 py-0.5 rounded">{ev}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span className={wh.status === "active" ? "text-emerald-400" : "text-amber-400"}>{wh.status}</span>
                  <span>Fails: {wh.failCount}</span>
                  <span>{new Date(wh.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={async () => { try { await deleteWebhook({ webhookId: wh._id }); } catch (e: any) { setWhErr(e?.message ?? "Gagal hapus webhook"); } }}
                className="p-1.5 hover:bg-red-500/10 rounded transition-colors shrink-0"
                title="Delete"
              >
                <Trash2 className="size-3.5 text-muted-foreground hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-accent/30 border border-border rounded-xl p-8 text-center">
          <ExternalLink className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">Belum ada webhook</p>
          <p className="text-xs text-muted-foreground">Webhook akan mengirim notifikasi real-time saat ada event penting.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: MODEL ALIASES — CRUD for custom model name mappings
   ═══════════════════════════════════════════════════════════════ */

function ModelAliasesTab() {
  const aliases = useQuery(api.modelAliases.list);
  const createAlias = useMutation(api.modelAliases.create);
  const updateAlias = useMutation(api.modelAliases.update);
  const removeAlias = useMutation(api.modelAliases.remove);
  const [showForm, setShowForm] = useState(false);
  const [alias, setAlias] = useState("");
  const [targetModel, setTargetModel] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleCreate = async () => {
    if (!alias.trim() || !targetModel.trim()) return;
    setCreating(true);
    try {
      await createAlias({ alias: alias.trim(), targetModel: targetModel.trim(), description: description.trim() || undefined });
      setAlias(""); setTargetModel(""); setDescription(""); setShowForm(false);
    } catch (e: any) { alert(e.message); }
    setCreating(false);
  };

  const handleUpdate = async (aliasId: any) => {
    try {
      await updateAlias({ aliasId, targetModel: editTarget.trim() || undefined, description: editDesc.trim() || undefined });
      setEditingId(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (aliasId: any) => {
    if (!confirm("Delete this alias?")) return;
    await removeAlias({ aliasId });
  };

  if (aliases === undefined) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-accent/30 border border-border rounded-xl h-20" />
        <div className="bg-accent/30 border border-border rounded-xl h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Model Aliases</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Buat nama custom untuk model. Gunakan alias di API request dan akan otomatis di-resolve ke model asli.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-2 rounded-lg hover:opacity-90 transition-colors">
          <Plus className="size-3.5" /> Tambah Alias
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-accent/30 border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-medium text-foreground/80">Alias Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Alias Name</label>
              <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="my-fast"
                className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-border" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Target Model</label>
              <input type="text" value={targetModel} onChange={(e) => setTargetModel(e.target.value)} placeholder="gpt-4o-mini"
                className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-border" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Model cepat untuk chatbot..."
              className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-border" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={!alias.trim() || !targetModel.trim() || creating}
              className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">
              {creating ? "Saving..." : "Save Alias"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Example usage hint */}
      <div className="bg-blue-500/[0.04] border border-blue-500/[0.08] rounded-xl p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground/70">💡 Contoh:</strong> Buat alias <code className="text-blue-400 bg-blue-500/10 px-1 rounded">my-fast</code> → <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">gpt-4o-mini</code>, lalu gunakan <code className="text-blue-400 bg-blue-500/10 px-1 rounded">"model": "my-fast"</code> di API request.
        </p>
      </div>

      {/* Alias list */}
      {aliases.length > 0 ? (
        <div className="bg-accent/30 border border-border rounded-xl divide-y divide-border overflow-hidden">
          {aliases.map((a) => (
            <div key={a._id} className="p-4 hover:bg-accent/20 transition-colors">
              {editingId === a._id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Target Model</label>
                      <input type="text" value={editTarget} onChange={(e) => setEditTarget(e.target.value)}
                        className="w-full bg-accent/30 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground/80 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Description</label>
                      <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-accent/30 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground/80 outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(a._id)} className="text-[10px] font-medium bg-foreground text-background px-3 py-1.5 rounded-lg">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-[10px] text-muted-foreground px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <code className="text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded text-xs">{a.alias}</code>
                      <span className="text-muted-foreground">→</span>
                      <code className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{a.targetModel}</code>
                    </div>
                    {a.description && <p className="text-[10px] text-muted-foreground mt-1">{a.description}</p>}
                    <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button onClick={() => { setEditingId(a._id); setEditTarget(a.targetModel); setEditDesc(a.description ?? ""); }}
                      className="p-1.5 hover:bg-accent/50 rounded transition-colors" title="Edit">
                      <Edit2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button onClick={() => handleDelete(a._id)}
                      className="p-1.5 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                      <Trash2 className="size-3.5 text-muted-foreground hover:text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-accent/30 border border-border rounded-xl p-8 text-center">
          <Tag className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">Belum ada model alias</p>
          <p className="text-xs text-muted-foreground">Buat alias untuk mempermudah pemanggilan model di API request.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: SPENDING LIMITS — budget alerts and spending caps
   ═══════════════════════════════════════════════════════════════ */

function SpendingLimitsTab() {
  const limits = useQuery(api.spendingLimits.list);
  const keys = useQuery(api.apiKeys.listMyKeys);
  const createLimit = useMutation(api.spendingLimits.create);
  const updateLimit = useMutation(api.spendingLimits.update);
  const removeLimit = useMutation(api.spendingLimits.remove);
  const [showForm, setShowForm] = useState(false);
  const [limitAmount, setLimitAmount] = useState("");
  const [action, setAction] = useState<"warn" | "block">("warn");
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const cents = Math.round(parseFloat(limitAmount) * 100);
    if (isNaN(cents) || cents <= 0) return;
    setCreating(true);
    try {
      await createLimit({
        limitCents: cents,
        action,
        apiKeyId: selectedKeyId ? (selectedKeyId as any) : undefined,
      });
      setLimitAmount(""); setSelectedKeyId(""); setShowForm(false);
    } catch (e: any) { alert(e.message); }
    setCreating(false);
  };

  // FIX M8: Error handling for toggle and delete
  const [limitErr, setLimitErr] = useState("");
  const handleToggle = async (alertId: any, currentEnabled: boolean) => {
    setLimitErr("");
    try { await updateLimit({ alertId, enabled: !currentEnabled }); }
    catch (e: any) { setLimitErr(e?.message ?? "Gagal update limit"); }
  };

  const handleDelete = async (alertId: any) => {
    if (!confirm("Delete this spending limit?")) return;
    setLimitErr("");
    try { await removeLimit({ alertId }); }
    catch (e: any) { setLimitErr(e?.message ?? "Gagal hapus limit"); }
  };

  if (limits === undefined) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-accent/30 border border-border rounded-xl h-20" />
        <div className="bg-accent/30 border border-border rounded-xl h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Spending Limits</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Atur batas pengeluaran bulanan per key atau untuk seluruh akun. Pilih aksi: warning atau block otomatis.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-2 rounded-lg hover:opacity-90 transition-colors">
          <Plus className="size-3.5" /> Tambah Limit
        </button>
      </div>
      {limitErr && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{limitErr}</p>}

      {/* Create form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-accent/30 border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-medium text-foreground/80">Limit Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Monthly Limit (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input type="number" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} placeholder="10.00" step="0.01"
                  className="w-full bg-accent/30 border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-foreground/80 outline-none focus:border-border" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Aksi</label>
              <div className="flex gap-2">
                <button onClick={() => setAction("warn")}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${action === "warn" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-accent/30 border-border text-muted-foreground hover:text-foreground"}`}>
                  ⚠️ Warn
                </button>
                <button onClick={() => setAction("block")}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${action === "block" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-accent/30 border-border text-muted-foreground hover:text-foreground"}`}>
                  🛑 Block
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Scope</label>
              <select value={selectedKeyId} onChange={(e) => setSelectedKeyId(e.target.value)}
                className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none">
                <option value="">🌐 Seluruh Akun</option>
                {keys?.map((k: any) => (
                  <option key={k._id} value={k._id}>🔑 {k.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={!limitAmount || creating}
              className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">
              {creating ? "Saving..." : "Save Limit"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Info */}
      <div className="bg-blue-500/[0.04] border border-blue-500/[0.08] rounded-xl p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground/70">💡 Tips:</strong> <strong className="text-amber-400">Warn</strong> mengirim notifikasi saat limit tercapai. <strong className="text-red-400">Block</strong> otomatis menolak request API yang melebihi batas.
        </p>
      </div>

      {/* Limits list */}
      {limits.length > 0 ? (
        <div className="space-y-3">
          {limits.map((l) => {
            const usagePercent = l.limitCents > 0 ? Math.min(100, Math.round((l.currentSpendCents / l.limitCents) * 100)) : 0;
            const keyName = l.apiKeyId ? keys?.find((k: any) => k._id === l.apiKeyId)?.name : null;

            return (
              <div key={l._id} className={`bg-accent/30 border rounded-xl p-4 transition-colors ${l.enabled ? "border-border" : "border-border/50 opacity-60"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.action === "block" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                      {l.action === "block" ? "🛑 Block" : "⚠️ Warn"}
                    </span>
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-accent/50 rounded-full">
                      {keyName ? `🔑 ${keyName}` : "🌐 All Keys"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(l._id, l.enabled)} className="p-1.5 hover:bg-accent/50 rounded transition-colors" title={l.enabled ? "Disable" : "Enable"}>
                      {l.enabled ? <ToggleRight className="size-5 text-emerald-400" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => handleDelete(l._id)} className="p-1.5 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                      <Trash2 className="size-3.5 text-muted-foreground hover:text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-lg font-bold text-foreground tabular-nums">${(l.currentSpendCents / 100).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">/ ${(l.limitCents / 100).toFixed(2)}</div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-accent/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{usagePercent}% used</span>
                  <span className="text-[10px] text-muted-foreground">Period: {new Date(l.periodStart).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-accent/30 border border-border rounded-xl p-8 text-center">
          <DollarSign className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">Belum ada spending limit</p>
          <p className="text-xs text-muted-foreground">Atur batas pengeluaran untuk kontrol budget API kamu.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export function UserDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useEnsureProfile();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  // FIX M18: Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // FIX L3: Plain lookup — no need for useMemo on a static map
  const TABS: Record<Tab, React.FC> = {
    overview: OverviewTab,
    keys: ApiKeysTab,
    usage: UsageTab,
    logs: LogsTab,
    billing: BillingTab,
    aliases: ModelAliasesTab,
    limits: SpendingLimitsTab,
    settings: SettingsTab,
    team: TeamTab,
    webhooks: WebhooksTab,
  };
  const TabContent = TABS[activeTab];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const avatar = (profile?.displayName ?? "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-background border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-white flex items-center justify-center">
              <Zap className="size-3.5 text-black" />
            </div>
            <span className="text-sm font-semibold">AdalahCredit</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <Link to="/" className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground/80 hover:bg-accent/30 rounded-lg transition-colors mb-2">
            <Home className="size-4" /> Home
          </Link>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${activeTab === item.id ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-accent/30"}`}>
              {item.icon} {item.label}
            </button>
          ))}

          {/* Top Up link */}
          <Link to="/topup" className="flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/[0.05] rounded-lg transition-colors mt-2">
            <Wallet className="size-4" /> Top Up
          </Link>
          <Link to="/docs" className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground/80 hover:bg-accent/30 rounded-lg transition-colors">
            <BookOpen className="size-4" /> Docs
          </Link>
          {profile?.role === "admin" && (
            <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/[0.05] rounded-lg transition-colors mt-1">
              <Shield className="size-4" /> Admin Panel
            </Link>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="size-7 rounded-full bg-accent/50 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground/80 truncate">{profile?.displayName ?? "Loading..."}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{profile?.plan ?? "free"} Plan</div>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-56">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="size-5" />
            </button>
            <h1 className="text-sm font-medium text-foreground/80">{NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyToggle />
            <ThemeToggle />
            {/* FIX M2: Removed dead search button (no global search implemented) */}
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <TabContent />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
