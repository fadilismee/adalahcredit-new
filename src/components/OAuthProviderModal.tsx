/**
 * OAuthProviderModal — Unified OAuth modal for all provider flow types
 *
 * Supports 3 modes:
 * 1. Browser OAuth (authorization_code / authorization_code_pkce) — opens popup
 * 2. Device Code — shows user code + verification URL, polls for completion
 * 3. Import Token — paste token directly
 *
 * Ported from OmniRoute: shared/components/OAuthModal.tsx
 * Adapted for our React + shadcn/ui + Tailwind stack
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ExternalLink,
  Link2,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Key,
  Monitor,
  Smartphone,
  X,
  RefreshCw,
} from "lucide-react";
import { useProviderOAuthV2, type OAuthProviderInfo } from "@/hooks/useProviderOAuthV2";

// ── Provider display info ──────────────────────────────────

const PROVIDER_DISPLAY: Record<string, { label: string; icon?: string; color: string }> = {
  claude: { label: "Claude (Anthropic)", color: "bg-orange-500" },
  codex: { label: "Codex (OpenAI)", color: "bg-green-500" },
  openai: { label: "OpenAI", color: "bg-green-500" },
  "gemini-cli": { label: "Gemini CLI (Google)", color: "bg-blue-500" },
  antigravity: { label: "Antigravity", color: "bg-purple-500" },
  agy: { label: "AGY", color: "bg-purple-500" },
  github: { label: "GitHub Copilot", color: "bg-gray-700" },
  qwen: { label: "Qwen", color: "bg-blue-600" },
  "kimi-coding": { label: "Kimi Coding", color: "bg-cyan-500" },
  kilocode: { label: "KiloCode", color: "bg-yellow-500" },
  cline: { label: "Cline", color: "bg-indigo-500" },
  kiro: { label: "Kiro / Amazon Q", color: "bg-orange-600" },
  "amazon-q": { label: "Amazon Q", color: "bg-orange-600" },
  "gitlab-duo": { label: "GitLab Duo", color: "bg-red-500" },
  qoder: { label: "Qoder", color: "bg-teal-500" },
  cursor: { label: "Cursor", color: "bg-violet-500" },
  trae: { label: "Trae", color: "bg-sky-500" },
  windsurf: { label: "Windsurf", color: "bg-emerald-500" },
  "devin-cli": { label: "Devin CLI", color: "bg-emerald-500" },
};

function getProviderLabel(provider: string): string {
  return PROVIDER_DISPLAY[provider]?.label || provider;
}

function getProviderColor(provider: string): string {
  return PROVIDER_DISPLAY[provider]?.color || "bg-blue-500";
}

// ── Flow type icons & labels ───────────────────────────────

function FlowTypeIcon({ flowType }: { flowType: string }) {
  switch (flowType) {
    case "authorization_code":
    case "authorization_code_pkce":
      return <Monitor className="size-3.5" />;
    case "device_code":
      return <Smartphone className="size-3.5" />;
    case "import_token":
      return <Key className="size-3.5" />;
    default:
      return <Link2 className="size-3.5" />;
  }
}

function flowTypeLabel(flowType: string): string {
  switch (flowType) {
    case "authorization_code":
    case "authorization_code_pkce":
      return "Browser Login";
    case "device_code":
      return "Device Code";
    case "import_token":
      return "Import Token";
    default:
      return flowType;
  }
}

// ── Props ──────────────────────────────────────────────────

interface OAuthProviderModalProps {
  isOpen: boolean;
  provider: string;
  providerInfo?: OAuthProviderInfo | null;
  onSuccess?: () => void;
  onClose: () => void;
}

// ── Main Component ─────────────────────────────────────────

export function OAuthProviderModal({
  isOpen,
  provider,
  providerInfo,
  onSuccess,
  onClose,
}: OAuthProviderModalProps) {
  const {
    step,
    error,
    connection,
    deviceData,
    startAuthCodeFlow,
    startDeviceCodeFlow,
    importToken,
    reset,
  } = useProviderOAuthV2();

  const [pasteToken, setPasteToken] = useState("");
  const [copied, setCopied] = useState(false);

  const flowType = providerInfo?.flowType || "authorization_code";
  const label = getProviderLabel(provider);
  const color = getProviderColor(provider);

  // Determine available tabs
  const tabs = useMemo(() => {
    const t: { id: string; label: string; icon: React.ReactNode }[] = [];
    if (flowType === "authorization_code" || flowType === "authorization_code_pkce") {
      t.push({ id: "browser", label: "Browser Login", icon: <Monitor className="size-3.5" /> });
    }
    if (flowType === "device_code") {
      t.push({ id: "device", label: "Device Code", icon: <Smartphone className="size-3.5" /> });
    }
    if (flowType === "import_token" || providerInfo?.hasImportToken) {
      t.push({ id: "import", label: "Import Token", icon: <Key className="size-3.5" /> });
    }
    // Always show import as fallback option for non-import providers
    if (!t.find((x) => x.id === "import")) {
      t.push({ id: "import", label: "Manual Token", icon: <Key className="size-3.5" /> });
    }
    return t;
  }, [flowType, providerInfo?.hasImportToken]);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "browser");

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      reset();
      setPasteToken("");
      setCopied(false);
      setActiveTab(tabs[0]?.id || "browser");
    }
  }, [isOpen, reset, tabs]);

  // Call onSuccess when flow completes
  useEffect(() => {
    if (step === "success") {
      onSuccess?.();
    }
  }, [step, onSuccess]);

  // ── Handlers ──────────────────────────────────────────────

  const handleBrowserLogin = useCallback(() => {
    startAuthCodeFlow(provider);
  }, [startAuthCodeFlow, provider]);

  const handleDeviceCode = useCallback(() => {
    startDeviceCodeFlow(provider);
  }, [startDeviceCodeFlow, provider]);

  const handleImportToken = useCallback(() => {
    const trimmed = pasteToken.trim();
    if (!trimmed) return;
    importToken(provider, trimmed);
  }, [importToken, provider, pasteToken]);

  const handleCopyCode = useCallback(() => {
    if (deviceData?.user_code) {
      navigator.clipboard.writeText(deviceData.user_code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [deviceData?.user_code]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`size-9 rounded-xl ${color}/20 flex items-center justify-center`}>
              <FlowTypeIcon flowType={flowType} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Connect {label}</h2>
              <p className="text-[10px] text-muted-foreground">
                {flowTypeLabel(flowType)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Success State */}
        {step === "success" && (
          <div className="p-6 text-center space-y-4">
            <div className="size-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="size-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Berhasil Terhubung!</h3>
              {connection?.email && (
                <p className="text-sm text-muted-foreground mt-1">{connection.email}</p>
              )}
              {connection?.displayName && !connection?.email && (
                <p className="text-sm text-muted-foreground mt-1">{connection.displayName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Error State */}
        {step === "error" && (
          <div className="p-6 text-center space-y-4">
            <div className="size-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Koneksi Gagal</h3>
              <p className="text-sm text-red-400 mt-2 leading-relaxed">{error}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  reset();
                  setActiveTab(tabs[0]?.id || "browser");
                }}
                className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="size-3.5" /> Coba Lagi
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted/50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Active Flow States (not success/error) */}
        {step !== "success" && step !== "error" && (
          <div className="p-5 space-y-4">
            {/* Tab selector (only show if multiple tabs) */}
            {tabs.length > 1 && step === "idle" && (
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Browser Login Tab ──────────────────────── */}
            {activeTab === "browser" && step === "idle" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-500/20 bg-gradient-to-b from-blue-500/8 to-blue-500/3 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Monitor className="size-3.5 text-blue-400" />
                    <span>Popup baru akan terbuka untuk login</span>
                  </div>
                  <button
                    onClick={handleBrowserLogin}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 hover:bg-blue-500/25 hover:border-blue-500/40 transition-all text-sm font-medium"
                  >
                    <ExternalLink className="size-4" />
                    Login dengan {label}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Login → Authorize → Token otomatis tersimpan
                </p>
              </div>
            )}

            {activeTab === "browser" && step === "authorizing" && (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="size-8 mx-auto text-blue-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Menunggu autentikasi di popup...</p>
                <p className="text-[10px] text-muted-foreground/60">
                  Selesaikan login di window popup yang terbuka
                </p>
              </div>
            )}

            {activeTab === "browser" && step === "exchanging" && (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="size-8 mx-auto text-emerald-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Menukar token...</p>
              </div>
            )}

            {/* ── Device Code Tab ────────────────────────── */}
            {activeTab === "device" && step === "idle" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/8 to-amber-500/3 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Smartphone className="size-3.5 text-amber-400" />
                    <span>Device code flow — masukkan code di website provider</span>
                  </div>
                  <button
                    onClick={handleDeviceCode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25 hover:border-amber-500/40 transition-all text-sm font-medium"
                  >
                    <Smartphone className="size-4" />
                    Mulai Device Code Flow
                  </button>
                </div>
              </div>
            )}

            {(activeTab === "device" || step === "polling") && step === "polling" && deviceData && (
              <div className="space-y-4">
                {/* User Code Display */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center space-y-3">
                  <p className="text-[11px] text-muted-foreground">Masukkan kode ini di {label}:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-2xl font-bold font-mono tracking-widest text-foreground">
                      {deviceData.user_code}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="size-8 rounded-lg hover:bg-muted/80 flex items-center justify-center transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <CheckCircle className="size-4 text-emerald-400" />
                      ) : (
                        <Copy className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {(deviceData.verification_uri_complete || deviceData.verification_uri) && (
                    <a
                      href={deviceData.verification_uri_complete || deviceData.verification_uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25 text-xs font-medium transition-all"
                    >
                      <ExternalLink className="size-3" />
                      Buka Halaman Verifikasi
                    </a>
                  )}
                </div>

                {/* Polling indicator */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="size-4 text-amber-400 animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    Menunggu kamu selesai login di {label}...
                  </span>
                </div>
              </div>
            )}

            {/* ── Import Token Tab ───────────────────────── */}
            {activeTab === "import" && (step === "idle" || step === "authorizing") && (
              <div className="space-y-4">
                <div className="rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-500/8 to-violet-500/3 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Key className="size-3.5 text-violet-400" />
                    <span>Paste access token atau API key kamu</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={pasteToken}
                      onChange={(e) => setPasteToken(e.target.value)}
                      placeholder="sk-ant-xxxxx / ghp_xxxxx / token..."
                      className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2.5 text-foreground/80 placeholder-muted-foreground/50 outline-none focus:border-violet-500/40 font-mono transition-colors"
                    />
                    <button
                      onClick={handleImportToken}
                      disabled={!pasteToken.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-400 hover:bg-violet-500/25 hover:border-violet-500/40 transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Key className="size-3.5" />
                      Import Token
                    </button>
                  </div>
                  <p className="text-[9px] text-muted-foreground/60">
                    PAT, session key, OAuth token, atau API key dari {label}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "import" && step === "exchanging" && (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="size-8 mx-auto text-violet-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Menyimpan token...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OAuthProviderModal;
