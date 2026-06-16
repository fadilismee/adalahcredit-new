import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/adminGuard";

/** List changelog entries (public, newest first) */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("changelogEntries")
      .withIndex("by_publishedAt")
      .order("desc")
      .take(100);
  },
});

/** Create changelog entry (admin only) */
export const create = mutation({
  args: {
    version: v.string(),
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("feature"), v.literal("improvement"), v.literal("fix"), v.literal("breaking")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    return ctx.db.insert("changelogEntries", {
      ...args,
      publishedAt: now,
      createdAt: now,
    });
  },
});

/** Update changelog entry (admin only) */
export const update = mutation({
  args: {
    id: v.id("changelogEntries"),
    version: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(v.union(v.literal("feature"), v.literal("improvement"), v.literal("fix"), v.literal("breaking"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

/** Delete changelog entry (admin only) */
export const deleteEntry = mutation({
  args: { id: v.id("changelogEntries") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
