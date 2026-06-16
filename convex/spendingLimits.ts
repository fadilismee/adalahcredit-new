import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Spending Limits — budget alerts and spending caps per user/key.
 */

/* ═══════════════════════════════════════════════════════════════
   LIST spending alerts for current user
   ═══════════════════════════════════════════════════════════════ */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return ctx.db
      .query("spendingAlerts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

/* ═══════════════════════════════════════════════════════════════
   CREATE spending limit
   ═══════════════════════════════════════════════════════════════ */

export const create = mutation({
  args: {
    apiKeyId: v.optional(v.id("apiKeys")),
    limitCents: v.number(),
    action: v.union(v.literal("warn"), v.literal("block")),
  },
  handler: async (ctx, { apiKeyId, limitCents, action }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // FIX L12: Reject negative or zero limitCents
    if (limitCents <= 0) throw new Error("Limit must be a positive amount");

    // FIX H10: Verify apiKey belongs to the current user
    if (apiKeyId) {
      const key = await ctx.db.get(apiKeyId);
      if (!key || key.userId !== userId) {
        throw new Error("API key not found or does not belong to you");
      }
    }

    return ctx.db.insert("spendingAlerts", {
      userId,
      apiKeyId,
      limitCents,
      currentSpendCents: 0,
      periodStart: Date.now(),
      action,
      enabled: true,
      createdAt: Date.now(),
    });
  },
});

/* ═══════════════════════════════════════════════════════════════
   UPDATE spending limit
   FIX C3: Added ownership check
   ═══════════════════════════════════════════════════════════════ */

export const update = mutation({
  args: {
    alertId: v.id("spendingAlerts"),
    limitCents: v.optional(v.number()),
    action: v.optional(v.union(v.literal("warn"), v.literal("block"))),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, { alertId, limitCents, action, enabled }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const alert = await ctx.db.get(alertId);
    if (!alert) throw new Error("Alert not found");
    if (alert.userId !== userId) throw new Error("Not authorized");

    // FIX L12: Reject negative limitCents on update
    if (limitCents !== undefined && limitCents <= 0) {
      throw new Error("Limit must be a positive amount");
    }

    const patch: Record<string, unknown> = {};
    if (limitCents !== undefined) patch.limitCents = limitCents;
    if (action !== undefined) patch.action = action;
    if (enabled !== undefined) patch.enabled = enabled;

    await ctx.db.patch(alertId, patch);
  },
});

/* ═══════════════════════════════════════════════════════════════
   DELETE spending limit
   FIX C4: Added ownership check
   ═══════════════════════════════════════════════════════════════ */

export const remove = mutation({
  args: { alertId: v.id("spendingAlerts") },
  handler: async (ctx, { alertId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const alert = await ctx.db.get(alertId);
    if (!alert) throw new Error("Alert not found");
    if (alert.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(alertId);
  },
});

/* ═══════════════════════════════════════════════════════════════
   RESET monthly spending (called by cron — internal only)
   FIX C5: Changed from public mutation to internalMutation
   ═══════════════════════════════════════════════════════════════ */

export const resetMonthlySpending = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allAlerts = await ctx.db.query("spendingAlerts").collect();
    const now = Date.now();

    for (const alert of allAlerts) {
      // Reset if period is > 30 days old
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (now - alert.periodStart >= thirtyDays) {
        await ctx.db.patch(alert._id, {
          currentSpendCents: 0,
          periodStart: now,
          notifiedAt: undefined,
        });
      }
    }
  },
});
