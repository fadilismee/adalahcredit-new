import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminRevenueChart, AdminUserGrowthChart } from "@/components/AnalyticsCharts";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users,
  Activity,
  Server,
  Shield,
  AlertTriangle,
  BarChart3,
  Settings,
  Zap,
  CreditCard,
  Clock,
  Search,
  Download,

  CheckCircle2,
  Eye,

  Menu,
  Home,
  LogOut,
  Cpu,
  FileText,
  ExternalLink,
  Key,
  Wallet,
  QrCode,
  Check,
  X,
  Link2,
  Moon,
  Sun,
  Crown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ConnectionsPanel } from "@/components/connections";

/* ═══════════════════════════════════════════════════════════════
   DUMMY DATA
   ═══════════════════════════════════════════════════════════════ */

/* Dummy data removed — Overview & Users tabs now use real Convex queries */

/* Provider and Model data now come from Convex queries (no more dummy data) */

/* Audit logs now come from Convex auditLog query */

/* All data now from Convex queries */

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

type AdminTab = "overview" | "users" | "models" | "provider-config" | "connections" | "pricing" | "payments" | "audit" | "system";

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="size-4" /> },
  { id: "users", label: "Users", icon: <Users className="size-4" /> },
  { id: "models", label: "Models", icon: <Cpu className="size-4" /> },
  { id: "provider-config", label: "API Keys", icon: <Key className="size-4" /> },
  { id: "connections", label: "Connections", icon: <Link2 className="size-4" /> },
  { id: "pricing", label: "Pricing", icon: <CreditCard className="size-4" /> },
  { id: "payments", label: "Payments", icon: <Wallet className="size-4" /> },
  { id: "audit", label: "Audit Log", icon: <FileText className="size-4" /> },
  { id: "system", label: "System", icon: <Settings className="size-4" /> },
];

