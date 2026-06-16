import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* ═══════════════════════════════════════════════════════════════
   WEBHOOK QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const listMyWebhooks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("webhooks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

/* ═══════════════════════════════════════════════════════════════
   WEBHOOK MUTATIONS
   ═══════════════════════════════════════════════════════════════ */

export const createWebhook = mutation({
  args: {
    url: v.string(),
    events: v.array(v.string()),
  },
  handler: async (ctx, { url, events }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate webhook secret
    const secret = "whsec_" + Array.from({ length: 32 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 36))
    ).join("");

    const id = await ctx.db.insert("webhooks", {
      userId,
      url,
      events,
      status: "active",
      secret,
      failCount: 0,
      createdAt: Date.now(),
    });

    return { id, secret };
  },
});

export const updateWebhook = mutation({
  args: {
    webhookId: v.id("webhooks"),
    url: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("disabled"))),
  },
  handler: async (ctx, { webhookId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const webhook = await ctx.db.get(webhookId);
    if (!webhook || webhook.userId !== userId) throw new Error("Webhook not found");

    const patch: Record<string, unknown> = {};
    if (updates.url !== undefined) patch.url = updates.url;
    if (updates.events !== undefined) patch.events = updates.events;
    if (updates.status !== undefined) patch.status = updates.status;

    await ctx.db.patch(webhookId, patch);
    return { success: true };
  },
});

export const deleteWebhook = mutation({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, { webhookId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const webhook = await ctx.db.get(webhookId);
    if (!webhook || webhook.userId !== userId) throw new Error("Webhook not found");

    await ctx.db.delete(webhookId);
    return { success: true };
  },
});

/* ═══════════════════════════════════════════════════════════════
   WEBHOOK DELIVERY LOGS
   ═══════════════════════════════════════════════════════════════ */

export const getDeliveryLogs = query({
  args: { webhookId: v.optional(v.id("webhooks")), limit: v.optional(v.number()) },
  handler: async (ctx, { webhookId, limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const n = limit ?? 50;

    if (webhookId) {
      // Verify ownership
      const wh = await ctx.db.get(webhookId);
      if (!wh || wh.userId !== userId) return [];
      return await ctx.db
        .query("webhookDeliveries")
        .withIndex("by_webhookId", (q) => q.eq("webhookId", webhookId))
        .order("desc")
        .take(n);
    }

    return await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(n);
  },
});
