import type { QueryCtx, MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";

/**
 * Verify that the current user is an admin.
 * Returns userId if admin, throws if not.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required");
  }

  return userId as Id<"users">;
}

/**
 * Check if the current user is an admin (non-throwing).
 * Returns userId if admin, null otherwise.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<Id<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  if (!profile || profile.role !== "admin") return null;

  return userId as Id<"users">;
}
