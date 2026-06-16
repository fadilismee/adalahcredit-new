import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* ═══════════════════════════════════════════════════════════════
   SUBSCRIPTION QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!sub) return null;

    const balance = sub.balance ?? 0;
    const remaining = sub.monthlyCredits - sub.usedCredits;
    const usagePercent = sub.monthlyCredits > 0
      ? Math.round((sub.usedCredits / sub.monthlyCredits) * 100)
      : 0;

    const daysLeft = Math.max(
      0,
      Math.ceil((sub.currentPeriodEnd - Date.now()) / (24 * 60 * 60 * 1000))
    );

    return {
      ...sub,
      balance,
      usagePercent,
      daysLeft,
      monthlyCreditsFormatted: `$${(sub.monthlyCredits / 100).toFixed(2)}`,
      usedCreditsFormatted: `$${(sub.usedCredits / 100).toFixed(2)}`,
      remainingCredits: `$${(Math.max(0, remaining) / 100).toFixed(2)}`,
      balanceFormatted: `$${(balance / 100).toFixed(2)}`,
      totalAvailable: `$${((Math.max(0, remaining) + balance) / 100).toFixed(2)}`,
    };
  },
});

export const getTransactionHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 20);
  },
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const getAllSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    // Check admin
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile?.role !== "admin") return [];

    const subs = await ctx.db.query("subscriptions").collect();
    return await Promise.all(
      subs.map(async (sub) => {
        const userProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", sub.userId))
          .unique();
        return {
          ...sub,
          balance: sub.balance ?? 0,
          userName: userProfile?.displayName ?? "Unknown",
        };
      })
    );
  },
});

/* ═══════════════════════════════════════════════════════════════
   MUTATIONS — Plan changes now go through subscriptionEngine
   These are kept for backward compatibility
   ═══════════════════════════════════════════════════════════════ */

export const upgradePlan = mutation({
  args: {
    plan: v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, { plan }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Direct upgrade is only for admin override or when payment is already confirmed
    // Normal users should use subscriptionEngine.createSubscriptionOrder
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!sub) throw new Error("No subscription found. Create one first.");

    const now = Date.now();

    // Get plan config from DB
    const dbPlan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_planId", (q) => q.eq("planId", plan))
      .unique();

    const creditsCents = dbPlan?.creditsCents ?? (plan === "starter" ? 500 : plan === "pro" ? 2000 : 10000);

    await ctx.db.patch(sub._id, {
      plan,
      monthlyCredits: creditsCents,
      currentPeriodStart: now,
      currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      usedCredits: 0,
      status: "active",
    });

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, { plan });
    }

    return { success: true };
  },
});

export const cancelSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!sub) throw new Error("No subscription found");

    await ctx.db.patch(sub._id, {
      status: "cancelled",
      cancelledAt: Date.now(),
      autoRenew: false,
    });

    return { success: true };
  },
});
