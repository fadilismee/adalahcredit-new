import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/* ═══════════════════════════════════════════════════════════════
   INTERNAL FUNCTIONS — called by proxy httpActions
   ═══════════════════════════════════════════════════════════════ */

/**
 * Hash a key using SHA-256 (Web Crypto).
 * Falls back to simple hash for legacy keys.
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Legacy hash for backward compat */
function legacyHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate an API key by computing its hash and looking it up.
 * Tries SHA-256 first, falls back to legacy hash for old keys.
 */
export const validateApiKey = internalQuery({
  args: { rawKey: v.string() },
  handler: async (ctx, { rawKey }) => {
    // Try SHA-256 hash first
    const sha256Hash = await sha256(rawKey);
    let key = await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", sha256Hash))
      .first();

    // Fallback to legacy hash
    if (!key) {
      const legHash = legacyHash(rawKey);
      key = await ctx.db
        .query("apiKeys")
        .withIndex("by_keyHash", (q) => q.eq("keyHash", legHash))
        .first();
    }

    if (!key) return null;

    // Check if key is expired
    if (key.expiresAt && key.expiresAt < Date.now()) {
      return { keyId: key._id, userId: key.userId, status: "expired" as const, rateLimit: key.rateLimit, allowedModels: key.allowedModels, allowedIPs: key.allowedIPs };
    }

    // Plan-based rate limit defaults (RPM)
    const PLAN_RATE_LIMITS: Record<string, number> = { free: 20, starter: 60, pro: 300, enterprise: 1000 };
    let effectiveRateLimit = key.rateLimit;
    if (effectiveRateLimit <= 0) {
      // Look up user's subscription plan to determine default
      const sub = await ctx.db.query("subscriptions").withIndex("by_userId", (q) => q.eq("userId", key.userId)).first();
      effectiveRateLimit = PLAN_RATE_LIMITS[sub?.plan ?? "free"] ?? 20;
    }

    return {
      keyId: key._id,
      userId: key.userId,
      status: key.status,
      rateLimit: effectiveRateLimit,
      allowedModels: key.allowedModels,
      allowedIPs: key.allowedIPs,
    };
  },
});

/**
 * Check if user has enough credits.
 */
/** Spending alert thresholds (% of monthly credits used) */
const SPENDING_ALERT_LEVELS = [
  { level: "warning" as const, threshold: 0.5, label: "50% of credits used" },
  { level: "critical" as const, threshold: 0.8, label: "80% of credits used" },
  { level: "exhausted" as const, threshold: 0.95, label: "95% of credits used" },
];

export const checkCredits = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!sub) return { hasCredits: false, remaining: 0, balance: 0, usagePercent: 100, alertLevel: "exhausted" as const, alertLabel: "No subscription" };

    const remaining = sub.monthlyCredits - sub.usedCredits;
    const balance = sub.balance ?? 0;
    const totalAvailable = Math.max(0, remaining) + balance;
    const usagePercent = sub.monthlyCredits > 0 ? sub.usedCredits / sub.monthlyCredits : 0;

    // Determine alert level
    let alertLevel: "none" | "warning" | "critical" | "exhausted" = "none";
    let alertLabel = "";
    for (const alert of SPENDING_ALERT_LEVELS) {
      if (usagePercent >= alert.threshold) {
        alertLevel = alert.level;
        alertLabel = alert.label;
      }
    }

    return {
      hasCredits: totalAvailable > 0,
      remaining: Math.max(0, remaining),
      balance,
      totalAvailable,
      usagePercent: Math.round(usagePercent * 100),
      alertLevel,
      alertLabel,
    };
  },
});

/**
 * Check rate limit — count recent requests for this key.
 * Returns { allowed: boolean, current: number, limit: number }
 */
export const checkRateLimit = internalQuery({
  args: { apiKeyId: v.id("apiKeys"), rateLimit: v.number() },
  handler: async (ctx, { apiKeyId, rateLimit }) => {
    if (rateLimit <= 0) return { allowed: true, current: 0, limit: rateLimit };

    const oneMinuteAgo = Date.now() - 60_000;
    const recentLogs = await ctx.db
      .query("usageLogs")
      .withIndex("by_apiKeyId", (q) => q.eq("apiKeyId", apiKeyId))
      .order("desc")
      .collect();

    const countInWindow = recentLogs.filter((l) => l.createdAt > oneMinuteAgo).length;

    return {
      allowed: countInWindow < rateLimit,
      current: countInWindow,
      limit: rateLimit,
    };
  },
});

/**
 * Get provider API key and config for proxying.
 */
