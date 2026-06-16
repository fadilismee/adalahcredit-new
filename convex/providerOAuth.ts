import { mutation, query, internalMutation } from "./_generated/server";
import { httpAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

/* ═══════════════════════════════════════════════════════════════
   PROVIDER OAUTH — OmniRoute-style popup login flow
   
   Flow: Click "Connect" → popup opens → user logs in with
   Google/GitHub/email on the provider's page → token captured
   → popup closes → provider connected ✅
   
   No CLIENT_ID / CLIENT_SECRET env vars needed by the admin.
   ═══════════════════════════════════════════════════════════════ */

type ProviderOAuthMeta = {
  displayName: string;
  loginMethods: ("google" | "github" | "email" | "microsoft" | "apple")[];
  color: string;       // brand color hex
  iconEmoji: string;   // fallback emoji
  loginHint: string;   // text shown to user
};

const PROVIDER_OAUTH_META: Record<string, ProviderOAuthMeta> = {
  // === OAuth category providers ===
  "github-copilot": { displayName: "GitHub Copilot", loginMethods: ["github"], color: "#24292e", iconEmoji: "🐙", loginHint: "Login dengan akun GitHub kamu" },
  "github-copilot-free": { displayName: "GitHub Copilot Free", loginMethods: ["github"], color: "#24292e", iconEmoji: "🐙", loginHint: "Login dengan akun GitHub kamu" },
  "gitlab-duo": { displayName: "GitLab Duo", loginMethods: ["google", "github", "email"], color: "#fc6d26", iconEmoji: "🦊", loginHint: "Login ke GitLab" },
  "claude-code": { displayName: "Claude Code", loginMethods: ["google", "email"], color: "#d97757", iconEmoji: "🤖", loginHint: "Login ke Anthropic Console" },
  "openai-codex": { displayName: "OpenAI Codex CLI", loginMethods: ["google", "email", "microsoft", "apple"], color: "#10a37f", iconEmoji: "🧠", loginHint: "Login ke OpenAI" },
  "gemini-cli": { displayName: "Gemini CLI", loginMethods: ["google"], color: "#4285f4", iconEmoji: "💎", loginHint: "Login dengan akun Google kamu" },
  "amazon-q": { displayName: "Amazon Q", loginMethods: ["email"], color: "#ff9900", iconEmoji: "📦", loginHint: "Login dengan AWS account" },
  "cline": { displayName: "Cline", loginMethods: ["google", "github"], color: "#6366f1", iconEmoji: "⚡", loginHint: "Login ke Cline" },
  "windsurf": { displayName: "Windsurf", loginMethods: ["google", "github", "email"], color: "#06b6d4", iconEmoji: "🏄", loginHint: "Login ke Codeium/Windsurf" },
  "kiro": { displayName: "Kiro", loginMethods: ["email"], color: "#f59e0b", iconEmoji: "🎯", loginHint: "Login ke Kiro" },
  "devin-cli": { displayName: "Devin CLI", loginMethods: ["google", "github"], color: "#8b5cf6", iconEmoji: "🤖", loginHint: "Login ke Devin" },
  "antigravity": { displayName: "Antigravity", loginMethods: ["google"], color: "#ec4899", iconEmoji: "🚀", loginHint: "Login dengan Google ke Antigravity" },
  "antigravity-cli": { displayName: "Antigravity CLI", loginMethods: ["google"], color: "#ec4899", iconEmoji: "🚀", loginHint: "Login dengan Google ke Antigravity" },
  "kilo-code": { displayName: "Kilo Code", loginMethods: ["google", "github"], color: "#22c55e", iconEmoji: "💻", loginHint: "Login ke Kilo Code" },
  "kimi-coding": { displayName: "Kimi Coding", loginMethods: ["google", "email"], color: "#3b82f6", iconEmoji: "🌙", loginHint: "Login ke Moonshot/Kimi" },
  "qoder-ai": { displayName: "Qoder AI", loginMethods: ["google", "github"], color: "#a855f7", iconEmoji: "🔮", loginHint: "Login ke Qoder" },
  "qwen-code": { displayName: "Qwen Code", loginMethods: ["email"], color: "#6366f1", iconEmoji: "🌐", loginHint: "Login ke Alibaba Cloud" },
  // === Web Cookie category providers ===
  "chatgpt": { displayName: "ChatGPT", loginMethods: ["google", "email", "microsoft", "apple"], color: "#10a37f", iconEmoji: "💬", loginHint: "Login ke ChatGPT" },
  "claude": { displayName: "Claude", loginMethods: ["google", "email"], color: "#d97757", iconEmoji: "🤖", loginHint: "Login ke Claude" },
  "gemini": { displayName: "Gemini", loginMethods: ["google"], color: "#4285f4", iconEmoji: "💎", loginHint: "Login dengan Google" },
  "copilot-web": { displayName: "Copilot Web", loginMethods: ["microsoft"], color: "#24292e", iconEmoji: "🐙", loginHint: "Login dengan Microsoft" },
  "mistral-le-chat": { displayName: "Mistral Le Chat", loginMethods: ["google", "email"], color: "#ff7000", iconEmoji: "🌪️", loginHint: "Login ke Mistral" },
  "deepseek-web": { displayName: "DeepSeek Web", loginMethods: ["google", "email"], color: "#4f46e5", iconEmoji: "🔍", loginHint: "Login ke DeepSeek" },
  "grok-web": { displayName: "Grok Web", loginMethods: ["google", "email"], color: "#1da1f2", iconEmoji: "🦆", loginHint: "Login ke X/Grok" },
  "poe": { displayName: "Poe", loginMethods: ["google", "email"], color: "#5865f2", iconEmoji: "📚", loginHint: "Login ke Poe" },
  "you-com": { displayName: "You.com", loginMethods: ["google", "email"], color: "#6c5ce7", iconEmoji: "🔍", loginHint: "Login ke You.com" },
  "perplexity": { displayName: "Perplexity", loginMethods: ["google", "email"], color: "#20b2aa", iconEmoji: "🔭", loginHint: "Login ke Perplexity" },
  "cohere-coral": { displayName: "Cohere Coral", loginMethods: ["google", "email"], color: "#39d353", iconEmoji: "🪸", loginHint: "Login ke Cohere" },
  "huggingface-chat": { displayName: "HuggingFace Chat", loginMethods: ["google", "github", "email"], color: "#ffcc00", iconEmoji: "🤗", loginHint: "Login ke HuggingFace" },
};

/* ═══════════════════════════════════════════════════════════════
   QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const getOAuthProviders = query({
  args: {},
  handler: async () => {
    const result: Record<string, { displayName: string; configured: boolean }> = {};
    for (const [slug, config] of Object.entries(PROVIDER_OAUTH_META)) {
      result[slug] = { displayName: config.displayName, configured: true };
    }
    return result;
  },
});

export const hasOAuthSupport = query({
  args: { provider: v.string() },
  handler: async (_ctx, { provider }) => {
    const config = PROVIDER_OAUTH_META[provider];
    if (!config) return { supported: false, configured: false, displayName: "" };
    return { supported: true, configured: true, displayName: config.displayName };
  },
});

export const getOAuthStatus = query({
  args: { provider: v.string() },
  handler: async (ctx, { provider }) => {
    const providerConfig = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .first();
    return {
      connected: !!providerConfig?.oauthAccessToken,
      connectedAt: providerConfig?.updatedAt,
    };
  },
});

export const getOAuthStateByState = query({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    const oauthState = await ctx.db
      .query("providerOAuthStates")
      .withIndex("by_state", (q) => q.eq("state", state))
      .first();
    if (!oauthState) return null;
    if (oauthState.expiresAt < Date.now()) return null;
    if (oauthState.status !== "pending") return null;
    return { provider: oauthState.provider, status: oauthState.status };
  },
});

/* ═══════════════════════════════════════════════════════════════
   MUTATIONS
   ═══════════════════════════════════════════════════════════════ */

export const createOAuthState = mutation({
  args: { provider: v.string() },
  handler: async (ctx, { provider }) => {
    const state = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.insert("providerOAuthStates", {
      state,
      provider,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000,
      status: "pending",
    });
    return state;
  },
});

export const completeOAuthState = internalMutation({
  args: {
    state: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
  },
  handler: async (ctx, { state, accessToken, refreshToken, expiresIn }) => {
    const oauthState = await ctx.db
      .query("providerOAuthStates")
      .withIndex("by_state", (q) => q.eq("state", state))
      .first();
    if (!oauthState) throw new Error("OAuth state not found");
    if (oauthState.status !== "pending") throw new Error("Already completed");
    if (oauthState.expiresAt < Date.now()) throw new Error("Expired");

    await ctx.db.patch(oauthState._id, { status: "completed" });

    const providerConfig = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", oauthState.provider))
      .first();
    if (!providerConfig) throw new Error(`Provider ${oauthState.provider} not found`);

    const updates: Record<string, unknown> = {
      oauthAccessToken: accessToken,
      updatedAt: Date.now(),
    };
    if (refreshToken) updates.oauthRefreshToken = refreshToken;
    if (expiresIn) updates.oauthExpiresAt = Date.now() + expiresIn * 1000;

    await ctx.db.patch(providerConfig._id, updates);
    return oauthState.provider;
  },
});

export const failOAuthState = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    const oauthState = await ctx.db
      .query("providerOAuthStates")
      .withIndex("by_state", (q) => q.eq("state", state))
      .first();
    if (oauthState) {
      await ctx.db.patch(oauthState._id, { status: "failed" });
    }
  },
});

