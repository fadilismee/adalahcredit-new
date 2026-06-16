import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";

/** FIX M1: Delete account — properly clean up all related data */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Delete auth accounts
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Delete auth sessions
    const authSessions = await ctx.db
      .query("authSessions")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const session of authSessions) {
      await ctx.db.delete(session._id);
    }

    // Delete profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    // Revoke all API keys
    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const key of apiKeys) {
      await ctx.db.delete(key._id);
    }

    // Delete subscriptions
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const sub of subs) {
      await ctx.db.delete(sub._id);
    }

    // Delete notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }

    // Delete spending alerts
    const alerts = await ctx.db
      .query("spendingAlerts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const a of alerts) {
      await ctx.db.delete(a._id);
    }

    // Delete the user record
    await ctx.db.delete(userId);

    return { success: true };
  },
});