export const getProviderKey = internalQuery({
  args: { provider: v.string() },
  handler: async (ctx, { provider }) => {
    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .first();

    if (!config || !config.enabled) return null;

    // Load balancing: round-robin across multiple keys if available
    let selectedKey = config.apiKey || null;
    if (config.apiKeys && config.apiKeys.length > 0) {
      // Simple round-robin based on current second
      const idx = Math.floor(Date.now() / 1000) % config.apiKeys.length;
      selectedKey = config.apiKeys[idx];
    }

    return {
      apiKey: selectedKey,
      baseUrl: config.baseUrl || null,
      orgId: config.orgId || null,
    };
  },
});

/**
 * Get model cost info for usage calculation.
 */
export const getModelCost = internalQuery({
  args: { provider: v.string(), modelId: v.string() },
  handler: async (ctx, { provider, modelId }) => {
    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .first();

    if (!config) return null;

    const model = config.models.find((m) => m.modelId === modelId);
    if (!model) return null;

    return {
      inputPricePer1M: model.inputPricePer1M,
      outputPricePer1M: model.outputPricePer1M,
    };
  },
});

/**
 * Log a proxy request and update usage.
 */
export const logRequest = internalMutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    latencyMs: v.number(),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("rate_limited")),
    errorMessage: v.optional(v.string()),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.apiKeyId);
    if (!key) return;

    // Insert usage log
    await ctx.db.insert("usageLogs", {
      userId: key.userId,
      apiKeyId: args.apiKeyId,
      model: args.model,
      provider: args.provider,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      latencyMs: args.latencyMs,
      status: args.status,
      errorMessage: args.errorMessage,
      cost: args.cost,
      createdAt: Date.now(),
    });

    // Update last used on key
    await ctx.db.patch(args.apiKeyId, { lastUsedAt: Date.now() });

    // Deduct credits from subscription (plan credits first, then PAYG balance)
    if (args.cost > 0) {
      const sub = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", key.userId))
        .first();
      if (sub) {
        const remaining = sub.monthlyCredits - sub.usedCredits;
        if (remaining >= args.cost) {
          // Deduct entirely from plan credits
          await ctx.db.patch(sub._id, {
            usedCredits: sub.usedCredits + args.cost,
          });
        } else {
          // Use remaining plan credits + deduct from PAYG balance
          const fromBalance = args.cost - Math.max(0, remaining);
          await ctx.db.patch(sub._id, {
            usedCredits: sub.monthlyCredits, // max out plan credits
            balance: Math.max(0, (sub.balance ?? 0) - fromBalance),
          });
        }
      }
    }
  },
});

/**
 * Get all active models for /v1/models endpoint.
 */
export const getActiveModels = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("providerConfigs").collect();

    // Get all active connections to know which providers have working credentials
    const allConnections = await ctx.db.query("providerConnections").collect();
    const connectedProviders = new Set<string>();
    for (const c of allConnections) {
      if (c.isActive && !c.needsReconnect) {
        connectedProviders.add(c.provider);
      }
    }

    // Provider alias map: connections under "gemini-cli" also serve "google" models
    const PROVIDER_ALIASES: Record<string, string[]> = {
      google: ["gemini-cli", "antigravity", "agy"],
      "gemini-cli": ["google", "antigravity", "agy"],
      antigravity: ["google", "gemini-cli", "agy"],
      agy: ["google", "gemini-cli", "antigravity"],
    };

    return all
      .filter((p) => {
        if (!p.enabled) return false;
        // Provider must have: apiKey, oauthAccessToken, OR an active connection (including aliases)
        const hasApiKey = !!(p.apiKey || (p.apiKeys && p.apiKeys.length > 0));
        const hasOAuth = !!(p.oauthAccessToken);
        const hasCookie = !!(p.sessionCookie || p.sessionToken);
        const hasDirectConnection = connectedProviders.has(p.provider);
        const hasAliasConnection = (PROVIDER_ALIASES[p.provider] || []).some(
          (alias) => connectedProviders.has(alias)
        );
        return hasApiKey || hasOAuth || hasCookie || hasDirectConnection || hasAliasConnection;
      })
      .map((p) => ({
        provider: p.provider,
        models: p.models
          .filter((m) => m.enabled)
          .map((m) => ({
            modelId: m.modelId,
            displayName: m.displayName,
          })),
      }));
  },
});

/* ═══════════════════════════════════════════════════════════════
   RESPONSE CACHE
   ═══════════════════════════════════════════════════════════════ */

export const getCachedResponse = internalQuery({
  args: { requestHash: v.string() },
  handler: async (ctx, { requestHash }) => {
    const cached = await ctx.db
      .query("responseCache")
      .withIndex("by_requestHash", (q) => q.eq("requestHash", requestHash))
      .first();
    if (!cached) return null;
    if (cached.expiresAt < Date.now()) return null; // expired
    return {
      responseJson: cached.responseJson,
      inputTokens: cached.inputTokens,
      outputTokens: cached.outputTokens,
      cacheId: cached._id,
    };
  },
});

