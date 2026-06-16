import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* ═══════════════════════════════════════════════════════════════
   TEAM QUERIES
   ═══════════════════════════════════════════════════════════════ */

export const getMyTeam = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Check if user is a member of any team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!membership) return null;

    const team = await ctx.db.get(membership.teamId);
    if (!team) return null;

    // Get all members
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", team._id))
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (m) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", m.userId))
          .unique();
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          displayName: profile?.displayName ?? "Unknown",
          email: user?.email ?? "",
          avatar: profile?.avatar,
        };
      })
    );

    return {
      ...team,
      members: memberDetails,
      myRole: membership.role,
    };
  },
});

/* ═══════════════════════════════════════════════════════════════
   TEAM MUTATIONS
   ═══════════════════════════════════════════════════════════════ */

export const createTeam = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const teamId = await ctx.db.insert("teams", {
      name,
      ownerId: userId,
      plan: profile?.plan ?? "free",
      createdAt: Date.now(),
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "owner",
      invitedBy: userId,
      joinedAt: Date.now(),
    });

    return teamId;
  },
});

export const inviteMember = mutation({
  args: {
    teamId: v.id("teams"),
    userEmail: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, { teamId, userEmail, role: _role }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check permissions
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
      .collect();

    const myMembership = membership.find((m) => m.userId === userId);
    if (!myMembership || (myMembership.role !== "owner" && myMembership.role !== "admin")) {
      throw new Error("Only team owners and admins can invite members");
    }

    // In real app: send invite email, for now just return success
    return { success: true, message: `Invite sent to ${userEmail}` };
  },
});

export const removeMember = mutation({
  args: {
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, { memberId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");

    // Check that current user is owner/admin of the team
    const myMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", member.teamId))
      .collect()
      .then((ms) => ms.find((m) => m.userId === userId));

    if (!myMembership || (myMembership.role !== "owner" && myMembership.role !== "admin")) {
      throw new Error("Insufficient permissions");
    }

    if (member.role === "owner") {
      throw new Error("Cannot remove team owner");
    }

    await ctx.db.delete(memberId);
    return { success: true };
  },
});

export const updateMemberRole = mutation({
  args: {
    memberId: v.id("teamMembers"),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, { memberId, role }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");

    const myMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", member.teamId))
      .collect()
      .then((ms) => ms.find((m) => m.userId === userId));

    if (!myMembership || myMembership.role !== "owner") {
      throw new Error("Only team owner can change roles");
    }

    await ctx.db.patch(memberId, { role });
    return { success: true };
  },
});
