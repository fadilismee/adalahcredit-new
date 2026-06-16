import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin, requireAdmin } from "./lib/adminGuard";
import { writeAuditLog } from "./auditLog";

/* ═══════════════════════════════════════════════════════════════
   PROVIDER QUERIES
   ═══════════════════════════════════════════════════════════════ */

/** Public: list enabled providers & models (no secrets) */
export const getPublicProviders = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("providerConfigs").collect();
    return all
      .filter((p) => p.enabled)
      .map((p) => ({
        provider: p.provider,
        displayName: p.displayName,
        models: p.models
          .filter((m) => m.enabled)
          .map((m) => ({
            modelId: m.modelId,
            displayName: m.displayName,
            inputPricePer1M: m.inputPricePer1M,
            outputPricePer1M: m.outputPricePer1M,
            maxTokens: m.maxTokens,
          })),
      }));
  },
});

/** Admin: list all providers with full config */
export const getAllProviders = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return [];
    const providers = await ctx.db.query("providerConfigs").collect();
    // Mask secrets — never send raw API keys or OAuth secrets to the client
    return providers.map((p) => ({
      ...p,
      apiKey: p.apiKey ? `${p.apiKey.slice(0, 6)}...${p.apiKey.slice(-4)}` : undefined,
      oauthClientSecret: p.oauthClientSecret ? "••••••••" : undefined,
    }));
  },
});

/** Admin: get single provider config */
export const getProvider = query({
  args: { provider: v.string() },
  handler: async (ctx, { provider }) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return null;
    const p = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .unique();
    if (!p) return null;
    // Mask secrets
    return {
      ...p,
      apiKey: p.apiKey ? `${p.apiKey.slice(0, 6)}...${p.apiKey.slice(-4)}` : undefined,
      oauthClientSecret: p.oauthClientSecret ? "••••••••" : undefined,
    };
  },
});

/* ═══════════════════════════════════════════════════════════════
   PROVIDER MUTATIONS
   ═══════════════════════════════════════════════════════════════ */

