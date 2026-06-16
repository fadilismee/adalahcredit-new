import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Provider Auth Abstraction Layer
 *
 * Handles getting the right credentials for each auth type:
 * - api_key: standard API key in Authorization header
 * - oauth: OAuth access token (auto-refresh if expired)
 * - cookie: session cookie/token
 * - free: no auth needed
 * - device_code: similar to OAuth but device code flow
 */

/* ═══════════════════════════════════════════════════════════════
   GET AUTH HEADERS — returns the right headers for each provider
   ═══════════════════════════════════════════════════════════════ */

export const getProviderAuth = internalQuery({
  args: { provider: v.string() },
  handler: async (ctx, { provider }) => {
    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .unique();

    if (!config || !config.enabled) return null;

    switch (config.authType) {
      case "api_key":
        if (!config.apiKey) return null;
        return {
          type: "api_key" as const,
          headers: buildApiKeyHeaders(provider, config.apiKey),
          baseUrl: config.baseUrl || "",
          tier: config.tier || "api_key",
          quotaAvailable: true,
        };

      case "oauth":
      case "device_code": {
        const token = config.oauthAccessToken;
        if (!token) return null;
        // Check if token expired
        const expired = config.oauthExpiresAt && config.oauthExpiresAt < Date.now();
        if (expired && config.oauthRefreshToken) {
          // Token needs refresh — caller should trigger refresh mutation
          return {
            type: "oauth_expired" as const,
            headers: {},
            baseUrl: config.baseUrl || "",
            tier: config.tier || "api_key",
            quotaAvailable: false,
            needsRefresh: true,
          };
        }
        if (expired) return null;
        return {
          type: "oauth" as const,
          headers: { Authorization: `Bearer ${token}` },
          baseUrl: config.baseUrl || "",
          tier: config.tier || "api_key",
          quotaAvailable: checkQuota(config),
        };
      }

      case "cookie": {
        const cookie = config.sessionCookie || config.sessionToken;
        if (!cookie) return null;
        // Check cookie expiry
        if (config.cookieExpiresAt && config.cookieExpiresAt < Date.now()) return null;
        return {
          type: "cookie" as const,
          headers: buildCookieHeaders(provider, cookie),
          baseUrl: config.baseUrl || "",
          tier: config.tier || "api_key",
          quotaAvailable: true,
        };
      }

      case "free":
        return {
          type: "free" as const,
          headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
          baseUrl: config.baseUrl || "",
          tier: config.tier || "api_key",
          quotaAvailable: true,
        };

      case "service_account":
        if (!config.apiKey) return null;
        return {
          type: "service_account" as const,
          headers: { Authorization: `Bearer ${config.apiKey}` },
          baseUrl: config.baseUrl || "",
          tier: config.tier || "api_key",
          quotaAvailable: true,
        };

      default:
        return null;
    }
  },
});

/* ═══════════════════════════════════════════════════════════════
   RESOLVE MODEL — find provider for a model ID dynamically
   ═══════════════════════════════════════════════════════════════ */

export const resolveModel = internalQuery({
  args: { modelId: v.string() },
  handler: async (ctx, { modelId }) => {
    const allProviders = await ctx.db.query("providerConfigs").collect();
    const matches: Array<{
      provider: string;
      realModel: string;
      tier: string;
      priority: number;
      authType: string;
    }> = [];

    for (const p of allProviders) {
      if (!p.enabled) continue;
      for (const m of p.models) {
        if (!m.enabled) continue;
        if (m.modelId === modelId) {
          matches.push({
            provider: p.provider,
            realModel: m.modelId,
            tier: p.tier || "api_key",
            priority: p.fallbackPriority ?? tierPriority(p.tier || 'api_key'),
            authType: p.authType,
          });
        }
      }
    }

    if (matches.length === 0) return null;

    // Sort by priority (lower = higher priority)
    matches.sort((a, b) => a.priority - b.priority);

    return {
      primary: matches[0],
      fallbacks: matches.slice(1),
    };
  },
});

/* ═══════════════════════════════════════════════════════════════
   GET 4-TIER FALLBACK CHAIN — for a given model capability
   ═══════════════════════════════════════════════════════════════ */