function AdminStatCard({ title, value, sub, icon: Icon, accent }: { title: string; value: string; sub?: string; icon: React.FC<{ className?: string }>; accent?: string }) {
  return (
    <div className="bg-accent/30 border border-border rounded-xl p-4 hover:border-border transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="size-7 rounded-lg bg-accent/50 flex items-center justify-center">
          <Icon className={`size-3.5 ${accent || "text-muted-foreground"}`} />
        </div>
      </div>
      <div className="text-xl font-bold text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniAreaChart({ data }: { data: { hour: string; req: number }[] }) {
  if (!data.length) return <div className="w-full h-24 mt-3 flex items-center justify-center text-xs text-muted-foreground">No data</div>;
  const max = Math.max(...data.map((d) => d.req), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.req / max) * 100;
    return `${x},${y}`;
  }).join(" ");
  const fillPoints = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-24 mt-3">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#areaGrad)" />
      <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    operational: "bg-emerald-500/10 text-emerald-400",
    degraded: "bg-amber-500/10 text-amber-400",
    down: "bg-red-500/10 text-red-400",
    active: "bg-emerald-500/10 text-emerald-400",
    suspended: "bg-amber-500/10 text-amber-400",
    banned: "bg-red-500/10 text-red-400",
    disabled: "bg-zinc-500/10 text-zinc-400",
  };
  const dotStyles: Record<string, string> = {
    operational: "bg-emerald-400",
    active: "bg-emerald-400",
    degraded: "bg-amber-400",
    suspended: "bg-amber-400",
    down: "bg-red-400",
    banned: "bg-red-400",
    disabled: "bg-zinc-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || "bg-zinc-500/10 text-muted-foreground"}`}>
      <span className={`size-1.5 rounded-full ${dotStyles[status] || "bg-zinc-400"}`} />
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    info: "bg-blue-500/10 text-blue-400",
    warning: "bg-amber-500/10 text-amber-400",
    critical: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[severity] || "bg-zinc-500/10 text-muted-foreground"}`}>
      {severity}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW: Provider Status + Audit (real data)
   ═══════════════════════════════════════════════════════════════ */

function OverviewProvidersAndAudit() {
  const providers = useQuery(api.providers.getAllProviders);
  const auditLogs = useQuery(api.auditLog.listAuditLogs, { limit: 6 });

  const enabledProviders = providers?.filter((p) => p.enabled) ?? [];
  const totalProviders = providers?.length ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Provider status */}
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Provider Status</h3>
          <span className="text-[10px] text-emerald-400">{enabledProviders.length}/{totalProviders} enabled</span>
        </div>
        <div className="divide-y divide-border">
          {totalProviders === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No providers configured yet</div>
          ) : (
            (providers ?? []).slice(0, 8).map((p) => (
              <div key={p._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.enabled ? "operational" : "disabled"} />
                  <span className="text-xs text-foreground/70">{p.displayName}</span>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">{p.models.length} models</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent audit */}
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Recent Audit Events</h3>
        </div>
        <div className="divide-y divide-border">
          {!auditLogs || auditLogs.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No audit events yet</div>
          ) : (
            auditLogs.map((l) => (
              <div key={l._id} className="px-4 py-2.5 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2 mb-0.5">
                  <SeverityBadge severity="info" />
                  <span className="text-xs text-foreground/70">{l.action}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{new Date(l.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-[calc(0.375rem+0.75rem)]">{l.resource}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: OVERVIEW
   ═══════════════════════════════════════════════════════════════ */

function AdminOverviewTab() {
  const stats = useQuery(api.admin.getDashboardStats);
  const sysOverview = useQuery(api.admin.getSystemOverview);

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard title="Total Users" value={stats?.totalUsers?.toLocaleString() ?? "—"} sub={`${stats?.proUsers ?? 0} pro/enterprise`} icon={Users} accent="text-blue-400" />
        <AdminStatCard title="Revenue (30d)" value={stats?.totalRevenue ?? "—"} sub="Last 30 days" icon={CreditCard} accent="text-emerald-400" />
        <AdminStatCard title="Total Requests" value={stats?.totalRequests ?? "—"} sub="Last 30 days" icon={Activity} accent="text-purple-400" />
        <AdminStatCard title="System Uptime" value={sysOverview?.avgUptime ?? "—"} sub={`${sysOverview?.services.operational ?? 0}/${sysOverview?.services.total ?? 0} operational`} icon={Shield} accent="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic chart */}
        <div className="lg:col-span-2 bg-accent/30 border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Traffic (24h)</h3>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Live</span>
            </div>
          </div>
          <MiniAreaChart data={[]} />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
          </div>
        </div>

        {/* Recent signups */}
        <div className="bg-accent/30 border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Recent Signups</h3>
          {stats?.recentSignups && stats.recentSignups.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSignups.slice(0, 6).map((u, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-foreground/70">{u.displayName}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{u.plan}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{u.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada user terdaftar.</p>
          )}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminRevenueChart />
        <AdminUserGrowthChart />
      </div>

      {/* Provider status + audit */}
      <OverviewProvidersAndAudit />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: USERS (Real Convex data)
   ═══════════════════════════════════════════════════════════════ */

function AdminUsersTab() {
  const users = useQuery(api.admin.listAllUsers, { limit: 500 });
  const updateRole = useMutation(api.profiles.updateRole);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 20;

  // Filter & search
  const filtered = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchSearch = !searchQuery || 
        (u.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlan = planFilter === "all" || u.plan === planFilter;
      return matchSearch && matchPlan;
    });
  }, [users, searchQuery, planFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Export to CSV
  const handleExport = () => {
    if (!filtered.length) return;
    const headers = ["Name", "Email", "Plan", "Keys", "Spend", "Status", "Joined"];
    const rows = filtered.map((u) => [
      u.displayName, u.email, u.plan, u.activeKeys,
      u.subscription?.usedCredits ?? "$0",
      u.subscription?.status ?? "active",
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `users-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Safe initials
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Users</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-accent/30 border border-border rounded-lg px-3 py-1.5">
            <Search className="size-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-foreground/70 placeholder-muted-foreground outline-none w-36"
            />
          </div>
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs text-muted-foreground bg-accent/50 border border-border rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="all">All Plans</option>
            <option value="enterprise">Enterprise</option>
            <option value="pro">Pro</option>
            <option value="starter">Starter</option>
            <option value="free">Free</option>
          </select>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/50 border border-border rounded-lg px-3 py-1.5 hover:text-foreground transition-colors"
          >
            <Download className="size-3" /> Export
          </button>
        </div>
      </div>

      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Keys</th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Spend</th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <React.Fragment key={u._id}>
                <tr className={`border-b border-border transition-colors ${viewingUser === u._id ? "bg-accent/40" : "hover:bg-accent/30"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-[9px] font-bold text-foreground/70">
                        {getInitials(u.displayName)}
                      </div>
                      <div>
                        <div className="text-xs text-foreground/80 font-medium">{u.displayName || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${u.plan === "enterprise" ? "bg-purple-500/10 text-purple-400" : u.plan === "pro" ? "bg-blue-500/10 text-blue-400" : "bg-zinc-500/10 text-muted-foreground"}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{u.activeKeys}</td>
                  <td className="px-4 py-3 text-foreground/70 text-right tabular-nums font-medium">{u.subscription?.usedCredits ?? "$0.00"}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.subscription?.status ?? "active"} /></td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingUser(viewingUser === u._id ? null : u._id)}
                        className={`p-1 rounded transition-colors ${viewingUser === u._id ? "bg-blue-500/10" : "hover:bg-accent/50"}`}
                        title="View Details"
                      >
                        <Eye className={`size-3.5 ${viewingUser === u._id ? "text-blue-400" : "text-muted-foreground"}`} />
                      </button>
                      {u.role !== "admin" && (
                        <button
                          onClick={() => { if (confirm(`Promote ${u.displayName} to admin?`)) updateRole({ userId: u.userId, role: "admin" }); }}
                          className="p-1 hover:bg-emerald-500/10 rounded transition-colors"
                          title="Make Admin"
                        >
                          <Shield className="size-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {viewingUser === u._id && (
                  <tr className="border-b border-border">
                    <td colSpan={7} className="p-0">
                      <div className="bg-accent/20 border-t border-blue-500/10 p-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-accent/30 border border-border rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">User ID</div>
                            <div className="text-xs text-foreground/80 font-mono break-all">{u.userId}</div>
                          </div>
                          <div className="bg-accent/30 border border-border rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Role</div>
                            <div className="text-xs text-foreground/80 font-medium capitalize">{u.role}</div>
                          </div>
                          <div className="bg-accent/30 border border-border rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Plan</div>
                            <div className="text-xs text-foreground/80 font-medium capitalize">{u.plan}</div>
                          </div>
                          <div className="bg-accent/30 border border-border rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Active API Keys</div>
                            <div className="text-xs text-foreground/80 font-medium">{u.activeKeys}</div>
                          </div>
                        </div>
                        {u.subscription && (
                          <div className="bg-accent/30 border border-border rounded-lg p-4">
                            <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Subscription Info</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <div className="text-[10px] text-muted-foreground">Status</div>
                                <StatusBadge status={u.subscription.status ?? "active"} />
                              </div>
                              <div>
                                <div className="text-[10px] text-muted-foreground">Credits Used</div>
                                <div className="text-xs text-foreground/80 font-medium">{u.subscription.usedCredits ?? "$0.00"}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-muted-foreground">Monthly Credits</div>
                                <div className="text-xs text-foreground/80 font-medium">{u.subscription.monthlyCredits ?? "—"}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-muted-foreground">Plan</div>
                                <div className="text-xs text-foreground/80 font-medium capitalize">{u.subscription.plan ?? "—"}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="bg-accent/30 border border-border rounded-lg p-4">
                          <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Account Details</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <div className="text-[10px] text-muted-foreground">Email</div>
                              <div className="text-foreground/80">{u.email}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">Joined</div>
                              <div className="text-foreground/80">{new Date(u.createdAt).toLocaleString("id-ID")}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">Auth Provider</div>
                              <div className="text-foreground/80 capitalize">{(u as any).authProvider ?? "email"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  {searchQuery || planFilter !== "all" ? "Tidak ada user yang cocok dengan filter." : "Belum ada user."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="text-[10px] text-muted-foreground bg-accent/50 px-2.5 py-1 rounded hover:text-foreground transition-colors disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`text-[10px] px-2.5 py-1 rounded transition-colors ${currentPage === pageNum ? "text-foreground bg-accent/70" : "text-muted-foreground bg-accent/50 hover:text-foreground"}`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="text-[10px] text-muted-foreground bg-accent/50 px-2.5 py-1 rounded hover:text-foreground transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: PROVIDERS
   ═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   TAB: MODELS
   ═══════════════════════════════════════════════════════════════ */

function AdminModelsTab() {
  const providers = useQuery(api.providers.getAllProviders);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");

  const allModels = useMemo(() => {
    if (!providers) return [];
    return providers.flatMap((p) =>
      p.models.map((m) => ({
        ...m,
        providerName: p.displayName,
        providerSlug: p.provider,
        providerEnabled: p.enabled,
      }))
    );
  }, [providers]);

  const filtered = useMemo(() => {
    return allModels
      .filter((m) => providerFilter === "all" || m.providerSlug === providerFilter)
      .filter((m) => !search || m.modelId.toLowerCase().includes(search.toLowerCase()) || m.displayName.toLowerCase().includes(search.toLowerCase()));
  }, [allModels, search, providerFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Models</h2>
          <p className="text-xs text-muted-foreground">{allModels.length} models across {providers?.length ?? 0} providers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-accent/30 border border-border rounded-lg px-3 py-1.5">
            <Search className="size-3 text-muted-foreground" />
            <input type="text" placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-xs text-foreground/70 placeholder-muted-foreground outline-none w-32" />
          </div>
          <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className="text-xs text-muted-foreground bg-accent/50 border border-border rounded-lg px-3 py-1.5 outline-none max-w-40">
            <option value="all">All Providers</option>
            {(providers ?? []).map((p) => (
              <option key={p.provider} value={p.provider}>{p.displayName}</option>
            ))}
          </select>
        </div>
      </div>

      {!providers ? (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">Loading models...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-accent/30 border border-border rounded-xl p-8 text-center">
          <Cpu className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No models found</p>
        </div>
      ) : (
        <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Model ID</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Display Name</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Provider</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Input $/1M</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Output $/1M</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Max Tokens</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">RPM</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((m) => (
                  <tr key={`${m.providerSlug}-${m.modelId}`} className={`border-b border-border hover:bg-accent/30 transition-colors ${!m.enabled ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-foreground/80">{m.modelId}</code>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">{m.displayName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.providerName}</td>
                    <td className="px-4 py-3 text-foreground/70 text-right tabular-nums">${m.inputPricePer1M.toFixed(2)}</td>
                    <td className="px-4 py-3 text-foreground/70 text-right tabular-nums">${m.outputPricePer1M.toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-right tabular-nums">{m.maxTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground text-right tabular-nums">{m.rateLimit}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.enabled ? "operational" : "disabled"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border">
                Showing 100 of {filtered.length} models — use search to narrow
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: AUDIT LOG
   ═══════════════════════════════════════════════════════════════ */

function AdminAuditTab() {
  const auditLogs = useQuery(api.auditLog.listAuditLogs, { limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Audit Log</h2>
          <p className="text-xs text-muted-foreground">{auditLogs?.length ?? 0} entries</p>
        </div>
      </div>

      {!auditLogs ? (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">Loading audit log...</div>
      ) : auditLogs.length === 0 ? (
        <div className="bg-accent/30 border border-border rounded-xl p-8 text-center">
          <FileText className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No audit events yet</p>
          <p className="text-xs text-muted-foreground mt-1">Events will appear as you manage providers, users, and settings</p>
        </div>
      ) : (
        <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {auditLogs.map((l) => (
              <div key={l._id} className="flex items-start gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                <div className="mt-0.5">
                  <CheckCircle2 className="size-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground/80">{l.action}</span>
                    <SeverityBadge severity="info" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{l.resource}{l.details ? `: ${String(l.details).slice(0, 120)}` : ""}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="tabular-nums">{new Date(l.createdAt).toLocaleString()}</span>
                    <span>by {l.actorId ? "admin" : "system"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: SYSTEM
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   TAB: PRICING (Admin markup & model prices)
   ═══════════════════════════════════════════════════════════════ */

function AdminPricingTab() {
  const pricingConfig = useQuery(api.pricing.getConfig);
  const modelPrices = useQuery(api.pricing.getModelPrices);
  const plans = useQuery(api.pricing.getPlans);
  const updateConfig = useMutation(api.pricing.updateConfig);
  const applyMarkup = useMutation(api.pricing.applyMarkupToAll);
  const updateModelPrice = useMutation(api.pricing.updateModelPrice);

  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupInput, setMarkupInput] = useState("");
  const [usdToIdrInput, setUsdToIdrInput] = useState("");
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [sellInputVal, setSellInputVal] = useState("");
  const [sellOutputVal, setSellOutputVal] = useState("");

  const fmtIdr = (n: number | undefined) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

  const handleSaveConfig = async () => {
    await updateConfig({
      markupPercent: Number(markupInput) || pricingConfig?.markupPercent || 30,
      usdToIdr: Number(usdToIdrInput) || pricingConfig?.usdToIdr || 16500,
      minMarkupIdr: pricingConfig?.minMarkupIdr || 500,
    });
    setEditingMarkup(false);
  };

  const handleApplyMarkup = async () => {
    const pct = Number(markupInput) || pricingConfig?.markupPercent || 30;
    await applyMarkup({ markupPercent: pct });
    setEditingMarkup(false);
  };

  const handleSaveModelPrice = async (provider: string, modelId: string) => {
    await updateModelPrice({
      provider,
      modelId,
      sellInputPer1M: sellInputVal ? Number(sellInputVal) : undefined,
      sellOutputPer1M: sellOutputVal ? Number(sellOutputVal) : undefined,
    });
    setEditingModel(null);
    setSellInputVal("");
    setSellOutputVal("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pengaturan Harga</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Atur markup global atau set harga custom per model. Semua harga jual dalam Rupiah.
        </p>
      </div>

      {/* Global Config */}
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Settings className="size-4 text-muted-foreground" />
            Konfigurasi Global
          </h3>
          <button
            onClick={() => { setEditingMarkup(!editingMarkup); setMarkupInput(String(pricingConfig?.markupPercent ?? 30)); setUsdToIdrInput(String(pricingConfig?.usdToIdr ?? 16500)); }}
            className="text-xs text-muted-foreground bg-accent/50 border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors"
          >
            {editingMarkup ? "Batal" : "Edit"}
          </button>
        </div>

        {!editingMarkup ? (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Markup</div>
              <div className="text-lg font-bold text-foreground">{pricingConfig?.markupPercent ?? 30}%</div>
              <div className="text-[10px] text-muted-foreground">di atas harga provider</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Kurs USD → IDR</div>
              <div className="text-lg font-bold text-foreground">{fmtIdr(pricingConfig?.usdToIdr ?? 16500)}</div>
              <div className="text-[10px] text-muted-foreground">per 1 USD</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Min Markup</div>
              <div className="text-lg font-bold text-foreground">{fmtIdr(pricingConfig?.minMarkupIdr ?? 500)}</div>
              <div className="text-[10px] text-muted-foreground">per 1M token</div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Markup (%)</label>
                <input type="number" value={markupInput} onChange={(e) => setMarkupInput(e.target.value)} className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Kurs USD → IDR</label>
                <input type="number" value={usdToIdrInput} onChange={(e) => setUsdToIdrInput(e.target.value)} className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSaveConfig} className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors">
                Simpan Config
              </button>
              <button onClick={handleApplyMarkup} className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors">
                Apply Markup {markupInput || pricingConfig?.markupPercent}% ke Semua Model
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              "Apply ke Semua" akan reset harga custom dan menghitung ulang dari (cost USD × kurs × markup%).
            </p>
          </div>
        )}
      </div>

      {/* Model Price Table */}
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Harga Per Model</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Klik model untuk set harga custom. Kosongkan untuk pakai auto markup.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground text-left border-b border-border">
                <th className="p-3 font-medium">Model</th>
                <th className="p-3 font-medium">Provider</th>
                <th className="p-3 font-medium text-right">Cost Input (USD)</th>
                <th className="p-3 font-medium text-right">Cost Output (USD)</th>
                <th className="p-3 font-medium text-right">Jual Input (IDR)</th>
                <th className="p-3 font-medium text-right">Jual Output (IDR)</th>
                <th className="p-3 font-medium text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {modelPrices?.map((provider) =>
                provider.models.map((m) => {
                  const costInputIdr = (m.costInputPer1M || 0) * (pricingConfig?.usdToIdr ?? 16500);
                  const marginPct = costInputIdr > 0 ? Math.round((((m.sellInputPer1M || 0) - costInputIdr) / costInputIdr) * 100) : 0;
                  const modelKey = `${provider.provider}-${m.modelId}`;
                  const isEditing = editingModel === modelKey;

                  return (
                    <tr key={modelKey} className="hover:bg-accent/30 cursor-pointer" onClick={() => {
                      if (!isEditing) {
                        setEditingModel(modelKey);
                        setSellInputVal(String(m.sellInputPer1M));
                        setSellOutputVal(String(m.sellOutputPer1M));
                      }
                    }}>
                      <td className="p-3 text-foreground/80 font-medium">{m.displayName}</td>
                      <td className="p-3 text-muted-foreground">{provider.displayName}</td>
                      <td className="p-3 text-right text-muted-foreground font-mono">${(m.costInputPer1M || 0).toFixed(2)}</td>
                      <td className="p-3 text-right text-muted-foreground font-mono">${(m.costOutputPer1M || 0).toFixed(2)}</td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={sellInputVal}
                            onChange={(e) => { e.stopPropagation(); setSellInputVal(e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-24 bg-accent/50 border border-border rounded px-2 py-1 text-xs text-foreground/80 font-mono text-right outline-none"
                          />
                        ) : (
                          <span className="text-foreground/80 font-mono">{fmtIdr(m.sellInputPer1M)}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={sellOutputVal}
                            onChange={(e) => { e.stopPropagation(); setSellOutputVal(e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-24 bg-accent/50 border border-border rounded px-2 py-1 text-xs text-foreground/80 font-mono text-right outline-none"
                          />
                        ) : (
                          <span className="text-foreground/80 font-mono">{fmtIdr(m.sellOutputPer1M)}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleSaveModelPrice(provider.provider, m.modelId)} className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500/20">
                              Save
                            </button>
                            <button onClick={() => setEditingModel(null)} className="text-[10px] text-muted-foreground bg-accent/50 px-2 py-1 rounded hover:text-foreground">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${marginPct >= 25 ? "text-emerald-400 bg-emerald-500/10" : marginPct >= 10 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"}`}>
                            +{marginPct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {(!modelPrices || modelPrices.length === 0) && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Belum ada provider yang aktif. Aktifkan di tab API Keys dulu.
            </div>
          )}
        </div>
      </div>

      {/* Subscription Plans */}
      <SubscriptionPlansEditor plans={plans} fmtIdr={fmtIdr} />
    </div>
  );
}

/* ── Subscription Plans Editor (used inside Pricing tab) ── */
function SubscriptionPlansEditor({ plans, fmtIdr }: { plans: any[] | undefined; fmtIdr: (n: number) => string }) {
  const upsertPlan = useMutation(api.pricing.upsertPlan);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({ name: "", priceIdr: "", creditsIdr: "", maxKeys: "", features: "", popular: false });

  const startEdit = (plan: any) => {
    setEditingPlan(plan.planId);
    setPlanForm({
      name: plan.name,
      priceIdr: String(plan.priceIdr),
      creditsIdr: String(plan.creditsIdr),
      maxKeys: String(plan.maxKeys),
      features: (plan.features || []).join("\n"),
      popular: plan.popular,
    });
  };

  const handleSavePlan = async (planId: string) => {
    await upsertPlan({
      planId,
      name: planForm.name,
      priceIdr: Number(planForm.priceIdr) || 0,
      creditsCents: Number(planForm.creditsIdr) || 0,
      maxKeys: Number(planForm.maxKeys) || 5,
      features: planForm.features.split("\n").map((f) => f.trim()).filter(Boolean),
      popular: planForm.popular,
      enabled: true,
    });
    setEditingPlan(null);
  };

  return (
    <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Paket Langganan</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Edit harga, kredit, dan fitur tiap paket. Perubahan langsung tersimpan.</p>
      </div>
      <div className="divide-y divide-border">
        {plans?.map((plan) => (
          <div key={plan.planId}>
            <div className={`p-4 flex items-center justify-between transition-colors ${editingPlan === plan.planId ? "bg-accent/40" : "hover:bg-accent/30"}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{plan.name}</span>
                  {plan.popular && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">Populer</span>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {fmtIdr(plan.priceIdr)}/bulan • Kredit {fmtIdr(plan.creditsIdr)} • {plan.maxKeys} keys
                </div>
                {plan.features && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {plan.features.slice(0, 4).map((f: string, i: number) => (
                      <span key={i} className="text-[9px] bg-accent/50 text-muted-foreground px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                    {plan.features.length > 4 && <span className="text-[9px] text-muted-foreground">+{plan.features.length - 4} more</span>}
                  </div>
                )}
              </div>
              <button
                onClick={() => editingPlan === plan.planId ? setEditingPlan(null) : startEdit(plan)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors bg-accent/50 border border-border px-3 py-1.5 rounded-lg"
              >
                {editingPlan === plan.planId ? "Batal" : "Edit"}
              </button>
            </div>
            {editingPlan === plan.planId && (
              <div className="border-t border-border p-4 bg-accent/20 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Nama</label>
                    <input type="text" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-border" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Harga / bulan (Rp)</label>
                    <input type="number" value={planForm.priceIdr} onChange={(e) => setPlanForm({ ...planForm, priceIdr: e.target.value })} className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Kredit / bulan (Rp)</label>
                    <input type="number" value={planForm.creditsIdr} onChange={(e) => setPlanForm({ ...planForm, creditsIdr: e.target.value })} className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Max API Keys</label>
                    <input type="number" value={planForm.maxKeys} onChange={(e) => setPlanForm({ ...planForm, maxKeys: e.target.value })} className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Fitur (satu per baris)</label>
                  <textarea value={planForm.features} onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })} rows={4} className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-border resize-none" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={planForm.popular} onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })} className="rounded border-border" />
                    <span className="text-xs text-muted-foreground">Tandai sebagai Populer</span>
                  </label>
                  <button onClick={() => handleSavePlan(plan.planId)} className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors">
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: PROVIDER CONFIG (Connect API Keys)
   ═══════════════════════════════════════════════════════════════ */

function AdminProviderConfigTab() {
  const providers = useQuery(api.providers.getAllProviders);
  const upsertProvider = useMutation(api.providers.upsertProvider);
  const toggleProv = useMutation(api.providers.toggleProvider);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [oauthTokenInput, setOauthTokenInput] = useState("");
  const [cookieInput, setCookieInput] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string; latencyMs: number } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const handleTestKey = async (providerName: string, baseUrl?: string) => {
    if (!apiKeyInput) { setTestResult({ provider: providerName, success: false, message: "Masukkan API key dulu", latencyMs: 0 }); return; }
    setTesting(providerName);
    setTestResult(null);
    try {
      const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL || window.location.origin;
      const resp = await fetch(`${convexSiteUrl}/api/test-provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerName, apiKey: apiKeyInput, baseUrl: baseUrlInput || baseUrl }),
      });
      const data = await resp.json();
      setTestResult({ provider: providerName, ...data });
    } catch (err: any) {
      setTestResult({ provider: providerName, success: false, message: err.message || "Network error", latencyMs: 0 });
    } finally {
      setTesting(null);
    }
  };

  const handleSaveKey = async (provider: any) => {
    const updateData: any = {
      provider: provider.provider,
      displayName: provider.displayName,
      enabled: true,
      authType: provider.authType,
      tier: provider.tier,
      baseUrl: baseUrlInput || provider.baseUrl,
      models: provider.models,
      fallbackPriority: provider.fallbackPriority,
    };

    // Set credentials based on auth type
    if (provider.authType === "api_key" || provider.authType === "service_account") {
      updateData.apiKey = apiKeyInput || provider.apiKey;
    } else if (provider.authType === "oauth" || provider.authType === "device_code") {
      updateData.oauthAccessToken = oauthTokenInput || provider.oauthAccessToken;
      updateData.oauthRefreshToken = provider.oauthRefreshToken;
      updateData.oauthExpiresAt = provider.oauthExpiresAt;
      updateData.oauthAuthUrl = provider.oauthAuthUrl;
      updateData.oauthTokenUrl = provider.oauthTokenUrl;
      if (provider.quotaType) {
        updateData.quotaType = provider.quotaType;
        updateData.quotaLimit = provider.quotaLimit;
        updateData.quotaUsed = provider.quotaUsed ?? 0;
      }
    } else if (provider.authType === "cookie") {
      updateData.sessionCookie = cookieInput || provider.sessionCookie;
      if (provider.quotaType) {
        updateData.quotaType = provider.quotaType;
      }
    } else if (provider.authType === "free") {
      updateData.apiKey = apiKeyInput || provider.apiKey;
      if (provider.quotaType) {
        updateData.quotaType = provider.quotaType;
        updateData.quotaLimit = provider.quotaLimit;
        updateData.quotaUsed = provider.quotaUsed ?? 0;
      }
    }

    await upsertProvider(updateData);
    setEditingProvider(null);
    setApiKeyInput("");
    setBaseUrlInput("");
    setOauthTokenInput("");
    setCookieInput("");
    setTestResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Provider API Keys</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Connect AI providers by adding your API keys. Users will access all models through a single AdalahCredit API key.
        </p>
      </div>

      {/* OpenAI-compatible endpoint info */}
      <div className="bg-gradient-to-br from-blue-500/[0.06] to-purple-500/[0.03] border border-blue-500/[0.12] rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Link2 className="size-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">OpenAI-Compatible Endpoint</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Users can use their AdalahCredit API key with any OpenAI-compatible client, CLI, VS Code extension (Continue, Cody), or agent (Hermes, OpenClaw, etc.)
            </p>
            <div className="bg-[#0a0a0c] border border-border rounded-lg p-3 font-mono text-[11px] text-foreground/70 space-y-1">
              <div><span className="text-muted-foreground"># Base URL:</span></div>
              <div className="text-blue-400">https://api.adalahcredit.com/v1</div>
              <div className="mt-2"><span className="text-muted-foreground"># Usage with curl:</span></div>
              <div className="text-muted-foreground">curl https://api.adalahcredit.com/v1/chat/completions \</div>
              <div className="text-muted-foreground pl-4">-H "Authorization: Bearer sk-ac-..." \</div>
              <div className="text-muted-foreground pl-4">{`-d '{"model":"gpt-4o","messages":[...]}'`}</div>
              <div className="mt-2"><span className="text-muted-foreground"># VS Code / Continue / Cody config:</span></div>
              <div className="text-muted-foreground">{`{ "apiBase": "https://api.adalahcredit.com/v1", "apiKey": "sk-ac-..." }`}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier filter */}
      {providers && providers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "subscription", "api_key", "cheap", "free"].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${tierFilter === t ? "border-foreground/20 bg-foreground/5 text-foreground font-medium" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {t === "all" ? "🌐 All" : t === "subscription" ? "💳 Subscription" : t === "api_key" ? "🔑 API Key" : t === "cheap" ? "💰 Cheap" : "🆓 Free"}
              {t !== "all" && providers && ` (${providers.filter((p) => (p as any).tier === t).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Provider list */}
      {!providers ? (
        <div className="text-center py-8">
          <div className="size-6 border-2 border-border border-t-white rounded-full animate-spin mx-auto" />
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No providers configured. Run the seed function to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {providers.filter((p) => tierFilter === "all" || (p as any).tier === tierFilter).map((p) => (
            <div key={p._id} className={`bg-accent/30 border rounded-xl overflow-hidden transition-colors ${p.enabled ? "border-emerald-500/20" : "border-border"}`}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`size-9 rounded-lg flex items-center justify-center ${p.enabled ? "bg-emerald-500/10" : "bg-accent/50"}`}>
                    <Server className={`size-4 ${p.enabled ? "text-emerald-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{p.displayName}</span>
                      {p.enabled ? (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">Connected</span>
                      ) : (
                        <span className="text-[9px] bg-zinc-500/10 text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">Not Connected</span>
                      )}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        (p as any).tier === "subscription" ? "bg-purple-500/10 text-purple-400" :
                        (p as any).tier === "api_key" ? "bg-blue-500/10 text-blue-400" :
                        (p as any).tier === "cheap" ? "bg-amber-500/10 text-amber-400" :
                        "bg-emerald-500/10 text-emerald-300"
                      }`}>
                        {(p as any).tier === "subscription" ? "💳 Subscription" :
                         (p as any).tier === "api_key" ? "🔑 API Key" :
                         (p as any).tier === "cheap" ? "💰 Cheap" : "🆓 Free"}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        p.authType === "oauth" ? "bg-indigo-500/10 text-indigo-400" :
                        p.authType === "cookie" ? "bg-orange-500/10 text-orange-400" :
                        p.authType === "free" ? "bg-green-500/10 text-green-400" :
                        "bg-zinc-500/10 text-muted-foreground"
                      }`}>
                        {p.authType === "oauth" ? "🔐 OAuth" :
                         p.authType === "cookie" ? "🍪 Cookie" :
                         p.authType === "free" ? "🆓 No Auth" :
                         p.authType === "device_code" ? "📱 Device" : "🔑 API Key"}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {p.models.filter((m) => m.enabled).length} models • {p.authType} • {p.baseUrl}
                      {(p as any).quotaType && (p as any).quotaType !== "unlimited" && (
                        <> • Quota: {(p as any).quotaUsed ?? 0}/{(p as any).quotaLimit}</>
                      )}
                      {(p as any).quotaType === "unlimited" && <> • Unlimited</>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(p.apiKey || (p as any).oauthAccessToken || (p as any).sessionCookie || p.authType === "free") && (
                    <button
                      onClick={() => toggleProv({ provider: p.provider, enabled: !p.enabled })}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${p.enabled ? "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {p.enabled ? "Disable" : "Enable"}
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingProvider(editingProvider === p.provider ? null : p.provider); setApiKeyInput(p.apiKey ?? ""); setBaseUrlInput(p.baseUrl ?? ""); }}
                    className="text-xs text-muted-foreground bg-accent/50 border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors"
                  >
                    {editingProvider === p.provider ? "Cancel" : "Configure"}
                  </button>
                </div>
              </div>

              {editingProvider === p.provider && (
                <div className="border-t border-border p-4 bg-accent/30 space-y-3">
                  {/* Auth-type-specific inputs */}
                  {(p.authType === "api_key" || p.authType === "service_account") && (
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">🔑 API Key</label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-... or AIza..."
                        className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border transition-colors"
                      />
                    </div>
                  )}
                  {(p.authType === "oauth" || p.authType === "device_code") && (
                    <>
                      <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-lg p-3">
                        <div className="text-xs font-medium text-indigo-400 mb-1">🔐 OAuth Provider</div>
                        <p className="text-[10px] text-muted-foreground">
                          Connect via OAuth to use your subscription. Paste your access token below, or use the OAuth URL to authenticate.
                        </p>
                        {(p as any).oauthAuthUrl && (
                          <a href={(p as any).oauthAuthUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-[10px] text-indigo-400 hover:text-indigo-300">
                            Open OAuth Login →
                          </a>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Access Token</label>
                        <input
                          type="password"
                          value={oauthTokenInput}
                          onChange={(e) => setOauthTokenInput(e.target.value)}
                          placeholder="Paste OAuth access token..."
                          className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border transition-colors"
                        />
                      </div>
                      {(p as any).quotaType && (p as any).quotaType !== "unlimited" && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>📊 Quota: {(p as any).quotaUsed ?? 0} / {(p as any).quotaLimit} ({(p as any).quotaType?.replace(/_/g, " ")})</span>
                        </div>
                      )}
                    </>
                  )}
                  {p.authType === "cookie" && (
                    <>
                      <div className="bg-orange-500/[0.06] border border-orange-500/20 rounded-lg p-3">
                        <div className="text-xs font-medium text-orange-400 mb-1">🍪 Cookie/Session Provider</div>
                        <p className="text-[10px] text-muted-foreground">
                          Paste your session cookie or bearer token from the browser. Open DevTools → Application → Cookies or Network tab → Copy the auth token.
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Session Cookie / Token</label>
                        <textarea
                          value={cookieInput}
                          onChange={(e) => setCookieInput(e.target.value)}
                          placeholder="Paste session cookie or bearer token..."
                          rows={3}
                          className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border transition-colors resize-none"
                        />
                      </div>
                    </>
                  )}
                  {p.authType === "free" && (
                    <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg p-3">
                      <div className="text-xs font-medium text-emerald-400 mb-1">🆓 Free Provider</div>
                      <p className="text-[10px] text-muted-foreground">
                        {p.apiKey !== undefined ? "Some free providers need a free API key for tracking. Get one from their website." : "No authentication needed! Just enable this provider."}
                      </p>
                      {p.apiKey !== undefined && (
                        <input
                          type="text"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="Free API key (optional)..."
                          className="w-full mt-2 bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border transition-colors"
                        />
                      )}
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Base URL (optional)</label>
                    <input
                      type="text"
                      value={baseUrlInput}
                      onChange={(e) => setBaseUrlInput(e.target.value)}
                      placeholder={p.baseUrl ?? "https://api.openai.com/v1"}
                      className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border transition-colors"
                    />
                  </div>
                  {/* Test result */}
                  {testResult && testResult.provider === p.provider && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-xs border ${testResult.success ? "bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-400" : "bg-red-500/[0.06] border-red-500/20 text-red-400"}`}>
                      {testResult.success ? <CheckCircle2 className="size-3.5 shrink-0" /> : <AlertTriangle className="size-3.5 shrink-0" />}
                      <span className="flex-1">{testResult.message}</span>
                      {testResult.latencyMs > 0 && <span className="text-muted-foreground tabular-nums">{testResult.latencyMs}ms</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      Models: {p.models.map((m) => m.modelId).join(", ")}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestKey(p.provider, p.baseUrl)}
                        disabled={testing === p.provider}
                        className="inline-flex items-center gap-2 text-xs font-medium text-foreground/70 bg-accent/50 border border-border px-4 py-2 rounded-lg hover:bg-accent/70 hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {testing === p.provider ? (
                          <><div className="size-3 border-2 border-border border-t-white rounded-full animate-spin" /> Testing...</>
                        ) : (
                          <><Zap className="size-3.5" /> Test Key</>
                        )}
                      </button>
                      <button
                        onClick={() => handleSaveKey(p)}
                        className="inline-flex items-center gap-2 text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                      >
                        <Check className="size-3.5" /> Save & Connect
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: PAYMENT MANAGEMENT
   ═══════════════════════════════════════════════════════════════ */

function AdminPaymentsTab() {
  const gatewayConfigs = useQuery(api.payments.getAllGatewayConfigs);
  const pendingOrders = useQuery(api.payments.getPendingOrders);
  const upsertGw = useMutation(api.payments.upsertGatewayConfig);
  const confirmPay = useMutation(api.payments.confirmPayment);
  const rejectPay = useMutation(api.payments.rejectPayment);

  const [editGw, setEditGw] = useState<string | null>(null);
  const [gwForm, setGwForm] = useState<Record<string, string>>({});


  const handleSaveGateway = async (gateway: string) => {
    const gw = gatewayConfigs?.find((g) => g.gateway === gateway);
    if (gateway === "duitku") {
      await upsertGw({
        gateway: "duitku",
        enabled: true,
        displayName: "Duitku",
        sandbox: true,
        merchantCode: gwForm.merchantCode || gw?.merchantCode || "",
        apiKey: gwForm.apiKey || gw?.apiKey || "",
        callbackUrl: gwForm.callbackUrl || gw?.callbackUrl || "",
      });
    } else if (gateway === "tripay") {
      await upsertGw({
        gateway: "tripay",
        enabled: true,
        displayName: "Tripay",
        sandbox: true,
        tripayApiKey: gwForm.tripayApiKey || gw?.tripayApiKey || "",
        tripayPrivateKey: gwForm.tripayPrivateKey || gw?.tripayPrivateKey || "",
        tripayMerchantCode: gwForm.tripayMerchantCode || gw?.tripayMerchantCode || "",
      });
    } else if (gateway === "manual_qris") {
      await upsertGw({
        gateway: "manual_qris",
        enabled: true,
        displayName: "QRIS Manual",
        sandbox: false,
        qrisImageUrl: gwForm.qrisImageUrl || gw?.qrisImageUrl || "",
        qrisAccountName: gwForm.qrisAccountName || gw?.qrisAccountName || "",
        qrisInstructions: gwForm.qrisInstructions || gw?.qrisInstructions || "",
      });
    }
    setEditGw(null);
    setGwForm({});
  };

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const handleConfirm = async (orderId: string) => {
    if (confirmingId) return; // prevent double-click
    setConfirmingId(orderId);
    try {
      await confirmPay({ orderId: orderId as any });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (rejectingId) return;
    setRejectingId(orderId);
    try {
      await rejectPay({ orderId: orderId as any, adminNote: "Bukti pembayaran tidak valid" });
    } finally {
      setRejectingId(null);
    }
  };

  const formatIDR = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Payment Management</h2>

      {/* Pending QRIS payments */}
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="size-4 text-amber-400" />
            Pending Payments
            {pendingOrders && pendingOrders.length > 0 && (
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full">{pendingOrders.length}</span>
            )}
          </h3>
        </div>

        {!pendingOrders ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : pendingOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="size-6 mx-auto mb-2 text-emerald-500/30" />
            Tidak ada pembayaran yang menunggu konfirmasi
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pendingOrders.map((order: any) => (
              <div key={order._id} className="p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-foreground/80 font-medium">{order.userName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatIDR(order.amount)} via {order.gateway} •{" "}
                      {new Date(order.createdAt).toLocaleString("id-ID")}
                    </div>
                    {order.proofImageUrl && (
                      <a href={order.proofImageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1 inline-block">
                        Lihat bukti →
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirm(order._id)}
                      disabled={confirmingId === order._id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-black bg-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="size-3" /> {confirmingId === order._id ? "..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => handleReject(order._id)}
                      disabled={rejectingId === order._id}
                      className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="size-3" /> {rejectingId === order._id ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gateway Configuration */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Payment Gateways</h3>
        <div className="space-y-3">
          {/* Duitku */}
          <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="size-4 text-blue-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Duitku</span>
                  <div className="text-[10px] text-muted-foreground">VA, E-Wallet, Kartu Kredit • docs.duitku.com</div>
                </div>
              </div>
              <button onClick={() => setEditGw(editGw === "duitku" ? null : "duitku")} className="text-xs text-muted-foreground bg-accent/50 border border-border px-3 py-1.5 rounded-lg hover:text-foreground">
                Configure
              </button>
            </div>
            {editGw === "duitku" && (
              <div className="border-t border-border p-4 space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Merchant Code</label>
                  <input type="text" value={gwForm.merchantCode ?? ""} onChange={(e) => setGwForm({ ...gwForm, merchantCode: e.target.value })} placeholder="D0001" className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">API Key</label>
                  <input type="password" value={gwForm.apiKey ?? ""} onChange={(e) => setGwForm({ ...gwForm, apiKey: e.target.value })} placeholder="••••••••" className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Callback URL</label>
                  <input type="text" value={gwForm.callbackUrl ?? ""} onChange={(e) => setGwForm({ ...gwForm, callbackUrl: e.target.value })} placeholder="https://api.adalahcredit.com/webhooks/duitku" className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                </div>
                <button onClick={() => handleSaveGateway("duitku")} className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90">Save</button>
              </div>
            )}
          </div>

          {/* Tripay */}
          <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Wallet className="size-4 text-violet-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Tripay</span>
                  <div className="text-[10px] text-muted-foreground">VA, QRIS, E-Wallet, Minimarket • tripay.co.id</div>
                </div>
              </div>
              <button onClick={() => setEditGw(editGw === "tripay" ? null : "tripay")} className="text-xs text-muted-foreground bg-accent/50 border border-border px-3 py-1.5 rounded-lg hover:text-foreground">
                Configure
              </button>
            </div>
            {editGw === "tripay" && (
              <div className="border-t border-border p-4 space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">API Key</label>
                  <input type="password" value={gwForm.tripayApiKey ?? ""} onChange={(e) => setGwForm({ ...gwForm, tripayApiKey: e.target.value })} placeholder="DEV-..." className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Private Key</label>
                  <input type="password" value={gwForm.tripayPrivateKey ?? ""} onChange={(e) => setGwForm({ ...gwForm, tripayPrivateKey: e.target.value })} placeholder="••••••••" className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Merchant Code</label>
                  <input type="text" value={gwForm.tripayMerchantCode ?? ""} onChange={(e) => setGwForm({ ...gwForm, tripayMerchantCode: e.target.value })} placeholder="T00001" className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                </div>
                <button onClick={() => handleSaveGateway("tripay")} className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90">Save</button>
              </div>
            )}
          </div>

          {/* Manual QRIS */}
          <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <QrCode className="size-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">QRIS Manual</span>
                  <div className="text-[10px] text-muted-foreground">Upload QRIS, user scan & kirim bukti, admin konfirmasi</div>
                </div>
              </div>
              <button onClick={() => setEditGw(editGw === "manual_qris" ? null : "manual_qris")} className="text-xs text-muted-foreground bg-accent/50 border border-border px-3 py-1.5 rounded-lg hover:text-foreground">
                Configure
              </button>
            </div>
            {editGw === "manual_qris" && (
              <div className="border-t border-border p-4 space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">QRIS Image URL</label>
                  <input type="text" value={gwForm.qrisImageUrl ?? ""} onChange={(e) => setGwForm({ ...gwForm, qrisImageUrl: e.target.value })} placeholder="https://i.imgur.com/qris.png" className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 font-mono outline-none focus:border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Account Name</label>
                  <input type="text" value={gwForm.qrisAccountName ?? ""} onChange={(e) => setGwForm({ ...gwForm, qrisAccountName: e.target.value })} placeholder="AdalahCredit AI" className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Instructions</label>
                  <textarea value={gwForm.qrisInstructions ?? ""} onChange={(e) => setGwForm({ ...gwForm, qrisInstructions: e.target.value })} placeholder="1. Scan QRIS..." rows={3} className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-border" />
                </div>
                <button onClick={() => handleSaveGateway("manual_qris")} className="text-xs font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90">Save</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Subscription Orders Section ── */}
      <SubscriptionOrdersSection />
    </div>
  );
}

function SubscriptionOrdersSection() {
  const pendingSubOrders = useQuery(api.subscriptionEngine.getPendingSubscriptionOrders);
  const allSubOrders = useQuery(api.subscriptionEngine.getAllSubscriptionOrders, { limit: 20 });
  const confirmSub = useMutation(api.subscriptionEngine.confirmSubscriptionOrder);
  const rejectSub = useMutation(api.subscriptionEngine.rejectSubscriptionOrder);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const formatIDR = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  const handleConfirmSub = async (orderId: string) => {
    setConfirmingId(orderId);
    try { await confirmSub({ orderId: orderId as any }); } finally { setConfirmingId(null); }
  };

  const handleRejectSub = async (orderId: string) => {
    setRejectingId(orderId);
    try {
      await rejectSub({ orderId: orderId as any, adminNote: rejectNote || "Pembayaran tidak valid" });
      setRejectNote("");
    } finally { setRejectingId(null); }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Crown className="size-4 text-purple-400" />
        Subscription & Top-Up Orders
        {pendingSubOrders && pendingSubOrders.length > 0 && (
          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full">{pendingSubOrders.length} pending</span>
        )}
      </h3>

      {/* Pending orders */}
      <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border">
          <span className="text-xs font-medium text-amber-400">Pending / Paid</span>
        </div>
        {!pendingSubOrders || pendingSubOrders.length === 0 ? (
          <div className="p-6 text-center text-[11px] text-muted-foreground">Tidak ada order pending</div>
        ) : (
          <div className="divide-y divide-border">
            {pendingSubOrders.map((o: any) => (
              <div key={o._id} className="p-4 hover:bg-accent/20 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-medium">{o.userName}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">(plan: {o.currentPlan})</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${o.status === "paid" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {o.status}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mb-2">
                  {o.type === "topup" ? "Top-up PAYG" : `${o.type} → ${o.plan}`} • {formatIDR(o.amountIdr)}
                  {o.creditAmountCents ? ` • $${(o.creditAmountCents / 100).toFixed(2)}` : ""}
                  {o.proofImageUrl && (
                    <a href={o.proofImageUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-400 hover:underline">
                      Bukti →
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConfirmSub(o._id)}
                    disabled={confirmingId === o._id}
                    className="text-xs font-medium text-black bg-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {confirmingId === o._id ? "..." : "✓ Confirm"}
                  </button>
                  <button
                    onClick={() => handleRejectSub(o._id)}
                    disabled={rejectingId === o._id}
                    className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {rejectingId === o._id ? "..." : "✗ Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All orders history */}
      {allSubOrders && allSubOrders.length > 0 && (
        <div className="bg-accent/30 border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">Riwayat ({allSubOrders.length})</span>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {allSubOrders.map((o: any) => (
              <div key={o._id} className="p-3 flex items-center justify-between text-[10px] hover:bg-accent/20">
                <div>
                  <span className="text-foreground/70">{o.userName}</span>
                  <span className="text-muted-foreground ml-1">
                    {o.type === "topup" ? "Top-up" : o.plan} • {formatIDR(o.amountIdr)}
                  </span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full ${
                  o.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" :
                  o.status === "rejected" ? "bg-red-500/10 text-red-400" :
                  "bg-zinc-500/10 text-zinc-400"
                }`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: SYSTEM
   ═══════════════════════════════════════════════════════════════ */

function AdminConnectionsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Link2 className="size-5" /> Provider Connections
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola koneksi OAuth, device code, dan import token ke AI provider — powered by OmniRoute
          </p>
        </div>
      </div>
      <ConnectionsPanel />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYSTEM TAB
   ═══════════════════════════════════════════════════════════════ */

function AdminSystemTab() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("ac_system_settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      autoFailover: true,
      semanticCaching: true,
      requestLogging: true,
      costOptimization: false,
    };
  });
  const [saveMsg, setSaveMsg] = useState("");

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev: typeof settings) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("ac_system_settings", JSON.stringify(next));
      setSaveMsg("✓ Tersimpan");
      setTimeout(() => setSaveMsg(""), 2000);
      return next;
    });
  };

  const toggleItems = [
    { key: "autoFailover" as const, label: "Auto-failover enabled", desc: "Automatically failover to equivalent model if provider is down" },
    { key: "semanticCaching" as const, label: "Semantic caching enabled", desc: "Cache semantically similar queries to reduce costs" },
    { key: "requestLogging" as const, label: "Request logging", desc: "Log all API requests for analytics and debugging" },
    { key: "costOptimization" as const, label: "Cost optimization mode", desc: "Prefer cheaper equivalent models when quality delta < 2%" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">System Configuration</h2>

      {/* System health — real data from Convex where possible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard title="Avg Latency" value="—" sub="Depends on model" icon={Clock} accent="text-blue-400" />
        <AdminStatCard title="Error Rate" value="—" sub="Check Audit Log tab" icon={AlertTriangle} accent="text-amber-400" />
        <AdminStatCard title="Cache Hit Rate" value="—" sub="Semantic cache" icon={Zap} accent="text-emerald-400" />
        <AdminStatCard title="Backend" value="Convex" sub="Serverless — auto-scaled" icon={Server} accent="text-purple-400" />
      </div>

      {/* Rate limits */}
      <div className="bg-accent/30 border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Global Rate Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { plan: "Starter", rpm: "1,000", tpm: "200,000" },
            { plan: "Pro", rpm: "10,000", tpm: "2,000,000" },
            { plan: "Enterprise", rpm: "Custom", tpm: "Custom" },
          ].map((r) => (
            <div key={r.plan} className="bg-accent/30 border border-border rounded-lg p-3">
              <div className="text-xs font-medium text-foreground/70 mb-2">{r.plan}</div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Requests/min</span><span className="text-foreground/70 font-mono">{r.rpm}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tokens/min</span><span className="text-foreground/70 font-mono">{r.tpm}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Routing */}
      <div className="bg-accent/30 border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Default Routing</h3>
        <div className="space-y-3">
          {toggleItems.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs text-foreground/80">{s.label}</div>
                <div className="text-[10px] text-muted-foreground">{s.desc}</div>
              </div>
              <button
                onClick={() => toggleSetting(s.key)}
                className={`w-9 h-5 rounded-full relative transition-colors ${settings[s.key] ? "bg-emerald-500/30" : "bg-secondary"}`}
              >
                <div className={`absolute top-0.5 size-4 rounded-full transition-all ${settings[s.key] ? "right-0.5 bg-emerald-400" : "left-0.5 bg-zinc-500"}`} />
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          * Pengaturan ini tersimpan di browser (localStorage).
          {saveMsg && <span className="text-emerald-400 ml-2 font-medium not-italic">{saveMsg}</span>}
        </p>
      </div>

      {/* Infrastructure Info */}
      <div className="bg-accent/30 border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Infrastructure</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-accent/30 border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Backend</div>
            <div className="text-foreground/80 font-medium">Convex</div>
            <div className="text-[10px] text-muted-foreground">Serverless, auto-scaling</div>
          </div>
          <div className="bg-accent/30 border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Database</div>
            <div className="text-foreground/80 font-medium">Convex DB</div>
            <div className="text-[10px] text-muted-foreground">Real-time, reactive</div>
          </div>
          <div className="bg-accent/30 border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Frontend</div>
            <div className="text-foreground/80 font-medium">Vite + React</div>
            <div className="text-[10px] text-muted-foreground">SPA, Tailwind CSS v4</div>
          </div>
          <div className="bg-accent/30 border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Auth</div>
            <div className="text-foreground/80 font-medium">Convex Auth</div>
            <div className="text-[10px] text-muted-foreground">Email + Password</div>
          </div>
          <div className="bg-accent/30 border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground mb-1">API Proxy</div>
            <div className="text-foreground/80 font-medium">HTTP Actions</div>
            <div className="text-[10px] text-muted-foreground">Streaming SSE support</div>
          </div>
          <div className="bg-accent/30 border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Providers</div>
            <div className="text-foreground/80 font-medium">232 providers</div>
            <div className="text-[10px] text-muted-foreground">498 models seeded</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Theme Toggle ── */
function AdminThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable) return null;
  return (
    <button
      onClick={toggleTheme}
      className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN ADMIN DASHBOARD LAYOUT
   ═══════════════════════════════════════════════════════════════ */

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const TabContent = useMemo(() => {
    const tabs: Record<AdminTab, React.FC> = {
      overview: AdminOverviewTab,
      users: AdminUsersTab,
      models: AdminModelsTab,
      "provider-config": AdminProviderConfigTab,
      connections: AdminConnectionsTab,
      pricing: AdminPricingTab,
      payments: AdminPaymentsTab,
      audit: AdminAuditTab,
      system: AdminSystemTab,
    };
    return tabs[activeTab];
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 rounded-lg hover:bg-accent/50">
              <Menu className="size-4 text-muted-foreground" />
            </button>
            <Link to="/" className="flex items-center gap-2 text-foreground">
              <div className="size-7 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center">
                <Shield className="size-3.5 text-red-400" />
              </div>
              <span className="font-semibold text-sm">AdalahCredit</span>
              <span className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-medium">Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[10px]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-muted-foreground">All systems operational</span>
            </div>
            <AdminThemeToggle />
            <NotificationBell />
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="size-7 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-[10px] font-bold text-foreground">
                SA
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-medium text-foreground/80">Super Admin</div>
                <div className="text-[10px] text-muted-foreground">admin@adalahcredit.com</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-56 shrink-0
          border-r border-border bg-background p-3
          transition-transform lg:translate-x-0 overflow-y-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <nav className="space-y-1 mt-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeTab === item.id ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-accent/30"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">Quick Links</p>
            <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground/80 hover:bg-accent/30 transition-colors">
              <Home className="size-4" /> User Dashboard
            </Link>
            <Link to="/status" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground/80 hover:bg-accent/30 transition-colors">
              <Activity className="size-4" /> Status Page
            </Link>
            <Link to="/docs" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground/80 hover:bg-accent/30 transition-colors">
              <FileText className="size-4" /> Documentation
            </Link>
            <Link to="/changelog" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground/80 hover:bg-accent/30 transition-colors">
              <Cpu className="size-4" /> Changelog
            </Link>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground/80 hover:bg-accent/30 transition-colors">
              <ExternalLink className="size-4" /> Public Site
            </Link>
            <button
              onClick={() => { document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"); }); window.location.href = "/login"; }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.05] transition-colors mt-1"
            >
              <LogOut className="size-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-background/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TabContent />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
