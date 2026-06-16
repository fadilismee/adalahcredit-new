/**
 * ConnectionsPanel — Full connection management UI
 *
 * KeiRouter import features:
 * - Multi-account per provider (unlimited connections)
 * - NeedsReconnect count in stats
 * - Test All button
 * - Priority-sorted display
 * - Backoff level visibility
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ConnectionRow } from "./ConnectionRow";
import type { ConnectionData } from "./ConnectionRow";
import { EditConnectionModal } from "./EditConnectionModal";
import { OAuthProviderModal } from "../OAuthProviderModal";
import type { OAuthProviderInfo } from "@/hooks/useProviderOAuthV2";
import {
  Link2,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Shield,
  Globe,
  Play,
  WifiOff,
} from "lucide-react";

// ── Provider display names ─────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  claude: "Claude (Anthropic)",
  codex: "Codex (OpenAI)",
  openai: "OpenAI",
  "gemini-cli": "Gemini CLI",
  github: "GitHub Copilot",
  qwen: "Qwen",
  kiro: "Kiro / Amazon Q",
  "amazon-q": "Amazon Q",
  cursor: "Cursor",
  windsurf: "Windsurf",
  trae: "Trae",
  "gitlab-duo": "GitLab Duo",
  antigravity: "Antigravity",
  agy: "AGY",
  "kimi-coding": "Kimi Coding",
  kilocode: "KiloCode",
  cline: "Cline",
  qoder: "Qoder",
  "devin-cli": "Devin CLI",
};

// ── Main Component ─────────────────────────────────────────

export function ConnectionsPanel() {
  // ── Data from Convex ──────────────────────────────────────
  const allConnections = useQuery(api.providerConnections.listAll);
  const toggleActiveMut = useMutation(api.providerConnections.toggleActive);
  const removeMut = useMutation(api.providerConnections.remove);
  const updateMut = useMutation(api.providerConnections.update);

  // ── Local state ───────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingConn, setEditingConn] = useState<ConnectionData | null>(null);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedProviderInfo, setSelectedProviderInfo] =
    useState<OAuthProviderInfo | null>(null);
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderInfo[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testAllProgress, setTestAllProgress] = useState<{
    done: number;
    total: number;
    ok: number;
    fail: number;
  } | null>(null);

  // ── Load OAuth provider list ──────────────────────────────
  useEffect(() => {
    const siteUrl =
      import.meta.env.VITE_CONVEX_SITE_URL ||
      (import.meta.env.VITE_CONVEX_URL || "").replace(".cloud", ".site");
    fetch(`${siteUrl}/api/provider-oauth-v2/list-providers`)
      .then((r) => r.json())
      .then((data) => setOauthProviders(data.providers || []))
      .catch(() => {});
  }, []);

  // ── Computed stats ────────────────────────────────────────
  const stats = useMemo(() => {
    if (!allConnections)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        rateLimited: 0,
        needsReconnect: 0,
        providers: 0,
      };
    const now = Date.now();
    return {
      total: allConnections.length,
      active: allConnections.filter((c) => c.isActive && !c.needsReconnect)
        .length,
      inactive: allConnections.filter((c) => !c.isActive).length,
      rateLimited: allConnections.filter(
        (c) => c.rateLimitedUntil && c.rateLimitedUntil > now
      ).length,
      needsReconnect: allConnections.filter((c) => c.needsReconnect).length,
      providers: new Set(allConnections.map((c) => c.provider)).size,
    };
  }, [allConnections]);

  // ── Unique providers in connections ───────────────────────
  const activeProviders = useMemo(() => {
    if (!allConnections) return [];
    const seen = new Set<string>();
    for (const c of allConnections) seen.add(c.provider);
    return Array.from(seen).sort();
  }, [allConnections]);

  // ── Filtered & searched connections ───────────────────────
  const filteredConnections = useMemo(() => {
    if (!allConnections) return [];
    let list = [...allConnections];

    // Provider filter
    if (providerFilter !== "all") {
      list = list.filter((c) => c.provider === providerFilter);
    }

    // Status filter
    if (statusFilter === "active")
      list = list.filter((c) => c.isActive && !c.needsReconnect);
    else if (statusFilter === "inactive") list = list.filter((c) => !c.isActive);
    else if (statusFilter === "reconnect")
      list = list.filter((c) => c.needsReconnect);
    else if (statusFilter === "error")
      list = list.filter(
        (c) =>
          c.testStatus === "error" ||
          c.testStatus === "expired" ||
          c.needsReconnect
      );

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.provider || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.name || "").toLowerCase().includes(q) ||
          (c.label || "").toLowerCase().includes(q) ||
          (c.displayName || "").toLowerCase().includes(q)
      );
    }

    // Sort: priority first (lower = higher), then active before inactive, then by creation
    list.sort((a, b) => {
      if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
      const aPri = (a as any).priority ?? 100;
      const bPri = (b as any).priority ?? 100;
      if (aPri !== bPri) return aPri - bPri;
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

    return list;
  }, [allConnections, providerFilter, statusFilter, search]);

  // ── Group by provider ─────────────────────────────────────
  const groupedByProvider = useMemo(() => {
    const groups: Record<string, typeof filteredConnections> = {};
    for (const conn of filteredConnections) {
      if (!groups[conn.provider]) groups[conn.provider] = [];
      groups[conn.provider].push(conn);
    }
    return groups;
  }, [filteredConnections]);

  // ── Handlers ──────────────────────────────────────────────

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    try {
      await toggleActiveMut({
        connectionId: id as Id<"providerConnections">,
        isActive,
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await removeMut({ connectionId: id as Id<"providerConnections"> });
  };

  const handleEditSave = async (
    id: string,
    data: { name?: string; displayName?: string }
  ) => {
    await updateMut({
      connectionId: id as Id<"providerConnections">,
      ...data,
    });
  };

  const handleAddConnection = (providerName: string) => {
    setSelectedProvider(providerName);
    const info = oauthProviders.find((p) => p.name === providerName) || null;
    setSelectedProviderInfo(info);
    setShowOAuthModal(true);
  };

  // ── Test All connections ─────────────────────────────────
  const handleTestAll = async () => {
    if (!allConnections || isTestingAll) return;
    setIsTestingAll(true);
    const activeConns = allConnections.filter((c) => c.isActive);
    setTestAllProgress({ done: 0, total: activeConns.length, ok: 0, fail: 0 });

    const siteUrl =
      import.meta.env.VITE_CONVEX_SITE_URL ||
      (import.meta.env.VITE_CONVEX_URL || "").replace(".cloud", ".site");

    let ok = 0;
    let fail = 0;
    for (let i = 0; i < activeConns.length; i++) {
      try {
        const resp = await fetch(`${siteUrl}/api/test-connection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId: activeConns[i]._id }),
        });
        const data = await resp.json();
        if (data.status === "ok") ok++;
        else fail++;
      } catch {
        fail++;
      }
      setTestAllProgress({
        done: i + 1,
        total: activeConns.length,
        ok,
        fail,
      });
    }

    setIsTestingAll(false);
    // Auto-dismiss after 5s
    setTimeout(() => setTestAllProgress(null), 5000);
  };

  // ── Loading state ─────────────────────────────────────────

  if (!allConnections) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────

  if (allConnections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16 space-y-4">
          <div className="size-20 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Link2 className="size-10 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Belum ada koneksi
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Hubungkan akun AI provider kamu untuk mulai menggunakan API proxy.
            </p>
          </div>

          {/* Provider buttons */}
          <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-lg mx-auto">
            {oauthProviders.slice(0, 8).map((p) => (
              <button
                key={p.name}
                onClick={() => handleAddConnection(p.name)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/30 border border-border text-xs font-medium text-foreground hover:border-foreground/20 hover:bg-accent/50 transition-all"
              >
                <Plus className="size-3" />
                {PROVIDER_LABELS[p.name] || p.name}
              </button>
            ))}
          </div>
        </div>

        {/* OAuth Modal */}
        <OAuthProviderModal
          isOpen={showOAuthModal}
          provider={selectedProvider}
          providerInfo={selectedProviderInfo}
          onSuccess={() => setShowOAuthModal(false)}
          onClose={() => setShowOAuthModal(false)}
        />
      </div>
    );
  }

  // ── Full UI ───────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Stats Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: Globe,
            color: "text-blue-400",
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircle,
            color: "text-emerald-400",
          },
          {
            label: "Inactive",
            value: stats.inactive,
            icon: XCircle,
            color: "text-zinc-400",
          },
          {
            label: "Rate Limited",
            value: stats.rateLimited,
            icon: AlertTriangle,
            color: "text-amber-400",
          },
          {
            label: "Reconnect",
            value: stats.needsReconnect,
            icon: WifiOff,
            color: stats.needsReconnect > 0 ? "text-orange-400" : "text-zinc-400",
          },
          {
            label: "Providers",
            value: stats.providers,
            icon: Shield,
            color: "text-violet-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-accent/30 border border-border rounded-xl p-3 text-center"
          >
            <Icon className={`size-4 mx-auto mb-1 ${color}`} />
            <div className="text-lg font-bold text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Test All Progress ────────────────────────────── */}
      {testAllProgress && (
        <div className="bg-accent/30 border border-border rounded-xl p-3">
          <div className="flex items-center gap-3 text-xs">
            {isTestingAll && (
              <RefreshCw className="size-3.5 animate-spin text-blue-400 shrink-0" />
            )}
            <span className="text-foreground font-medium">
              Testing: {testAllProgress.done}/{testAllProgress.total}
            </span>
            <span className="text-emerald-400">✓ {testAllProgress.ok}</span>
            <span className="text-red-400">✗ {testAllProgress.fail}</span>
            {!isTestingAll && (
              <button
                onClick={() => setTestAllProgress(null)}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
          {isTestingAll && (
            <div className="mt-2 h-1 bg-accent/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${(testAllProgress.done / testAllProgress.total) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email, nama, provider..."
            className="w-full text-xs bg-accent/30 border border-border rounded-lg pl-9 pr-3 py-2 text-foreground placeholder-muted-foreground/50 outline-none focus:border-foreground/30 transition-colors"
          />
        </div>

        {/* Provider filter */}
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="text-xs bg-accent/30 border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-foreground/30"
        >
          <option value="all">All Providers</option>
          {activeProviders.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABELS[p] || p}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-accent/30 border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-foreground/30"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="reconnect">Needs Reconnect</option>
          <option value="error">Error/Expired</option>
        </select>

        {/* Test All */}
        <button
          onClick={handleTestAll}
          disabled={isTestingAll}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
            isTestingAll
              ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30"
          }`}
        >
          {isTestingAll ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          Test All
        </button>

        {/* Add Connection */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-500/25 hover:border-blue-500/40 transition-all">
            <Plus className="size-3.5" /> Add Connection
          </button>
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-background border border-border rounded-xl shadow-xl py-1 hidden group-hover:block group-focus-within:block">
            {oauthProviders.map((p) => (
              <button
                key={p.name}
                onClick={() => handleAddConnection(p.name)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-muted transition-colors"
              >
                <Zap className="size-3 text-blue-400" />
                {PROVIDER_LABELS[p.name] || p.name}
                <span className="ml-auto text-[9px] text-muted-foreground">
                  {p.flowType === "device_code"
                    ? "device"
                    : p.flowType === "import_token"
                      ? "token"
                      : "oauth"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results count ────────────────────────────────── */}
      <div className="text-[10px] text-muted-foreground">
        Showing {filteredConnections.length} of {allConnections.length}{" "}
        connections
      </div>

      {/* ── Connection Groups ────────────────────────────── */}
      {Object.entries(groupedByProvider).map(([provider, connections]) => (
        <div key={provider} className="space-y-2">
          {/* Provider group header */}
          <div className="flex items-center gap-2 px-1">
            <div className="size-6 rounded-lg bg-accent/50 flex items-center justify-center">
              <Shield className="size-3 text-muted-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              {PROVIDER_LABELS[provider] || provider}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {connections.length} connection
              {connections.length !== 1 ? "s" : ""}
            </span>
            {/* NeedsReconnect count for this provider */}
            {connections.filter((c) => (c as any).needsReconnect).length > 0 && (
              <span className="text-[9px] text-orange-400 flex items-center gap-0.5">
                <WifiOff className="size-2.5" />
                {connections.filter((c) => (c as any).needsReconnect).length}{" "}
                needs reconnect
              </span>
            )}
            <button
              onClick={() => handleAddConnection(provider)}
              className="ml-auto text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <Plus className="size-2.5" /> Add
            </button>
          </div>

          {/* Connection cards */}
          <div className="space-y-2">
            {connections.map((conn) => (
              <ConnectionRow
                key={conn._id}
                connection={conn as ConnectionData}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
                onEdit={(c) => setEditingConn(c)}
                onReauth={(c) => {
                  setSelectedProvider(c.provider);
                  const info =
                    oauthProviders.find((p) => p.name === c.provider) || null;
                  setSelectedProviderInfo(info);
                  setShowOAuthModal(true);
                }}
                isToggling={togglingId === conn._id}
              />
            ))}
          </div>
        </div>
      ))}

      {/* No results */}
      {filteredConnections.length === 0 && allConnections.length > 0 && (
        <div className="text-center py-12 space-y-2">
          <Search className="size-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Tidak ada koneksi yang cocok dengan filter.
          </p>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      <EditConnectionModal
        isOpen={!!editingConn}
        connection={editingConn}
        onSave={handleEditSave}
        onClose={() => setEditingConn(null)}
      />

      <OAuthProviderModal
        isOpen={showOAuthModal}
        provider={selectedProvider}
        providerInfo={selectedProviderInfo}
        onSuccess={() => setShowOAuthModal(false)}
        onClose={() => setShowOAuthModal(false)}
      />
    </div>
  );
}

export default ConnectionsPanel;
