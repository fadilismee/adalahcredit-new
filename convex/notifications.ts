import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/* ═══════════════════════════════════════════════════════════════
   QUERIES
   ═══════════════════════════════════════════════════════════════ */

/** FIX L9: Added pagination support */
export const listMyNotifications = query({
  args: { limit: v.optional(v.number()), cursor: v.optional(v.number()) },
  handler: async (ctx, { limit, cursor }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let q = ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc");

    if (cursor) {
      q = q.filter((qb) => qb.lt(qb.field("createdAt"), cursor));
    }

    return await q.take(limit ?? 50);
  },
});

/** Count unread notifications */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    return unread.length;
  },
});

/* ═══════════════════════════════════════════════════════════════
   MUTATIONS (user-facing)
   ═══════════════════════════════════════════════════════════════ */

/** Mark a single notification as read */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const n = await ctx.db.get(notificationId);
    if (!n || n.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(notificationId, { read: true });
  },
});

/** Mark all notifications as read */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

/** Delete a single notification */
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const n = await ctx.db.get(notificationId);
    if (!n || n.userId !== userId) throw new Error("Not found");

    await ctx.db.delete(notificationId);
  },
});

/** Clear all notifications */
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const all = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const n of all) {
      await ctx.db.delete(n._id);
    }
  },
});

/* ═══════════════════════════════════════════════════════════════
   INTERNAL MUTATIONS (called from other backend functions)
   ═══════════════════════════════════════════════════════════════ */

/** Create a notification (internal use) */
export const _create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("spending_alert"),
      v.literal("key_expiry"),
      v.literal("usage_milestone"),
      v.literal("system"),
      v.literal("admin_broadcast"),
      v.literal("welcome"),
      v.literal("payment"),
      v.literal("security")
    ),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

/** Send a welcome notification on first login */
export const _sendWelcome = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Check if already sent
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("type"), "welcome"))
      .first();
    if (existing) return;

    await ctx.db.insert("notifications", {
      userId,
      type: "welcome",
      title: "Selamat Datang di AdalahCredit! 🎉",
      message: "Akun kamu sudah aktif dengan $5.00 credit gratis. Buat API key pertamamu untuk mulai menggunakan 370+ model AI.",
      read: false,
      actionUrl: "/dashboard",
      createdAt: Date.now(),
    });
  },
});

/** Admin: broadcast to all users */
export const adminBroadcast = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, { title, message, actionUrl }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");

    // Get all users
    const profiles = await ctx.db.query("profiles").collect();
    let count = 0;
    for (const p of profiles) {
      await ctx.db.insert("notifications", {
        userId: p.userId,
        type: "admin_broadcast",
        title,
        message,
        read: false,
        actionUrl,
        createdAt: Date.now(),
      });
      count++;
    }

    return { sent: count };
  },
});