export const setCachedResponse = internalMutation({
  args: {
    requestHash: v.string(),
    model: v.string(),
    responseJson: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    ttlMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ttl = (args.ttlMinutes ?? 5) * 60 * 1000;
    await ctx.db.insert("responseCache", {
      requestHash: args.requestHash,
      model: args.model,
      responseJson: args.responseJson,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hitCount: 0,
    });
  },
});

export const incrementCacheHit = internalMutation({
  args: { cacheId: v.id("responseCache") },
  handler: async (ctx, { cacheId }) => {
    const entry = await ctx.db.get(cacheId);
    if (entry) await ctx.db.patch(cacheId, { hitCount: entry.hitCount + 1 });
  },
});

/* ═══════════════════════════════════════════════════════════════
   PHASE 3: MODEL ALIASES
   ═══════════════════════════════════════════════════════════════ */

/**
 * Resolve a model alias to the real model ID.
 * If no alias found, returns the original model name.
 */
export const resolveModelAlias = internalQuery({
  args: { userId: v.id("users"), model: v.string() },
  handler: async (ctx, { userId, model }) => {
    const alias = await ctx.db
      .query("modelAliases")
      .withIndex("by_userId_alias", (q) =>
        q.eq("userId", userId).eq("alias", model)
      )
      .first();
    return alias ? alias.targetModel : model;
  },
});

/* ═══════════════════════════════════════════════════════════════
   PHASE 3: SPENDING LIMITS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Check if a user/key has exceeded their spending limit.
 */
export const checkSpendingLimit = internalQuery({
  args: {
    userId: v.id("users"),
    apiKeyId: v.id("apiKeys"),
  },
  handler: async (ctx, { userId, apiKeyId }) => {
    // Check key-specific limit first
    const keyLimit = await ctx.db
      .query("spendingAlerts")
      .withIndex("by_apiKeyId", (q) => q.eq("apiKeyId", apiKeyId))
      .first();

    if (keyLimit && keyLimit.enabled && keyLimit.action === "block") {
      if (keyLimit.currentSpendCents >= keyLimit.limitCents) {
        return { blocked: true, reason: "API key spending limit reached" };
      }
    }

    // Check account-wide limit
    const accountLimits = await ctx.db
      .query("spendingAlerts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const limit of accountLimits) {
      if (!limit.enabled || limit.apiKeyId) continue; // skip key-specific
      if (limit.action === "block" && limit.currentSpendCents >= limit.limitCents) {
        return { blocked: true, reason: "Account spending limit reached" };
      }
    }

    return { blocked: false };
  },
});

/* ═══════════════════════════════════════════════════════════════
   PHASE 3: FIND PROVIDER FOR MODEL (generic)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Find the best provider for a given model ID.
 * Returns provider info + pricing + base URL.
 */
export const findProviderForModel = internalQuery({
  args: { model: v.string() },
  handler: async (ctx, { model }) => {
    const allProviders = await ctx.db.query("providerConfigs").collect();

    for (const p of allProviders) {
      if (!p.enabled) continue;
      for (const m of p.models) {
        if (!m.enabled) continue;
        if (m.modelId === model) {
          return {
            provider: p.provider,
            baseUrl: p.baseUrl || null,
            inputPricePer1M: m.inputPricePer1M,
            outputPricePer1M: m.outputPricePer1M,
          };
        }
      }
    }

    return null;
  },
});

/* ═══════════════════════════════════════════════════════════════
   PHASE 3: GENERIC LOG USAGE (for new endpoints)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Log usage and deduct credits. Used by embeddings/images/audio proxies.
 */
export const logUsage = internalMutation({
  args: {
    userId: v.id("users"),
    apiKeyId: v.id("apiKeys"),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    latencyMs: v.number(),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("rate_limited")),
    cost: v.number(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert usage log
    await ctx.db.insert("usageLogs", {
      userId: args.userId,
      apiKeyId: args.apiKeyId,
      model: args.model,
      provider: args.provider,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      latencyMs: args.latencyMs,
      status: args.status,
      errorMessage: args.errorMessage,
      cost: args.cost,
      createdAt: Date.now(),
    });

    // Update last used on key
    await ctx.db.patch(args.apiKeyId, { lastUsedAt: Date.now() });

    // Deduct credits from subscription
    if (args.cost > 0) {
      const sub = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      if (sub) {
        await ctx.db.patch(sub._id, {
          usedCredits: sub.usedCredits + args.cost,
        });
      }

      // Update spending alert counters
      const alerts = await ctx.db
        .query("spendingAlerts")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
      for (const alert of alerts) {
        if (!alert.enabled) continue;
        if (alert.apiKeyId && alert.apiKeyId !== args.apiKeyId) continue;
        await ctx.db.patch(alert._id, {
          currentSpendCents: alert.currentSpendCents + args.cost,
        });
      }
    }
  },
});