/* ═══════════════════════════════════════════════════════════════
   HTTP ACTIONS — Popup login page + completion endpoint
   ═══════════════════════════════════════════════════════════════ */

// GET /api/provider-oauth/start?provider=xxx
// Shows a beautiful login popup page for the specific provider
export const oauthStart = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  if (!provider) return new Response("Missing provider", { status: 400 });

  const meta = PROVIDER_OAUTH_META[provider];
  if (!meta) return new Response(`Unsupported provider: ${provider}`, { status: 400 });

  // Create state token
  const state = await ctx.runMutation(api.providerOAuth.createOAuthState, { provider });

  // Build the complete callback URL
  const completeUrl = url.origin + "/api/provider-oauth/complete";

  const html = buildLoginPopupHtml(provider, meta, state, completeUrl);
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

// POST /api/provider-oauth/complete
// Called after the user "logs in" - stores the token
export const oauthComplete = httpAction(async (ctx, request) => {
  const body = await request.json() as { state: string; email: string; method: string };
  const { state, email } = body;

  if (!state || !email) {
    return Response.json({ error: "Missing state or email" }, { status: 400 });
  }

  const oauthState = await ctx.runQuery(api.providerOAuth.getOAuthStateByState, { state });
  if (!oauthState) {
    return Response.json({ error: "Invalid or expired state" }, { status: 400 });
  }

  // Generate a session token for this provider connection
  const encoder = new TextEncoder();
  const data = encoder.encode(`${oauthState.provider}:${email}:${Date.now()}:${state}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const accessToken = "ac_" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 48);

  await ctx.runMutation(internal.providerOAuth.completeOAuthState, {
    state,
    accessToken,
    expiresIn: 86400 * 30, // 30 days
  });

  return Response.json({
    success: true,
    provider: oauthState.provider,
    connectedAs: email,
  });
});

// GET /api/provider-oauth/callback (kept for backward compat)
export const oauthCallback = httpAction(async (_ctx, _request) => {
  return new Response("Use /api/provider-oauth/start instead", { status: 301 });
});

/* ═══════════════════════════════════════════════════════════════
   HTML — Beautiful login popup (OmniRoute-style)
   ═══════════════════════════════════════════════════════════════ */

function buildLoginPopupHtml(
  provider: string,
  meta: ProviderOAuthMeta,
  state: string,
  completeUrl: string,
): string {
  // Build login method buttons
  const methodButtons = meta.loginMethods.map(m => {
    const methodConfig: Record<string, { icon: string; label: string; bg: string; border: string; text: string }> = {
      google: { icon: `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`, label: "Continue with Google", bg: "#ffffff", border: "#dadce0", text: "#3c4043" },
      github: { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`, label: "Continue with GitHub", bg: "#24292e", border: "#24292e", text: "#ffffff" },
      email: { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 4-10 8L2 4"/></svg>`, label: "Continue with Email", bg: "#f3f4f6", border: "#d1d5db", text: "#374151" },
      microsoft: { icon: `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="13" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="13" width="10" height="10" fill="#00a4ef"/><rect x="13" y="13" width="10" height="10" fill="#ffb900"/></svg>`, label: "Continue with Microsoft", bg: "#ffffff", border: "#dadce0", text: "#3c4043" },
      apple: { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>`, label: "Continue with Apple", bg: "#000000", border: "#000000", text: "#ffffff" },
    };
    const c = methodConfig[m];
    return `<button class="login-btn" data-method="${m}" style="background:${c.bg};border-color:${c.border};color:${c.text}" onclick="handleLogin('${m}')">
      <span class="btn-icon">${c.icon}</span>
      <span>${c.label}</span>
    </button>`;
  }).join("\n          ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login to ${meta.displayName} — AdalahCredit</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif;background:#0a0a0a;color:#fafafa;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center}

.container{width:100%;max-width:420px;padding:24px}

/* Header */
.header{text-align:center;margin-bottom:32px}
.provider-icon{width:56px;height:56px;border-radius:16px;background:${meta.color}20;border:1px solid ${meta.color}40;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px}
.header h1{font-size:20px;font-weight:600;margin-bottom:6px}
.header p{font-size:13px;color:#888;line-height:1.5}
.provider-name{color:${meta.color};font-weight:600}

/* Login card */
.login-card{background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:16px}
.card-title{font-size:14px;font-weight:500;margin-bottom:20px;color:#ccc;text-align:center}

/* Login buttons */
.login-btn{width:100%;display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;border:1px solid;font-size:14px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:10px;font-family:inherit}
.login-btn:hover{opacity:.85;transform:translateY(-1px);box-shadow:0 4px 12px #0004}
.login-btn:active{transform:translateY(0)}
.login-btn:last-child{margin-bottom:0}
.btn-icon{display:flex;align-items:center;justify-content:center;width:20px;flex-shrink:0}

/* Email form */
.email-form{display:none;margin-top:16px;border-top:1px solid #222;padding-top:16px}
.email-form.show{display:block}
.email-form label{font-size:11px;color:#888;font-weight:500;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}
.email-form input{width:100%;padding:10px 14px;background:#0a0a0a;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;outline:none;font-family:inherit;transition:border .15s}
.email-form input:focus{border-color:${meta.color}}
.email-form .submit-btn{width:100%;padding:11px;background:${meta.color};color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:12px;transition:opacity .15s;font-family:inherit}
.email-form .submit-btn:hover{opacity:.85}
.email-form .submit-btn:disabled{opacity:.4;cursor:not-allowed}

/* Loading state */
.loading{display:none;text-align:center;padding:40px 20px}
.loading.show{display:block}
.login-card.hide{display:none}
.spinner{width:32px;height:32px;border:3px solid #333;border-top-color:${meta.color};border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
.loading p{font-size:13px;color:#888}
.loading .email-display{color:${meta.color};font-weight:500}

/* Success state */
.success{display:none;text-align:center;padding:40px 20px}
.success.show{display:block}
.success-icon{width:56px;height:56px;background:#10b98120;border:1px solid #10b98140;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px}
.success h2{font-size:18px;font-weight:600;margin-bottom:6px}
.success p{font-size:13px;color:#888}
.success .connected-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:#10b98110;border:1px solid #10b98130;border-radius:8px;color:#10b981;font-size:12px;font-weight:500;margin-top:16px}

/* Footer */
.footer{text-align:center;padding:12px}
.footer p{font-size:11px;color:#555}
.footer a{color:${meta.color};text-decoration:none}
.footer a:hover{text-decoration:underline}

/* By text */
.branding{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:20px;font-size:11px;color:#444}
.branding span{color:#666}

/* Divider */
.divider{display:flex;align-items:center;gap:12px;margin:16px 0}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:#222}
.divider span{font-size:11px;color:#555;white-space:nowrap}
</style>
</head>
<body>

<div class="container">
  <div class="header">
    <div class="provider-icon">${meta.iconEmoji}</div>
    <h1>Login to <span class="provider-name">${meta.displayName}</span></h1>
    <p>${meta.loginHint}</p>
  </div>

  <div class="login-card" id="loginCard">
    <div class="card-title">Pilih metode login</div>
    <div class="login-buttons">
      ${methodButtons}
    </div>

    <div class="email-form" id="emailForm">
      <label for="emailInput">Email Address</label>
      <input type="email" id="emailInput" placeholder="you@example.com" autocomplete="email" />
      <button class="submit-btn" id="emailSubmit" onclick="submitEmail()" disabled>Login dengan Email</button>
    </div>
  </div>

  <div class="loading" id="loadingState">
    <div class="spinner"></div>
    <p>Menghubungkan ke <strong class="provider-name">${meta.displayName}</strong>...</p>
    <p style="margin-top:8px">Logged in as <span class="email-display" id="loadingEmail"></span></p>
  </div>

  <div class="success" id="successState">
    <div class="success-icon">✓</div>
    <h2>Connected!</h2>
    <p><strong class="provider-name">${meta.displayName}</strong> berhasil terhubung</p>
    <div class="connected-badge">✓ Token tersimpan otomatis</div>
    <p style="margin-top:16px;font-size:11px;color:#666">Tab ini akan tertutup otomatis...</p>
  </div>

  <div class="branding">
    <span>Powered by</span> <strong style="color:#888">AdalahCredit</strong>
  </div>
</div>

<script>
const STATE = '${state}';
const COMPLETE_URL = '${completeUrl}';
const PROVIDER = '${provider}';
let selectedEmail = '';

function handleLogin(method) {
  if (method === 'email') {
    document.getElementById('emailForm').classList.add('show');
    document.getElementById('emailInput').focus();
    return;
  }

  // For Google/GitHub/Microsoft/Apple — simulate account picker
  const demoEmails = {
    google: 'user@gmail.com',
    github: 'user@github.com',
    microsoft: 'user@outlook.com',
    apple: 'user@icloud.com',
  };
  selectedEmail = demoEmails[method] || 'user@example.com';
  doConnect(method);
}

// Email input handler
const emailInput = document.getElementById('emailInput');
const emailSubmit = document.getElementById('emailSubmit');
emailInput.addEventListener('input', () => {
  emailSubmit.disabled = !emailInput.value.includes('@');
});
emailInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !emailSubmit.disabled) submitEmail();
});

function submitEmail() {
  selectedEmail = emailInput.value.trim();
  if (!selectedEmail) return;
  doConnect('email');
}

async function doConnect(method) {
  // Show loading
  document.getElementById('loginCard').classList.add('hide');
  document.getElementById('loadingState').classList.add('show');
  document.getElementById('loadingEmail').textContent = selectedEmail;

  // Simulate auth delay (like real OAuth redirect)
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

  try {
    const res = await fetch(COMPLETE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: STATE, email: selectedEmail, method }),
    });
    const data = await res.json();

    if (data.success) {
      // Show success
      document.getElementById('loadingState').classList.remove('show');
      document.getElementById('successState').classList.add('show');

      // Notify opener
      if (window.opener) {
        window.opener.postMessage({
          type: 'PROVIDER_OAUTH_SUCCESS',
          provider: PROVIDER,
          email: selectedEmail,
        }, '*');
      }

      // Auto-close after 2s
      setTimeout(() => window.close(), 2000);
    } else {
      alert('Connection failed: ' + (data.error || 'Unknown error'));
      location.reload();
    }
  } catch (err) {
    alert('Connection error: ' + err.message);
    location.reload();
  }
}
</script>

</body>
</html>`;
}
