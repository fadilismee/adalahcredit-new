import { query } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin } from "./lib/adminGuard";

/* ═══════════════════════════════════════════════════════════════
   ADMIN QUERIES (checks for admin role)
   ═══════════════════════════════════════════════════════════════ */

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return null;

    const profiles = await ctx.db.query("profiles").collect();
    const totalUsers = profiles.length;
    const proUsers = profiles.filter((p) => p.plan === "pro" || p.plan === "enterprise").length;

    const keys = await ctx.db.query("apiKeys").collect();
    const activeKeys = keys.filter((k) => k.status === "active").length;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentLogs = await ctx.db.query("usageLogs").collect();
    const last30d = recentLogs.filter((l) => l.createdAt > thirtyDaysAgo);
    const totalRequests = last30d.length;
    const totalRevenue = last30d.reduce((s, l) => s + l.cost, 0);

    const incidents = await ctx.db.query("incidents").collect();
    const activeIncidents = incidents.filter((i) => i.status !== "resolved").length;

    return {
      totalUsers,
      proUsers,
      activeKeys,
      totalRequests: totalRequests.toLocaleString(),
      totalRevenue: `$${(totalRevenue / 100).toFixed(2)}`,
      activeIncidents,
      recentSignups: profiles
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10)
        .map((p) => ({
          displayName: p.displayName,
          plan: p.plan,
          date: new Date(p.createdAt).toLocaleDateString(),
        })),
    };
  },
});

export const listAllUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return [];

    const profiles = await ctx.db.query("profiles").collect();

    const enriched = await Promise.all(
      profiles.slice(0, limit ?? 50).map(async (p) => {
        const user = await ctx.db.get(p.userId);
        const keys = await ctx.db
          .query("apiKeys")
          .withIndex("by_userId", (q) => q.eq("userId", p.userId))
          .collect();
        const sub = await ctx.db
          .query("subscriptions")
          .withIndex("by_userId", (q) => q.eq("userId", p.userId))
          .first();

        return {
          ...p,
          email: user?.email ?? "",
          activeKeys: keys.filter((k) => k.status === "active").length,
          subscription: sub ? {
            plan: sub.plan,
            status: sub.status,
            usedCredits: `$${(sub.usedCredits / 100).toFixed(2)}`,
            monthlyCredits: `$${(sub.monthlyCredits / 100).toFixed(2)}`,
          } : null,
        };
      })
    );

    return enriched;
  },
});

export const getSystemOverview = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await isAdmin(ctx);
    if (!adminId) return null;

    const services = await ctx.db.query("serviceStatus").collect();
    const incidents = await ctx.db.query("incidents").collect();

    const operational = services.filter((s) => s.status === "operational").length;
    const degraded = services.filter((s) => s.status !== "operational").length;

    return {
      services: { total: services.length, operational, degraded },
      incidents: {
        total: incidents.length,
        active: incidents.filter((i) => i.status !== "resolved").length,
        resolved: incidents.filter((i) => i.status === "resolved").length,
      },
      avgUptime: services.length > 0
        ? (services.reduce((s, svc) => s + svc.uptimePercent, 0) / services.length).toFixed(2) + "%"
        : "N/A",
    };
  },
});
