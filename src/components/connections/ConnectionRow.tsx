/**
 * ConnectionRow — Single provider connection card
 *
 * KeiRouter-style features:
 *   - Test button (probes provider API)
 *   - Priority controls (move up/down)
 *   - NeedsReconnect badge (when refresh permanently fails)
 *   - Backoff level display
 *   - Multi-account support
 */

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit3,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Shield,
  Zap,
  MoreHorizontal,
  Eye,
  EyeOff,
  Play,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

export interface ConnectionData {
  _id: string;
  provider: string;
  authType: string;
  label?: string;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  name?: string;
  displayName?: string;
  isActive?: boolean;
  testStatus?: string;
  rateLimitedUntil?: number;
  lastUsedAt?: number;
  expiresAt?: string;
  expiresIn?: number;
  createdAt: number;
  updatedAt: number;
  // KeiRouter import fields
  priority?: number;
  backoffLevel?: number;
  needsReconnect?: boolean;
  lastTestAt?: number;
  lastTestResult?: string;
  lastTestMessage?: string;
}

interface ConnectionRowProps {
  connection: ConnectionData;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (connection: ConnectionData) => void;
  onReauth?: (connection: ConnectionData) => void;
  isToggling?: boolean;
}

// ── Helpers ────────────────────────────────────────────────

