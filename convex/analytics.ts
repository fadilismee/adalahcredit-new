import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/adminGuard";

/* ═══════════════════════════════════════════════════════════════
   USER ANALYTICS — usage over time for current user
   ═══════════════════════════════════════════════════════════════ */

/** Get daily usage for chart (last N days) */
export const myDailyUsage = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = Date.now();
    const startDate = new Date(now - days * 86400000);
    const startStr = startDate.toISOString().slice(0, 10);

    const rows = await ctx.db
      .query("dailyUsage")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).gte("date", startStr))
      .collect();

    return rows.map((r) => ({
      date: r.date,
      requests: r.totalRequests,
      success: r.successCount,
      errors: r.errorCount,
      cost: r.totalCost / 100, // cents -> dollars
      tokens: r.totalInputTokens + r.totalOutputTokens,
      latency: r.avgLatencyMs,
      models: r.modelBreakdown,
    }));
  },
});

/** Model breakdown aggregation (last N days) */
export const myModelBreakdown = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = Date.now();
    const startDate = new Date(now - days * 86400000);
    const startStr = startDate.toISOString().slice(0, 10);

    const rows = await ctx.db
      .query("dailyUsage")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).gte("date", startStr))
      .collect();

    // Aggregate by model
    const map = new Map<string, { model: string; provider: string; requests: number; cost: number }>();
    for (const row of rows) {
      for (const m of row.modelBreakdown) {
        const key = m.model;
        const existing = map.get(key);
        if (existing) {
          existing.requests += m.requests;
          existing.cost += m.cost;
        } else {
          map.set(key, { ...m });
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
  },
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN ANALYTICS — global system stats
   ═══════════════════════════════════════════════════════════════ */

/** Global daily stats for admin charts */
export const adminDailyStats = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const startDate = new Date(now - days * 86400000);
    const startStr = startDate.toISOString().slice(0, 10);

    const allUsage = await ctx.db
      .query("dailyUsage")
      .filter((q) => q.gte(q.field("date"), startStr))
      .collect();

    // Aggregate by date
    const map = new Map<string, { date: string; requests: number; revenue: number; users: Set<string>; errors: number }>();
    for (const row of allUsage) {
      const existing = map.get(row.date);
      if (existing) {
        existing.requests += row.totalRequests;
        existing.revenue += row.totalCost;
        existing.users.add(row.userId);
        existing.errors += row.errorCount;
      } else {
        map.set(row.date, {
          date: row.date,
          requests: row.totalRequests,
          revenue: row.totalCost,
          users: new Set([row.userId]),
          errors: row.errorCount,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: d.date,
        requests: d.requests,
        revenue: d.revenue / 100,
        activeUsers: d.users.size,
        errors: d.errors,
      }));
  },
});

/** Admin: user growth (signups per day) */
export const adminUserGrowth = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const start = now - days * 86400000;

    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.gte(q.field("createdAt"), start))
      .collect();

    // Group by date
    const map = new Map<string, number>();
    for (const p of profiles) {
      const date = new Date(p.createdAt).toISOString().slice(0, 10);
      map.set(date, (map.get(date) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, signups: count }));
  },
});

/** Admin: top users by usage */
export const adminTopUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    await requireAdmin(ctx);

    const allUsage = await ctx.db.query("dailyUsage").collect();

    // Aggregate by user
    const map = new Map<string, { userId: string; requests: number; cost: number }>();
    for (const row of allUsage) {
      const existing = map.get(row.userId);
      if (existing) {
        existing.requests += row.totalRequests;
        existing.cost += row.totalCost;
      } else {
        map.set(row.userId, {
          userId: row.userId,
          requests: row.totalRequests,
          cost: row.totalCost,
        });
      }
    }

    const sorted = Array.from(map.values())
      .sort((a, b) => b.cost - a.cost)
      .slice(0, limit);

    // Enrich with profile data
    const result = [];
    for (const u of sorted) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", u.userId as any))
        .unique();
      result.push({
        ...u,
        displayName: profile?.displayName ?? "Unknown",
        plan: profile?.plan ?? "free",
        cost: u.cost / 100,
      });
    }

    return result;
  },
});

/** Admin: summary stats */
export const adminSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const profiles = await ctx.db.query("profiles").collect();
    const apiKeys = await ctx.db.query("apiKeys").collect();
    const providers = await ctx.db.query("providerConfigs").collect();
    const tickets = await ctx.db
      .query("supportTickets")
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    const totalUsers = profiles.length;
    const activeKeys = apiKeys.filter((k) => k.status === "active").length;
    const enabledProviders = providers.filter((p) => p.enabled).length;
    const openTickets = tickets.length;

    // Revenue from subscriptions
    const subs = await ctx.db.query("subscriptions").collect();
    const totalRevenue = subs.reduce((sum, s) => sum + s.usedCredits, 0);

    return {
      totalUsers,
      activeKeys,
      enabledProviders,
      openTickets,
      totalRevenue: totalRevenue / 100,
      planBreakdown: {
        free: profiles.filter((p) => p.plan === "free").length,
        starter: profiles.filter((p) => p.plan === "starter").length,
        pro: profiles.filter((p) => p.plan === "pro").length,
        enterprise: profiles.filter((p) => p.plan === "enterprise").length,
      },
    };
  },
});