export const getFallbackChain = internalQuery({
  args: { modelId: v.string() },
  handler: async (ctx, { modelId }) => {
    const allProviders = await ctx.db.query("providerConfigs").collect();

    // Find all providers that have this model
    const chain: Array<{
      provider: string;
      modelId: string;
      tier: string;
      priority: number;
    }> = [];

    for (const p of allProviders) {
      if (!p.enabled) continue;
      for (const m of p.models) {
        if (!m.enabled) continue;
        if (m.modelId === modelId) {
          chain.push({
            provider: p.provider,
            modelId: m.modelId,
            tier: p.tier || "api_key",
            priority: p.fallbackPriority ?? tierPriority(p.tier || 'api_key'),
          });
        }
      }
    }

    // Sort: subscription → api_key → cheap → free
    chain.sort((a, b) => a.priority - b.priority);

    return chain;
  },
});

/* ═══════════════════════════════════════════════════════════════
   UPDATE OAUTH TOKEN
   ═══════════════════════════════════════════════════════════════ */

export const updateOAuthToken = internalMutation({
  args: {
    provider: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .unique();

    if (!config) return;

    await ctx.db.patch(config._id, {
      oauthAccessToken: args.accessToken,
      ...(args.refreshToken ? { oauthRefreshToken: args.refreshToken } : {}),
      oauthExpiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

/* ═══════════════════════════════════════════════════════════════
   UPDATE QUOTA USAGE
   ═══════════════════════════════════════════════════════════════ */

export const incrementQuota = internalMutation({
  args: { provider: v.string(), amount: v.optional(v.number()) },
  handler: async (ctx, { provider, amount }) => {
    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .unique();

    if (!config) return;

    // Check if quota needs reset
    const now = Date.now();
    if (config.quotaResetAt && config.quotaResetAt < now) {
      await ctx.db.patch(config._id, {
        quotaUsed: amount ?? 1,
        quotaResetAt: getNextResetTime(config.quotaType),
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(config._id, {
        quotaUsed: (config.quotaUsed ?? 0) + (amount ?? 1),
        updatedAt: now,
      });
    }
  },
});

/* ═══════════════════════════════════════════════════════════════
   LIST ALL PROVIDERS BY TIER
   ═══════════════════════════════════════════════════════════════ */

export const getProvidersByTier = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("providerConfigs").collect();
    const enabled = all.filter((p) => p.enabled);

    return {
      subscription: enabled.filter((p) => p.tier === "subscription"),
      api_key: enabled.filter((p) => p.tier === "api_key"),
      cheap: enabled.filter((p) => p.tier === "cheap"),
      free: enabled.filter((p) => p.tier === "free"),
    };
  },
});

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function tierPriority(tier: string): number {
  switch (tier) {
    case "subscription": return 10;
    case "api_key": return 20;
    case "cheap": return 30;
    case "free": return 40;
    default: return 50;
  }
}

function checkQuota(config: {
  quotaLimit?: number;
  quotaUsed?: number;
  quotaResetAt?: number;
  quotaType?: string;
}): boolean {
  if (!config.quotaLimit) return true; // No quota = unlimited
  if (config.quotaType === "unlimited") return true;

  // Check if quota needs reset
  if (config.quotaResetAt && config.quotaResetAt < Date.now()) return true; // Reset due

  return (config.quotaUsed ?? 0) < config.quotaLimit;
}

function getNextResetTime(quotaType?: string | null): number {
  const now = Date.now();
  switch (quotaType) {
    case "requests_per_minute": return now + 60_000;
    case "requests_per_day": return now + 86_400_000;
    case "requests_per_5h": return now + 5 * 3_600_000;
    case "tokens_per_month": return now + 30 * 86_400_000;
    default: return now + 86_400_000;
  }
}

function buildApiKeyHeaders(provider: string, apiKey: string): Record<string, string> {
  switch (provider) {
    case "anthropic":
      return {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      };
    case "cohere":
      return { Authorization: `Bearer ${apiKey}` };
    case "google":
      return {}; // Google uses query parameter ?key=
    default:
      return { Authorization: `Bearer ${apiKey}` };
  }
}

function buildCookieHeaders(provider: string, cookie: string): Record<string, string> {
  switch (provider) {
    case "chatgpt-web":
      return {
        Authorization: `Bearer ${cookie}`,
        "Content-Type": "application/json",
      };
    case "grok-web":
      return {
        Cookie: cookie,
        "Content-Type": "application/json",
      };
    case "perplexity-web":
      return {
        Cookie: cookie,
        "Content-Type": "application/json",
      };
    default:
      return {
        Authorization: `Bearer ${cookie}`,
        "Content-Type": "application/json",
      };
  }
}