function getStatusInfo(conn: ConnectionData) {
  const now = Date.now();

  // NeedsReconnect — highest priority status
  if (conn.needsReconnect) {
    return {
      label: "Needs Reconnect",
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      icon: WifiOff,
    };
  }

  // Rate limited
  if (conn.rateLimitedUntil && conn.rateLimitedUntil > now) {
    const remaining = Math.ceil((conn.rateLimitedUntil - now) / 1000 / 60);
    return {
      label: `Rate limited (${remaining}m)`,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: Clock,
    };
  }

  // Token expired
  if (conn.expiresAt) {
    const expiry = new Date(conn.expiresAt).getTime();
    if (expiry < now) {
      return {
        label: "Token expired",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        icon: XCircle,
      };
    }
  }

  // Test status
  switch (conn.testStatus) {
    case "active":
      return {
        label: "Active",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        icon: CheckCircle,
      };
    case "error":
      return {
        label: "Error",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        icon: AlertCircle,
      };
    case "expired":
      return {
        label: "Expired",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        icon: XCircle,
      };
    case "rate_limited":
      return {
        label: "Backoff",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        icon: Clock,
      };
    default:
      return {
        label: conn.isActive ? "Active" : "Disabled",
        color: conn.isActive ? "text-emerald-400" : "text-zinc-400",
        bg: conn.isActive
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-zinc-500/10 border-zinc-500/20",
        icon: conn.isActive ? CheckCircle : XCircle,
      };
  }
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function maskToken(token?: string): string {
  if (!token) return "—";
  if (token.length <= 10) return "••••••••";
  return token.slice(0, 6) + "••••" + token.slice(-4);
}

// ── Component ──────────────────────────────────────────────

export function ConnectionRow({
  connection: conn,
  onToggleActive,
  onDelete,
  onEdit,
  onReauth,
  isToggling,
}: ConnectionRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: string;
    message: string;
    latencyMs: number;
  } | null>(null);

  const updateMut = useMutation(api.providerConnections.update);

  const status = getStatusInfo(conn);
  const StatusIcon = status.icon;

  const displayName =
    conn.label || conn.displayName || conn.name || conn.email || `Connection ${conn._id.slice(-6)}`;
  const authLabel =
    conn.authType === "oauth"
      ? "OAuth"
      : conn.authType === "import_token"
        ? "Token"
        : conn.authType === "api_key"
          ? "API Key"
          : conn.authType;
  const priority = conn.priority ?? 100;
  const backoffLevel = conn.backoffLevel ?? 0;

  // ── Test Connection ──────────────────────────────────────
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const siteUrl =
        import.meta.env.VITE_CONVEX_SITE_URL ||
        (import.meta.env.VITE_CONVEX_URL || "").replace(".cloud", ".site");
      const resp = await fetch(`${siteUrl}/api/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: conn._id }),
      });
      const data = await resp.json();
      setTestResult({
        status: data.status,
        message: data.message,
        latencyMs: data.latencyMs,
      });
    } catch (err) {
      setTestResult({
        status: "error",
        message: "Network error",
        latencyMs: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // ── Priority Controls ────────────────────────────────────
  const handlePriorityChange = async (delta: number) => {
    const newPriority = Math.max(1, Math.min(999, priority + delta));
    await updateMut({
      connectionId: conn._id as Id<"providerConnections">,
      priority: newPriority,
    });
  };

  return (
    <div
      className={`group relative rounded-xl border transition-all ${
        conn.needsReconnect
          ? "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50"
          : conn.isActive
            ? "border-border bg-accent/20 hover:border-foreground/15"
            : "border-border/50 bg-accent/5 opacity-60 hover:opacity-80"
      }`}
    >
      <div className="p-3.5">
        {/* Top row — Identity + Status + Controls */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Active toggle */}
            <button
              onClick={() => onToggleActive(conn._id, !conn.isActive)}
              disabled={isToggling}
              className="shrink-0 transition-colors"
              title={conn.isActive ? "Disable" : "Enable"}
            >
              {conn.isActive ? (
                <ToggleRight className="size-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="size-5 text-zinc-500" />
              )}
            </button>

            {/* Name / Email */}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground truncate">
                {displayName}
              </div>
              {conn.email && conn.email !== displayName && (
                <div className="text-[10px] text-muted-foreground truncate">
                  {conn.email}
                </div>
              )}
            </div>
          </div>

          {/* Priority + Status + Test + Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Priority controls */}
            <div className="flex flex-col items-center gap-0">
              <button
                onClick={() => handlePriorityChange(-10)}
                className="size-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Higher priority (lower number)"
              >
                <ChevronUp className="size-3" />
              </button>
              <span
                className="text-[9px] font-mono text-muted-foreground min-w-[24px] text-center"
                title={`Priority: ${priority} (lower = higher priority)`}
              >
                P{priority}
              </span>
              <button
                onClick={() => handlePriorityChange(10)}
                className="size-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Lower priority (higher number)"
              >
                <ChevronDown className="size-3" />
              </button>
            </div>

            {/* NeedsReconnect badge */}
            {conn.needsReconnect && (
              <button
                onClick={() => onReauth?.(conn)}
                className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full border bg-orange-500/15 border-orange-500/30 text-orange-400 font-medium hover:bg-orange-500/25 transition-colors"
                title="OAuth token expired permanently — click to reconnect"
              >
                <WifiOff className="size-2.5" />
                Reconnect
              </button>
            )}

            {/* Backoff level indicator */}
            {backoffLevel > 0 && !conn.needsReconnect && (
              <span
                className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono"
                title={`Backoff level: ${backoffLevel} (exponential cooldown active)`}
              >
                <AlertTriangle className="size-2" />
                L{backoffLevel}
              </span>
            )}

            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${status.bg} ${status.color}`}
            >
              <StatusIcon className="size-2.5" />
              {status.label}
            </span>

            {/* Test button */}
            <button
              onClick={handleTest}
              disabled={isTesting}
              className={`size-7 rounded-lg flex items-center justify-center transition-all ${
                isTesting
                  ? "bg-blue-500/20 text-blue-400"
                  : "hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400"
              }`}
              title="Test connection"
            >
              {isTesting ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
            </button>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <MoreHorizontal className="size-3.5 text-muted-foreground" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-50 w-40 bg-background border border-border rounded-xl shadow-xl py-1 overflow-hidden">
                    <button
                      onClick={() => {
                        onEdit(conn);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-muted transition-colors"
                    >
                      <Edit3 className="size-3" /> Edit
                    </button>
                    {onReauth && (
                      <button
                        onClick={() => {
                          onReauth(conn);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-muted transition-colors"
                      >
                        <RefreshCw className="size-3" /> Reauth
                      </button>
                    )}
                    <div className="h-px bg-border mx-2 my-1" />
                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="size-3" /> Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onDelete(conn._id);
                          setShowMenu(false);
                          setConfirmDelete(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 bg-red-500/10 font-medium"
                      >
                        <Trash2 className="size-3" /> Confirm Delete?
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Test result banner */}
        {testResult && (
          <div
            className={`mb-2.5 flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-lg border ${
              testResult.status === "ok"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {testResult.status === "ok" ? (
              <Wifi className="size-3 shrink-0" />
            ) : (
              <AlertCircle className="size-3 shrink-0" />
            )}
            <span className="truncate">{testResult.message}</span>
            {testResult.latencyMs > 0 && (
              <span className="ml-auto shrink-0 font-mono text-[9px] opacity-70">
                {testResult.latencyMs}ms
              </span>
            )}
            <button
              onClick={() => setTestResult(null)}
              className="ml-1 shrink-0 hover:opacity-70"
            >
              ×
            </button>
          </div>
        )}

        {/* Bottom row — Meta info */}
        <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Shield className="size-2.5" /> {authLabel}
          </span>

          {conn.accessToken && (
            <button
              onClick={() => setShowToken(!showToken)}
              className="inline-flex items-center gap-1 hover:text-foreground/70 transition-colors"
            >
              {showToken ? (
                <EyeOff className="size-2.5" />
              ) : (
                <Eye className="size-2.5" />
              )}
              {showToken ? maskToken(conn.accessToken) : "•••• Token"}
            </button>
          )}

          {conn.lastUsedAt && (
            <span className="inline-flex items-center gap-1">
              <Zap className="size-2.5" /> Used {formatTimeAgo(conn.lastUsedAt)}
            </span>
          )}

          <span className="inline-flex items-center gap-1">
            <Clock className="size-2.5" /> Added {formatTimeAgo(conn.createdAt)}
          </span>

          {conn.lastTestAt && (
            <span className="inline-flex items-center gap-1">
              <Play className="size-2.5" /> Tested{" "}
              {formatTimeAgo(conn.lastTestAt)}
            </span>
          )}

          {conn.expiresAt && (
            <span className="inline-flex items-center gap-1">
              <AlertCircle className="size-2.5" />
              Expires {new Date(conn.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectionRow;
