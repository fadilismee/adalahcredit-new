import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { sanitizeText, isValidEmail } from "./lib/validate";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./lib/adminGuard";

/** Submit a support ticket (public — but validated) */
export const submitTicket = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    message: v.string(),
    category: v.union(v.literal("billing"), v.literal("technical"), v.literal("general"), v.literal("bug"), v.literal("feature_request")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Validate & sanitize inputs
    if (!isValidEmail(args.email)) throw new Error("Invalid email address");
    const name = sanitizeText(args.name, 100);
    const subject = sanitizeText(args.subject, 200);
    const message = sanitizeText(args.message, 5000);
    if (!name || !subject || !message) throw new Error("All fields are required");

    const now = Date.now();
    return ctx.db.insert("supportTickets", {
      userId: args.userId,
      email: args.email.trim().toLowerCase(),
      name,
      subject,
      message,
      category: args.category,
      priority: "medium",
      status: "open",
      replies: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** List my tickets (authenticated user — matches by userId, not email) */
export const getMyTickets = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    // Only return tickets belonging to this user (by email match)
    const user = await ctx.db.get(userId);
    if (!user || user.email !== args.email) return [];
    return ctx.db
      .query("supportTickets")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(20);
  },
});

/** List all tickets (admin only) */
export const listAll = query({
  args: { status: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 50;
    if (args.status) {
      return ctx.db
        .query("supportTickets")
        .withIndex("by_status", (q) => q.eq("status", args.status as "open" | "in_progress" | "resolved" | "closed"))
        .order("desc")
        .take(limit);
    }
    return ctx.db.query("supportTickets").order("desc").take(limit);
  },
});

/** Update ticket status (admin only) */
export const updateStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/** Reply to ticket (admin only for admin replies; user replies need auth) */
export const addReply = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    message: v.string(),
    from: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    if (args.from === "admin") {
      await requireAdmin(ctx);
    } else {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");
    }
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const replies = [...ticket.replies, {
      from: args.from,
      message: args.message,
      timestamp: Date.now(),
    }];

    await ctx.db.patch(args.ticketId, {
      replies,
      status: args.from === "admin" ? "in_progress" : ticket.status,
      updatedAt: Date.now(),
    });
  },
});
