import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { refreshOAuthToken } from "./proxyConnections";

/** Clean up expired response cache entries */
export const cleanupExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("responseCache")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .take(100);

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }
    if (expired.length > 0) {
      console.log(`[cron] Cleaned up ${expired.length} expired cache entries`);
    }
  },
});

/** Expire API keys past their expiresAt */
export const expireApiKeys = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const activeKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(500);

    let count = 0;
    for (const key of activeKeys) {
      if (key.expiresAt && key.expiresAt < now) {
        await ctx.db.patch(key._id, { status: "expired" });
        count++;
      }
    }
    if (count > 0) {
      console.log(`[cron] Expired ${count} API keys`);
    }
  },
});

/** Aggregate yesterday's usage logs into dailyUsage */
export const aggregateDailyUsage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const dateStr = yesterday.toISOString().split("T")[0];
    const dayStart = new Date(dateStr + "T00:00:00Z").getTime();
    const dayEnd = dayStart + 86400000;

    // Get all users who had activity
    const logs = await ctx.db
      .query("usageLogs")
      .withIndex("by_createdAt")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), dayStart),
          q.lt(q.field("createdAt"), dayEnd)
        )
      )
      .take(10000);

    // Group by userId
    const byUser = new Map<string, typeof logs>();
    for (const log of logs) {
      const key = log.userId;
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key)!.push(log);
    }

    for (const [userId, userLogs] of byUser) {
      // Check if already aggregated
      const existing = await ctx.db
        .query("dailyUsage")
        .withIndex("by_userId_date", (q) => q.eq("userId", userId as any).eq("date", dateStr))
        .first();
      if (existing) continue;

      const successCount = userLogs.filter((l) => l.status === "success").length;
      const errorCount = userLogs.filter((l) => l.status === "error").length;
      const totalInput = userLogs.reduce((s, l) => s + l.inputTokens, 0);
      const totalOutput = userLogs.reduce((s, l) => s + l.outputTokens, 0);
      const totalCost = userLogs.reduce((s, l) => s + l.cost, 0);
      const avgLatency = userLogs.length
        ? Math.round(userLogs.reduce((s, l) => s + l.latencyMs, 0) / userLogs.length)
        : 0;

      // Model breakdown
      const modelMap = new Map<string, { provider: string; requests: number; cost: number }>();
      for (const log of userLogs) {
        const key = log.model;
        const entry = modelMap.get(key) || { provider: log.provider, requests: 0, cost: 0 };
        entry.requests++;
        entry.cost += log.cost;
        modelMap.set(key, entry);
      }

      await ctx.db.insert("dailyUsage", {
        userId: userId as any,
        date: dateStr,
        totalRequests: userLogs.length,
        successCount,
        errorCount,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
        totalCost,
        avgLatencyMs: avgLatency,
        modelBreakdown: Array.from(modelMap.entries()).map(([model, data]) => ({
          model,
          provider: data.provider,
          requests: data.requests,
          cost: data.cost,
        })),
      });
    }

    if (byUser.size > 0) {
      console.log(`[cron] Aggregated daily usage for ${byUser.size} users on ${dateStr}`);
    }
  },
});

/** Cleanup error logs older than 30 days */
export const cleanupOldErrorLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 86400000;
    const old = await ctx.db
      .query("errorLogs")
      .withIndex("by_createdAt")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .take(200);

    for (const entry of old) {
      await ctx.db.delete(entry._id);
    }
    if (old.length > 0) {
      console.log(`[cron] Cleaned up ${old.length} old error logs`);
    }
  },
});

/** Check provider health by testing connectivity */
export const checkProviderHealth = internalAction({
  args: {},
  handler: async (ctx) => {
    const providers = [
      { name: "API Gateway", url: null },
      { name: "OpenAI", url: "https://api.openai.com/v1/models" },
      { name: "Anthropic", url: "https://api.anthropic.com/v1/messages" },
      { name: "Google AI", url: "https://generativelanguage.googleapis.com/" },
      { name: "DeepSeek", url: "https://api.deepseek.com/v1/models" },
      { name: "Mistral", url: "https://api.mistral.ai/v1/models" },
      { name: "xAI", url: "https://api.x.ai/v1/models" },
      { name: "Cohere", url: "https://api.cohere.com/v2/chat" },
      { name: "Meta Llama", url: "https://api.llama-api.com/chat/completions" },
    ];

    for (const p of providers) {
      let status: "operational" | "degraded" | "partial_outage" | "major_outage" = "operational";

      if (p.url) {
        try {
          const start = Date.now();
          const res = await fetch(p.url, {
            method: "HEAD",
            signal: AbortSignal.timeout(5000),
          });
          const latency = Date.now() - start;
          // 401/403 = service is up but needs auth, that's OK
          if (res.status >= 500) status = "major_outage";
          else if (latency > 3000) status = "degraded";
        } catch {
          status = "partial_outage";
        }
      }

      await ctx.runMutation(internal.cronTasks.upsertServiceStatus, {
        serviceName: p.name,
        status,
      });
    }
  },
});