export const upsertProvider = mutation({
  args: {
    provider: v.string(),
    displayName: v.string(),
    enabled: v.boolean(),
    authType: v.union(
      v.literal("api_key"),
      v.literal("oauth"),
      v.literal("cookie"),
      v.literal("free"),
      v.literal("device_code"),
      v.literal("service_account")
    ),
    tier: v.optional(v.union(
      v.literal("subscription"),
      v.literal("api_key"),
      v.literal("cheap"),
      v.literal("free")
    )),
    apiKey: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    orgId: v.optional(v.string()),
    projectId: v.optional(v.string()),
    // OAuth fields
    oauthClientId: v.optional(v.string()),
    oauthClientSecret: v.optional(v.string()),
    oauthAuthUrl: v.optional(v.string()),
    oauthTokenUrl: v.optional(v.string()),
    oauthScopes: v.optional(v.array(v.string())),
    oauthAccessToken: v.optional(v.string()),
    oauthRefreshToken: v.optional(v.string()),
    oauthExpiresAt: v.optional(v.number()),
    // Cookie fields
    sessionCookie: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    cookieExpiresAt: v.optional(v.number()),
    // Quota fields
    quotaLimit: v.optional(v.number()),
    quotaUsed: v.optional(v.number()),
    quotaResetAt: v.optional(v.number()),
    quotaType: v.optional(v.union(
      v.literal("requests_per_minute"),
      v.literal("requests_per_day"),
      v.literal("tokens_per_month"),
      v.literal("requests_per_5h"),
      v.literal("unlimited")
    )),
    fallbackPriority: v.optional(v.number()),
    models: v.array(v.object({
      modelId: v.string(),
      displayName: v.string(),
      enabled: v.boolean(),
      inputPricePer1M: v.number(),
      outputPricePer1M: v.number(),
      sellInputPer1M: v.optional(v.number()),
      sellOutputPer1M: v.optional(v.number()),
      maxTokens: v.number(),
      rateLimit: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const existing = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .unique();

    // Default tier based on authType
    const tier = args.tier || (
      args.authType === "oauth" || args.authType === "device_code" ? "subscription" :
      args.authType === "cookie" ? "subscription" :
      args.authType === "free" ? "free" :
      "api_key"
    );

    const data = { ...args, tier, updatedAt: now };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("providerConfigs", { ...data, createdAt: now });
    }

    return { success: true };
  },
});

export const deleteProvider = mutation({
  args: { provider: v.string() },
  handler: async (ctx, { provider }) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

/* Set API key (or OAuth token, cookie, etc.) for a provider and optionally enable it */
export const setProviderCredentials = mutation({
  args: {
    provider: v.string(),
    apiKey: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    orgId: v.optional(v.string()),
    oauthAccessToken: v.optional(v.string()),
    oauthRefreshToken: v.optional(v.string()),
    sessionCookie: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    autoEnable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .unique();

    if (!existing) throw new Error("Provider not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.apiKey !== undefined) patch.apiKey = args.apiKey;
    if (args.apiSecret !== undefined) patch.apiSecret = args.apiSecret;
    if (args.baseUrl !== undefined) patch.baseUrl = args.baseUrl;
    if (args.orgId !== undefined) patch.orgId = args.orgId;
    if (args.oauthAccessToken !== undefined) patch.oauthAccessToken = args.oauthAccessToken;
    if (args.oauthRefreshToken !== undefined) patch.oauthRefreshToken = args.oauthRefreshToken;
    if (args.sessionCookie !== undefined) patch.sessionCookie = args.sessionCookie;
    if (args.sessionToken !== undefined) patch.sessionToken = args.sessionToken;
    if (args.autoEnable) patch.enabled = true;

    await ctx.db.patch(existing._id, patch);

    await writeAuditLog(ctx, {
      actorId: adminUserId,
      action: "provider.credentials_updated",
      resource: "providerConfigs",
      resourceId: existing._id,
      details: JSON.stringify({ provider: args.provider, hasApiKey: !!args.apiKey, autoEnabled: !!args.autoEnable }),
    });

    return { success: true };
  },
});

export const toggleProvider = mutation({
  args: { provider: v.string(), enabled: v.boolean() },
  handler: async (ctx, { provider, enabled }) => {
    const adminUserId = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .unique();

    if (!existing) throw new Error("Provider not found");

    await ctx.db.patch(existing._id, { enabled, updatedAt: Date.now() });

    await writeAuditLog(ctx, {
      actorId: adminUserId,
      action: enabled ? "provider.enabled" : "provider.disabled",
      resource: "providerConfigs",
      resourceId: existing._id,
      details: JSON.stringify({ provider }),
    });

    return { success: true };
  },
});

export const toggleModel = mutation({
  args: { provider: v.string(), modelId: v.string(), enabled: v.boolean() },
  handler: async (ctx, { provider, modelId, enabled }) => {
    await requireAdmin(ctx);

    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .unique();

    if (!config) throw new Error("Provider not found");

    const updatedModels = config.models.map((m) =>
      m.modelId === modelId ? { ...m, enabled } : m
    );

    await ctx.db.patch(config._id, { models: updatedModels, updatedAt: Date.now() });
    return { success: true };
  },
});

/* ═══════════════════════════════════════════════════════════════
   SEED DEFAULT PROVIDERS
   ═══════════════════════════════════════════════════════════════ */

export const seedDefaultProviders = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("providerConfigs").first();
    if (existing) return { message: "Already seeded" };

    const now = Date.now();

    const providers = [
      /* ═══════════════ TIER: API KEY (Standard) ═══════════════ */
      {
        provider: "openai", displayName: "OpenAI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.openai.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "gpt-4o", displayName: "GPT-4o", enabled: true, inputPricePer1M: 2.50, outputPricePer1M: 10.0, maxTokens: 128000, rateLimit: 10000 },
          { modelId: "gpt-4o-mini", displayName: "GPT-4o Mini", enabled: true, inputPricePer1M: 0.15, outputPricePer1M: 0.60, maxTokens: 128000, rateLimit: 30000 },
          { modelId: "gpt-4.1", displayName: "GPT-4.1", enabled: true, inputPricePer1M: 2.00, outputPricePer1M: 8.00, maxTokens: 1048576, rateLimit: 10000 },
          { modelId: "gpt-4.1-mini", displayName: "GPT-4.1 Mini", enabled: true, inputPricePer1M: 0.40, outputPricePer1M: 1.60, maxTokens: 1048576, rateLimit: 30000 },
          { modelId: "gpt-4.1-nano", displayName: "GPT-4.1 Nano", enabled: true, inputPricePer1M: 0.10, outputPricePer1M: 0.40, maxTokens: 1048576, rateLimit: 50000 },
          { modelId: "o3", displayName: "o3", enabled: true, inputPricePer1M: 10.0, outputPricePer1M: 40.0, maxTokens: 200000, rateLimit: 2000 },
          { modelId: "o3-mini", displayName: "o3-mini", enabled: true, inputPricePer1M: 1.10, outputPricePer1M: 4.40, maxTokens: 200000, rateLimit: 10000 },
          { modelId: "o4-mini", displayName: "o4-mini", enabled: true, inputPricePer1M: 1.10, outputPricePer1M: 4.40, maxTokens: 200000, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "anthropic", displayName: "Anthropic", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.anthropic.com/v1", fallbackPriority: 20,
        models: [
          { modelId: "claude-opus-4", displayName: "Claude Opus 4", enabled: true, inputPricePer1M: 15.0, outputPricePer1M: 75.0, maxTokens: 200000, rateLimit: 2000 },
          { modelId: "claude-sonnet-4", displayName: "Claude Sonnet 4", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 15.0, maxTokens: 200000, rateLimit: 8000 },
          { modelId: "claude-3.5-haiku", displayName: "Claude 3.5 Haiku", enabled: true, inputPricePer1M: 0.80, outputPricePer1M: 4.0, maxTokens: 200000, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "google", displayName: "Google AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://generativelanguage.googleapis.com/v1beta", fallbackPriority: 20,
        models: [
          { modelId: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro", enabled: true, inputPricePer1M: 1.25, outputPricePer1M: 10.0, maxTokens: 1048576, rateLimit: 10000 },
          { modelId: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", enabled: true, inputPricePer1M: 0.15, outputPricePer1M: 0.60, maxTokens: 1048576, rateLimit: 30000 },
          { modelId: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash", enabled: true, inputPricePer1M: 0.10, outputPricePer1M: 0.40, maxTokens: 1048576, rateLimit: 30000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "mistral", displayName: "Mistral AI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.mistral.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "mistral-large", displayName: "Mistral Large", enabled: true, inputPricePer1M: 2.0, outputPricePer1M: 6.0, maxTokens: 128000, rateLimit: 8000 },
          { modelId: "codestral", displayName: "Codestral", enabled: true, inputPricePer1M: 0.30, outputPricePer1M: 0.90, maxTokens: 256000, rateLimit: 12000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "xai", displayName: "xAI", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.x.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "grok-3", displayName: "Grok-3", enabled: true, inputPricePer1M: 3.0, outputPricePer1M: 15.0, maxTokens: 131072, rateLimit: 5000 },
          { modelId: "grok-3-mini", displayName: "Grok-3 Mini", enabled: true, inputPricePer1M: 0.30, outputPricePer1M: 0.50, maxTokens: 131072, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cohere", displayName: "Cohere", enabled: false,
        authType: "api_key" as const, tier: "api_key" as const,
        baseUrl: "https://api.cohere.ai/v1", fallbackPriority: 20,
        models: [
          { modelId: "command-r-plus", displayName: "Command R+", enabled: true, inputPricePer1M: 2.50, outputPricePer1M: 10.0, maxTokens: 128000, rateLimit: 5000 },
          { modelId: "command-r", displayName: "Command R", enabled: true, inputPricePer1M: 0.15, outputPricePer1M: 0.60, maxTokens: 128000, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },

      /* ═══════════════ TIER: SUBSCRIPTION (OAuth) ═══════════════ */
      {
        provider: "claude-code", displayName: "Claude Code (Pro)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api.anthropic.com/v1", fallbackPriority: 10,
        oauthAuthUrl: "https://console.anthropic.com/oauth/authorize",
        oauthTokenUrl: "https://console.anthropic.com/oauth/token",
        oauthScopes: ["claude-code:read", "claude-code:write"],
        quotaType: "requests_per_5h" as const, quotaLimit: 200, quotaUsed: 0,
        models: [
          { modelId: "cc/claude-opus-4", displayName: "Claude Opus 4 (Code)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
          { modelId: "cc/claude-sonnet-4", displayName: "Claude Sonnet 4 (Code)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 120 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "codex", displayName: "OpenAI Codex (Plus/Pro)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api.openai.com/v1", fallbackPriority: 10,
        oauthAuthUrl: "https://auth.openai.com/authorize",
        oauthTokenUrl: "https://auth.openai.com/oauth/token",
        oauthScopes: ["codex:read", "codex:write"],
        quotaType: "requests_per_5h" as const, quotaLimit: 200, quotaUsed: 0,
        models: [
          { modelId: "cx/gpt-4o", displayName: "GPT-4o (Codex)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 60 },
          { modelId: "cx/o4-mini", displayName: "o4-mini (Codex)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "gemini-cli", displayName: "Gemini CLI (FREE)", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://generativelanguage.googleapis.com/v1beta", fallbackPriority: 10,
        oauthAuthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        oauthTokenUrl: "https://oauth2.googleapis.com/token",
        oauthScopes: ["https://www.googleapis.com/auth/generative-language"],
        quotaType: "requests_per_day" as const, quotaLimit: 1000, quotaUsed: 0,
        models: [
          { modelId: "gc/gemini-2.5-pro", displayName: "Gemini 2.5 Pro (CLI)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 1048576, rateLimit: 15 },
          { modelId: "gc/gemini-2.5-flash", displayName: "Gemini 2.5 Flash (CLI)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 1048576, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "github-copilot", displayName: "GitHub Copilot", enabled: false,
        authType: "oauth" as const, tier: "subscription" as const,
        baseUrl: "https://api.githubcopilot.com", fallbackPriority: 10,
        oauthAuthUrl: "https://github.com/login/oauth/authorize",
        oauthTokenUrl: "https://github.com/login/oauth/access_token",
        oauthScopes: ["copilot"],
        quotaType: "tokens_per_month" as const, quotaLimit: 500000, quotaUsed: 0,
        models: [
          { modelId: "gh/gpt-4o", displayName: "GPT-4o (Copilot)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 60 },
          { modelId: "gh/claude-sonnet-4", displayName: "Claude Sonnet 4 (Copilot)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "kiro", displayName: "Kiro (FREE Claude)", enabled: false,
        authType: "oauth" as const, tier: "free" as const,
        baseUrl: "https://api.kiro.dev/v1", fallbackPriority: 40,
        oauthAuthUrl: "https://kiro.dev/oauth/authorize",
        oauthTokenUrl: "https://kiro.dev/oauth/token",
        oauthScopes: ["chat"],
        quotaType: "unlimited" as const,
        models: [
          { modelId: "kr/claude-sonnet-4", displayName: "Claude Sonnet 4 (Kiro)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
          { modelId: "kr/claude-haiku-4", displayName: "Claude Haiku 4 (Kiro)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 120 },
        ],
        createdAt: now, updatedAt: now,
      },

      /* ═══════════════ TIER: SUBSCRIPTION (Cookie) ═══════════════ */
      {
        provider: "chatgpt-web", displayName: "ChatGPT Plus (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://chatgpt.com/backend-api", fallbackPriority: 10,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/gpt-4o", displayName: "GPT-4o (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 80 },
          { modelId: "web/o4-mini", displayName: "o4-mini (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 40 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "grok-web", displayName: "Grok (Cookie)", enabled: false,
        authType: "cookie" as const, tier: "subscription" as const,
        baseUrl: "https://grok.x.ai/api", fallbackPriority: 10,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "web/grok-3", displayName: "Grok-3 (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },

      /* ═══════════════ TIER: CHEAP ═══════════════ */
      {
        provider: "deepseek", displayName: "DeepSeek", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.deepseek.com/v1", fallbackPriority: 30,
        models: [
          { modelId: "deepseek-r1", displayName: "DeepSeek R1", enabled: true, inputPricePer1M: 0.55, outputPricePer1M: 2.19, maxTokens: 128000, rateLimit: 10000 },
          { modelId: "deepseek-v3", displayName: "DeepSeek V3", enabled: true, inputPricePer1M: 0.27, outputPricePer1M: 1.10, maxTokens: 128000, rateLimit: 15000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "groq", displayName: "Groq", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.groq.com/openai/v1", fallbackPriority: 30,
        models: [
          { modelId: "groq/llama-4-maverick", displayName: "Llama 4 Maverick (Groq)", enabled: true, inputPricePer1M: 0.20, outputPricePer1M: 0.60, maxTokens: 131072, rateLimit: 30 },
          { modelId: "groq/llama-4-scout", displayName: "Llama 4 Scout (Groq)", enabled: true, inputPricePer1M: 0.10, outputPricePer1M: 0.30, maxTokens: 131072, rateLimit: 30 },
          { modelId: "groq/gemma2-9b", displayName: "Gemma 2 9B (Groq)", enabled: true, inputPricePer1M: 0.20, outputPricePer1M: 0.20, maxTokens: 8192, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "together", displayName: "Together AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.together.xyz/v1", fallbackPriority: 30,
        models: [
          { modelId: "llama-4-maverick", displayName: "Llama 4 Maverick", enabled: true, inputPricePer1M: 0.20, outputPricePer1M: 0.60, maxTokens: 1048576, rateLimit: 15000 },
          { modelId: "llama-4-scout", displayName: "Llama 4 Scout", enabled: true, inputPricePer1M: 0.10, outputPricePer1M: 0.30, maxTokens: 512000, rateLimit: 20000 },
          { modelId: "together/qwen-2.5-72b", displayName: "Qwen 2.5 72B", enabled: true, inputPricePer1M: 0.60, outputPricePer1M: 0.60, maxTokens: 131072, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "fireworks", displayName: "Fireworks AI", enabled: false,
        authType: "api_key" as const, tier: "cheap" as const,
        baseUrl: "https://api.fireworks.ai/inference/v1", fallbackPriority: 30,
        models: [
          { modelId: "fw/llama-4-maverick", displayName: "Llama 4 Maverick (FW)", enabled: true, inputPricePer1M: 0.20, outputPricePer1M: 0.60, maxTokens: 131072, rateLimit: 10000 },
          { modelId: "fw/qwen-2.5-72b", displayName: "Qwen 2.5 72B (FW)", enabled: true, inputPricePer1M: 0.90, outputPricePer1M: 0.90, maxTokens: 32768, rateLimit: 10000 },
        ],
        createdAt: now, updatedAt: now,
      },

      /* ═══════════════ TIER: FREE ═══════════════ */
      {
        provider: "pollinations", displayName: "Pollinations (FREE)", enabled: false,
        authType: "free" as const, tier: "free" as const,
        baseUrl: "https://text.pollinations.ai/openai", fallbackPriority: 40,
        quotaType: "unlimited" as const,
        models: [
          { modelId: "pol/openai", displayName: "OpenAI (Pollinations)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
          { modelId: "pol/claude", displayName: "Claude (Pollinations)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 30 },
          { modelId: "pol/mistral", displayName: "Mistral (Pollinations)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cloudflare", displayName: "Cloudflare Workers AI (FREE)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1", fallbackPriority: 40,
        quotaType: "requests_per_day" as const, quotaLimit: 10000, quotaUsed: 0,
        models: [
          { modelId: "cf/llama-3.3-70b", displayName: "Llama 3.3 70B (CF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 300 },
          { modelId: "cf/qwen-2.5-72b", displayName: "Qwen 2.5 72B (CF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 300 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "huggingface", displayName: "HuggingFace Inference (FREE)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api-inference.huggingface.co/v1", fallbackPriority: 40,
        quotaType: "requests_per_day" as const, quotaLimit: 1000, quotaUsed: 0,
        models: [
          { modelId: "hf/qwen-2.5-72b", displayName: "Qwen 2.5 72B (HF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 30 },
          { modelId: "hf/llama-3.3-70b", displayName: "Llama 3.3 70B (HF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
          { modelId: "hf/mistral-nemo", displayName: "Mistral Nemo (HF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "cerebras", displayName: "Cerebras (FREE Tier)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://api.cerebras.ai/v1", fallbackPriority: 40,
        quotaType: "requests_per_minute" as const, quotaLimit: 30, quotaUsed: 0,
        models: [
          { modelId: "cb/llama-3.3-70b", displayName: "Llama 3.3 70B (Cerebras)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
          { modelId: "cb/llama-4-scout", displayName: "Llama 4 Scout (Cerebras)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        provider: "nvidia", displayName: "NVIDIA NIM (Free Credits)", enabled: false,
        authType: "api_key" as const, tier: "free" as const,
        baseUrl: "https://integrate.api.nvidia.com/v1", fallbackPriority: 40,
        quotaType: "tokens_per_month" as const, quotaLimit: 5000000, quotaUsed: 0,
        models: [
          { modelId: "nv/llama-3.3-70b", displayName: "Llama 3.3 70B (NVIDIA)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 60 },
          { modelId: "nv/mistral-large", displayName: "Mistral Large (NVIDIA)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 60 },
        ],
        createdAt: now, updatedAt: now,
      },
    ];

    for (const p of providers) {
      await ctx.db.insert("providerConfigs", p);
    }

    return { message: `Seeded ${providers.length} providers (4 tiers: subscription/api_key/cheap/free)` };
  },
});

/** Seed new Phase 1 providers (won't duplicate existing) */
export const seedPhase1Providers = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    let added = 0;

    const newProviders = [
      "claude-code", "codex", "gemini-cli", "github-copilot", "kiro",
      "chatgpt-web", "grok-web",
      "groq", "together", "fireworks",
      "pollinations", "cloudflare", "huggingface", "cerebras", "nvidia",
    ];

    for (const name of newProviders) {
      const exists = await ctx.db
        .query("providerConfigs")
        .withIndex("by_provider", (q) => q.eq("provider", name))
        .unique();
      if (exists) continue;

      // Add provider based on name
      const config = getPhase1ProviderConfig(name, now);
      if (config) {
        await ctx.db.insert("providerConfigs", config);
        added++;
      }
    }

    // Update existing providers to have tier field
    const allProviders = await ctx.db.query("providerConfigs").collect();
    for (const p of allProviders) {
      if (!p.tier) {
        const tier = p.authType === "oauth" || p.authType === "cookie" || p.authType === "device_code"
          ? "subscription" as const
          : p.authType === "free"
          ? "free" as const
          : "api_key" as const;
        await ctx.db.patch(p._id, { tier, fallbackPriority: p.fallbackPriority ?? tierToNum(tier) });
      }
    }

    return { message: `Added ${added} new providers` };
  },
});

function tierToNum(tier: string): number {
  return tier === "subscription" ? 10 : tier === "api_key" ? 20 : tier === "cheap" ? 30 : 40;
}

function getPhase1ProviderConfig(name: string, now: number) {
  const configs: Record<string, any> = {
    "claude-code": {
      provider: "claude-code", displayName: "Claude Code (Pro)", enabled: false,
      authType: "oauth", tier: "subscription", baseUrl: "https://api.anthropic.com/v1", fallbackPriority: 10,
      oauthAuthUrl: "https://console.anthropic.com/oauth/authorize",
      oauthTokenUrl: "https://console.anthropic.com/oauth/token",
      quotaType: "requests_per_5h", quotaLimit: 200, quotaUsed: 0,
      models: [
        { modelId: "cc/claude-opus-4", displayName: "Claude Opus 4 (Code)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
        { modelId: "cc/claude-sonnet-4", displayName: "Claude Sonnet 4 (Code)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 120 },
      ],
      createdAt: now, updatedAt: now,
    },
    "codex": {
      provider: "codex", displayName: "OpenAI Codex (Plus/Pro)", enabled: false,
      authType: "oauth", tier: "subscription", baseUrl: "https://api.openai.com/v1", fallbackPriority: 10,
      oauthAuthUrl: "https://auth.openai.com/authorize",
      oauthTokenUrl: "https://auth.openai.com/oauth/token",
      quotaType: "requests_per_5h", quotaLimit: 200, quotaUsed: 0,
      models: [
        { modelId: "cx/gpt-4o", displayName: "GPT-4o (Codex)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 60 },
        { modelId: "cx/o4-mini", displayName: "o4-mini (Codex)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
      ],
      createdAt: now, updatedAt: now,
    },
    "gemini-cli": {
      provider: "gemini-cli", displayName: "Gemini CLI (FREE)", enabled: false,
      authType: "oauth", tier: "subscription", baseUrl: "https://generativelanguage.googleapis.com/v1beta", fallbackPriority: 10,
      oauthAuthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      oauthTokenUrl: "https://oauth2.googleapis.com/token",
      quotaType: "requests_per_day", quotaLimit: 1000, quotaUsed: 0,
      models: [
        { modelId: "gc/gemini-2.5-pro", displayName: "Gemini 2.5 Pro (CLI)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 1048576, rateLimit: 15 },
        { modelId: "gc/gemini-2.5-flash", displayName: "Gemini 2.5 Flash (CLI)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 1048576, rateLimit: 30 },
      ],
      createdAt: now, updatedAt: now,
    },
    "github-copilot": {
      provider: "github-copilot", displayName: "GitHub Copilot", enabled: false,
      authType: "oauth", tier: "subscription", baseUrl: "https://api.githubcopilot.com", fallbackPriority: 10,
      oauthAuthUrl: "https://github.com/login/oauth/authorize",
      oauthTokenUrl: "https://github.com/login/oauth/access_token",
      quotaType: "tokens_per_month", quotaLimit: 500000, quotaUsed: 0,
      models: [
        { modelId: "gh/gpt-4o", displayName: "GPT-4o (Copilot)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 60 },
        { modelId: "gh/claude-sonnet-4", displayName: "Claude Sonnet 4 (Copilot)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
      ],
      createdAt: now, updatedAt: now,
    },
    "kiro": {
      provider: "kiro", displayName: "Kiro (FREE Claude)", enabled: false,
      authType: "oauth", tier: "free", baseUrl: "https://api.kiro.dev/v1", fallbackPriority: 40,
      oauthAuthUrl: "https://kiro.dev/oauth/authorize",
      oauthTokenUrl: "https://kiro.dev/oauth/token",
      quotaType: "unlimited",
      models: [
        { modelId: "kr/claude-sonnet-4", displayName: "Claude Sonnet 4 (Kiro)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 60 },
        { modelId: "kr/claude-haiku-4", displayName: "Claude Haiku 4 (Kiro)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 120 },
      ],
      createdAt: now, updatedAt: now,
    },
    "chatgpt-web": {
      provider: "chatgpt-web", displayName: "ChatGPT Plus (Cookie)", enabled: false,
      authType: "cookie", tier: "subscription", baseUrl: "https://chatgpt.com/backend-api", fallbackPriority: 10,
      quotaType: "unlimited",
      models: [
        { modelId: "web/gpt-4o", displayName: "GPT-4o (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 80 },
        { modelId: "web/o4-mini", displayName: "o4-mini (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 40 },
      ],
      createdAt: now, updatedAt: now,
    },
    "grok-web": {
      provider: "grok-web", displayName: "Grok (Cookie)", enabled: false,
      authType: "cookie", tier: "subscription", baseUrl: "https://grok.x.ai/api", fallbackPriority: 10,
      quotaType: "unlimited",
      models: [
        { modelId: "web/grok-3", displayName: "Grok-3 (Web)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
      ],
      createdAt: now, updatedAt: now,
    },
    "groq": {
      provider: "groq", displayName: "Groq", enabled: false,
      authType: "api_key", tier: "cheap", baseUrl: "https://api.groq.com/openai/v1", fallbackPriority: 30,
      models: [
        { modelId: "groq/llama-4-maverick", displayName: "Llama 4 Maverick (Groq)", enabled: true, inputPricePer1M: 0.20, outputPricePer1M: 0.60, maxTokens: 131072, rateLimit: 30 },
        { modelId: "groq/llama-4-scout", displayName: "Llama 4 Scout (Groq)", enabled: true, inputPricePer1M: 0.10, outputPricePer1M: 0.30, maxTokens: 131072, rateLimit: 30 },
        { modelId: "groq/gemma2-9b", displayName: "Gemma 2 9B (Groq)", enabled: true, inputPricePer1M: 0.20, outputPricePer1M: 0.20, maxTokens: 8192, rateLimit: 30 },
      ],
      createdAt: now, updatedAt: now,
    },
    "together": {
      provider: "together", displayName: "Together AI", enabled: false,
      authType: "api_key", tier: "cheap", baseUrl: "https://api.together.xyz/v1", fallbackPriority: 30,
      models: [
        { modelId: "together/qwen-2.5-72b", displayName: "Qwen 2.5 72B", enabled: true, inputPricePer1M: 0.60, outputPricePer1M: 0.60, maxTokens: 131072, rateLimit: 10000 },
      ],
      createdAt: now, updatedAt: now,
    },
    "fireworks": {
      provider: "fireworks", displayName: "Fireworks AI", enabled: false,
      authType: "api_key", tier: "cheap", baseUrl: "https://api.fireworks.ai/inference/v1", fallbackPriority: 30,
      models: [
        { modelId: "fw/llama-4-maverick", displayName: "Llama 4 Maverick (FW)", enabled: true, inputPricePer1M: 0.20, outputPricePer1M: 0.60, maxTokens: 131072, rateLimit: 10000 },
        { modelId: "fw/qwen-2.5-72b", displayName: "Qwen 2.5 72B (FW)", enabled: true, inputPricePer1M: 0.90, outputPricePer1M: 0.90, maxTokens: 32768, rateLimit: 10000 },
      ],
      createdAt: now, updatedAt: now,
    },
    "pollinations": {
      provider: "pollinations", displayName: "Pollinations (FREE)", enabled: false,
      authType: "free", tier: "free", baseUrl: "https://text.pollinations.ai/openai", fallbackPriority: 40,
      quotaType: "unlimited",
      models: [
        { modelId: "pol/openai", displayName: "OpenAI (Pollinations)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
        { modelId: "pol/claude", displayName: "Claude (Pollinations)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 200000, rateLimit: 30 },
        { modelId: "pol/mistral", displayName: "Mistral (Pollinations)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
      ],
      createdAt: now, updatedAt: now,
    },
    "cloudflare": {
      provider: "cloudflare", displayName: "Cloudflare Workers AI (FREE)", enabled: false,
      authType: "api_key", tier: "free", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1", fallbackPriority: 40,
      quotaType: "requests_per_day", quotaLimit: 10000, quotaUsed: 0,
      models: [
        { modelId: "cf/llama-3.3-70b", displayName: "Llama 3.3 70B (CF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 300 },
        { modelId: "cf/qwen-2.5-72b", displayName: "Qwen 2.5 72B (CF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 300 },
      ],
      createdAt: now, updatedAt: now,
    },
    "huggingface": {
      provider: "huggingface", displayName: "HuggingFace Inference (FREE)", enabled: false,
      authType: "api_key", tier: "free", baseUrl: "https://api-inference.huggingface.co/v1", fallbackPriority: 40,
      quotaType: "requests_per_day", quotaLimit: 1000, quotaUsed: 0,
      models: [
        { modelId: "hf/qwen-2.5-72b", displayName: "Qwen 2.5 72B (HF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 32768, rateLimit: 30 },
        { modelId: "hf/llama-3.3-70b", displayName: "Llama 3.3 70B (HF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        { modelId: "hf/mistral-nemo", displayName: "Mistral Nemo (HF)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 30 },
      ],
      createdAt: now, updatedAt: now,
    },
    "cerebras": {
      provider: "cerebras", displayName: "Cerebras (FREE Tier)", enabled: false,
      authType: "api_key", tier: "free", baseUrl: "https://api.cerebras.ai/v1", fallbackPriority: 40,
      quotaType: "requests_per_minute", quotaLimit: 30, quotaUsed: 0,
      models: [
        { modelId: "cb/llama-3.3-70b", displayName: "Llama 3.3 70B (Cerebras)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
        { modelId: "cb/llama-4-scout", displayName: "Llama 4 Scout (Cerebras)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 30 },
      ],
      createdAt: now, updatedAt: now,
    },
    "nvidia": {
      provider: "nvidia", displayName: "NVIDIA NIM (Free Credits)", enabled: false,
      authType: "api_key", tier: "free", baseUrl: "https://integrate.api.nvidia.com/v1", fallbackPriority: 40,
      quotaType: "tokens_per_month", quotaLimit: 5000000, quotaUsed: 0,
      models: [
        { modelId: "nv/llama-3.3-70b", displayName: "Llama 3.3 70B (NVIDIA)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 131072, rateLimit: 60 },
        { modelId: "nv/mistral-large", displayName: "Mistral Large (NVIDIA)", enabled: true, inputPricePer1M: 0, outputPricePer1M: 0, maxTokens: 128000, rateLimit: 60 },
      ],
      createdAt: now, updatedAt: now,
    },
  };

  return configs[name] || null;
}
