import { v } from "convex/values";
import { query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/adminGuard";

/** Helper: write an audit log entry from within any mutation */
export async function writeAuditLog(
  ctx: MutationCtx,
  args: {
    actorId?: Id<"users">;
    action: string;
    resource: string;
    resourceId?: string;
    details?: string;
  }
) {
  await ctx.db.insert("auditLogs", {
    actorId: args.actorId,
    action: args.action,
    resource: args.resource,
    resourceId: args.resourceId,
    details: args.details,
    createdAt: Date.now(),
  });
}

/** Query: list audit logs (admin only) */
export const listAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
    resource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 50;
    if (args.resource) {
      const resource = args.resource;
      return ctx.db
        .query("auditLogs")
        .withIndex("by_resource", (q) => q.eq("resource", resource))
        .order("desc")
        .take(limit);
    }
    return ctx.db
      .query("auditLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});