/** Upsert service status (called by health check action) */
export const upsertServiceStatus = internalMutation({
  args: {
    serviceName: v.string(),
    status: v.union(
      v.literal("operational"),
      v.literal("degraded"),
      v.literal("partial_outage"),
      v.literal("major_outage")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serviceStatus")
      .withIndex("by_serviceName", (q) => q.eq("serviceName", args.serviceName))
      .first();

    const now = Date.now();
    if (existing) {
      // Calculate uptime (simple: if operational, keep at ~99.9+)
      const wasOp = existing.status === "operational";
      const isOp = args.status === "operational";
      let uptime = existing.uptimePercent;
      if (isOp && wasOp) uptime = Math.min(100, uptime + 0.01);
      else if (!isOp) uptime = Math.max(0, uptime - 0.5);

      await ctx.db.patch(existing._id, {
        status: args.status,
        uptimePercent: Math.round(uptime * 100) / 100,
        lastCheckedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("serviceStatus", {
        serviceName: args.serviceName,
        status: args.status,
        uptimePercent: args.status === "operational" ? 99.99 : 95.0,
        lastCheckedAt: now,
        updatedAt: now,
      });
    }
  },
});

// Need to import v for upsertServiceStatus
import { v } from "convex/values";

// ══════════════════════════════════════════════════════════════
// KeepAlive — Background OAuth Token Refresh
// (from KeiRouter: oauth/keepalive.go)
//
// Every 30 minutes, scan all active OAuth connections and
// proactively refresh tokens that are expired or near-expiry.
// On permanent failure → mark NeedsReconnect.
// ══════════════════════════════════════════════════════════════

/** KeepAlive: proactively refresh OAuth tokens before they expire */
export const keepAliveRefresh = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all active OAuth connections with refresh tokens
    const allConns = await ctx.db.query("providerConnections").collect();
    const oauthConns = allConns.filter(
      (c) =>
        c.authType === "oauth" &&
        c.refreshToken &&
        c.isActive &&
        !c.needsReconnect
    );

    if (oauthConns.length === 0) return;

    const now = Date.now();
    const REFRESH_SKEW_MS = 5 * 60 * 1000; // 5 minutes before expiry
    let refreshed = 0;
    let failed = 0;
    let permanent = 0;

    for (const conn of oauthConns) {
      // Check if token needs refresh
      let needsRefresh = false;

      if (conn.expiresAt) {
        const expiryMs = new Date(conn.expiresAt).getTime();
        if (expiryMs < now + REFRESH_SKEW_MS) {
          needsRefresh = true;
        }
      } else {
        // No expiry set — refresh proactively if it's been > 25 min since update
        const lastUpdate = conn.updatedAt || conn.createdAt;
        if (now - lastUpdate > 25 * 60 * 1000) {
          needsRefresh = true;
        }
      }

      if (!needsRefresh) continue;

      // Try refresh
      const result = await refreshOAuthToken(conn.provider, conn.refreshToken!);

      if (result.success) {
        await ctx.db.patch(conn._id, {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
          expiresIn: result.expiresIn,
          needsReconnect: false,
          testStatus: "active",
          updatedAt: now,
        });
        refreshed++;
      } else {
        if (result.isPermanent) {
          // Mark NeedsReconnect
          await ctx.db.patch(conn._id, {
            needsReconnect: true,
            testStatus: "expired",
            updatedAt: now,
          });
          permanent++;
          console.warn(
            `[keepAlive] PERMANENT refresh failure for ${conn.provider} (${conn.email || conn._id}): ${result.failReason}`
          );
        } else {
          failed++;
          console.warn(
            `[keepAlive] Transient refresh failure for ${conn.provider} (${conn.email || conn._id}): ${result.failReason}`
          );
        }
      }
    }

    if (refreshed > 0 || failed > 0 || permanent > 0) {
      console.log(
        `[keepAlive] Processed ${oauthConns.length} OAuth connections: ${refreshed} refreshed, ${failed} transient failures, ${permanent} permanent (NeedsReconnect)`
      );
    }
  },
});

/** Clear expired cooldowns on startup / periodically */
export const clearExpiredCooldowns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allConns = await ctx.db.query("providerConnections").collect();
    let cleared = 0;

    for (const conn of allConns) {
      if (conn.rateLimitedUntil && conn.rateLimitedUntil < now) {
        await ctx.db.patch(conn._id, {
          rateLimitedUntil: undefined,
          backoffLevel: 0,
          updatedAt: now,
        });
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`[cron] Cleared ${cleared} expired cooldowns`);
    }
  },
});
