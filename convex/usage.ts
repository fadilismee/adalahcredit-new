import { getAuthUserId } from "@convex-dev/auth/server";
import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/* ═══════════════════════════════════════════════════════════════
   USAGE QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // FIX H7: Use time-bounded queries instead of unbounded .collect()
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Only fetch last 60 days for current + previous period comparison
    const recentLogs = await ctx.db
      .query("usageLogs")
      .withIndex("by_userId_createdAt", (q) =>
        q.eq("userId", userId).gte("createdAt", sixtyDaysAgo)
      )
      .collect();

    const last30d = recentLogs.filter((l) => l.createdAt > thirtyDaysAgo);
    const last7d = recentLogs.filter((l) => l.createdAt > sevenDaysAgo);
    const last24h = recentLogs.filter((l) => l.createdAt > oneDayAgo);
    const prev30d = recentLogs.filter(
      (l) => l.createdAt > sixtyDaysAgo && l.createdAt <= thirtyDaysAgo
    );

    const totalRequests = last30d.length;
    const totalCost = last30d.reduce((s, l) => s + l.cost, 0);
    const successCount = last30d.filter((l) => l.status === "success").length;
    const avgLatency = last30d.length > 0
      ? Math.round(last30d.reduce((s, l) => s + l.latencyMs, 0) / last30d.length)
      : 0;

    const requestsChange = prev30d.length > 0
      ? `${totalRequests >= prev30d.length ? "+" : ""}${Math.round(((totalRequests - prev30d.length) / prev30d.length) * 100)}%`
      : "+0%";

    return {
      totalRequests: totalRequests.toLocaleString(),
      totalSpend: `$${(totalCost / 100).toFixed(2)}`,
      avgLatency: `${avgLatency}ms`,
      successRate: totalRequests > 0 ? `${((successCount / totalRequests) * 100).toFixed(1)}%` : "100%",
      requestsChange,
      last24hRequests: last24h.length,
      last7dRequests: last7d.length,
    };
  },
});

export const getRecentLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const logs = await ctx.db
      .query("usageLogs")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 50);

    return logs.map((l) => ({
      ...l,
      time: new Date(l.createdAt).toLocaleTimeString(),
    }));
  },
});

export const getDailyUsage = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const lookback = (days ?? 7);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookback);

    const dailyData = await ctx.db
      .query("dailyUsage")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId))
      .collect();

    const dateStr = (d: Date) => d.toISOString().split("T")[0];
    const filtered = dailyData.filter((d) => d.date >= dateStr(startDate));

    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getModelBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // FIX H7: Use time-bounded query instead of unbounded .collect()
    const recent = await ctx.db
      .query("usageLogs")
      .withIndex("by_userId_createdAt", (q) =>
        q.eq("userId", userId).gte("createdAt", thirtyDaysAgo)
      )
      .collect();

    // Aggregate by model
    const byModel = new Map<string, { model: string; provider: string; requests: number; cost: number; tokens: number }>();
    for (const log of recent) {
      const key = log.model;
      const existing = byModel.get(key) ?? { model: log.model, provider: log.provider, requests: 0, cost: 0, tokens: 0 };
      existing.requests++;
      existing.cost += log.cost;
      existing.tokens += log.inputTokens + log.outputTokens;
      byModel.set(key, existing);
    }

    return Array.from(byModel.values()).sort((a, b) => b.requests - a.requests);
  },
});

/* ═══════════════════════════════════════════════════════════════
   USAGE MUTATIONS (called by API gateway — internal only)
   FIX C2: Changed from public mutation to internalMutation
   ═══════════════════════════════════════════════════════════════ */

export const logUsage = internalMutation({
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
    // Look up key to get userId
    const key = await ctx.db.get(args.apiKeyId);
    if (!key) throw new Error("API key not found");

    await ctx.db.insert("usageLogs", {
      userId: key.userId,
      ...args,
      createdAt: Date.now(),
    });

    // Update last used
    await ctx.db.patch(args.apiKeyId, { lastUsedAt: Date.now() });

    // FIX C17: In Convex, mutations on the same document are serialized via OCC,
    // so read-then-write is safe. Convex will auto-retry on conflict.
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", key.userId))
      .first();
    if (sub) {
      await ctx.db.patch(sub._id, {
        usedCredits: sub.usedCredits + args.cost,
      });
    }
  },
});

/* ═══════════════════════════════════════════════════════════════
   SPENDING ALERTS — 3-level (50%, 80%, 95%)
   ═══════════════════════════════════════════════════════════════ */

export const getSpendingAlert = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!sub) return { level: "none" as const, usagePercent: 0, remaining: 0, total: 0, used: 0, message: "" };

    const usagePercent = sub.monthlyCredits > 0 ? Math.round((sub.usedCredits / sub.monthlyCredits) * 100) : 0;
    const remaining = sub.monthlyCredits - sub.usedCredits;

    let level: "none" | "warning" | "critical" | "exhausted" = "none";
    let message = "";

    if (usagePercent >= 95) {
      level = "exhausted";
      message = `⚠️ Kamu sudah pakai ${usagePercent}% kredit bulan ini. Sisa $${(remaining / 100).toFixed(2)}. Segera top up!`;
    } else if (usagePercent >= 80) {
      level = "critical";
      message = `🔴 Kamu sudah pakai ${usagePercent}% kredit bulan ini. Sisa $${(remaining / 100).toFixed(2)}.`;
    } else if (usagePercent >= 50) {
      level = "warning";
      message = `🟡 Kamu sudah pakai ${usagePercent}% kredit bulan ini. Sisa $${(remaining / 100).toFixed(2)}.`;
    }

    return {
      level,
      usagePercent,
      remaining,
      total: sub.monthlyCredits,
      used: sub.usedCredits,
      message,
    };
  },
});
