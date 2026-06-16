import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/adminGuard";

/** Helper: log an error from any mutation context */
export async function logError(
  ctx: MutationCtx,
  args: {
    source: string;
    level?: "error" | "warn" | "info";
    message: string;
    stack?: string;
    metadata?: Record<string, unknown>;
    userId?: Id<"users">;
  }
) {
  await ctx.db.insert("errorLogs", {
    source: args.source,
    level: args.level ?? "error",
    message: args.message,
    stack: args.stack,
    metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
    userId: args.userId,
    createdAt: Date.now(),
  });
}

/** Internal mutation for logging from actions */
export const logErrorMutation = internalMutation({
  args: {
    source: v.string(),
    level: v.union(v.literal("error"), v.literal("warn"), v.literal("info")),
    message: v.string(),
    stack: v.optional(v.string()),
    metadata: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("errorLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/** Query: list recent errors (admin only) */
export const listErrors = query({
  args: {
    limit: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 50;
    if (args.source) {
      const source = args.source;
      return ctx.db
        .query("errorLogs")
        .withIndex("by_source", (q) => q.eq("source", source))
        .order("desc")
        .take(limit);
    }
    return ctx.db
      .query("errorLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});
