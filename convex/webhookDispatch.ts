import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Fire a webhook event to all matching user webhooks.
 * Called from mutations via ctx.scheduler.runAfter(0, internal.webhookDispatch.fire, { ... })
 */
export const fire = internalAction({
  args: {
    userId: v.id("users"),
    event: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Get all active webhooks for user that subscribe to this event
    const webhooks = await ctx.runQuery(internal.webhookDispatch.getMatchingWebhooks, {
      userId: args.userId,
      event: args.event,
    });

    for (const wh of webhooks) {
      const body = JSON.stringify({
        event: args.event,
        timestamp: Date.now(),
        data: args.payload,
      });

      // Create HMAC signature
      const encoder = new TextEncoder();
      const keyData = encoder.encode(wh.secret);
      const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const signature = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");

      const start = Date.now();
      let statusCode: number | undefined;
      let responseBody: string | undefined;
      let errorMessage: string | undefined;
      let status: "success" | "failed" = "success";

      try {
        const res = await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": args.event,
            "User-Agent": "AdalahCredit-Webhook/1.0",
          },
          body,
          signal: AbortSignal.timeout(10000),
        });
        statusCode = res.status;
        responseBody = (await res.text()).slice(0, 500);
        if (!res.ok) {
          status = "failed";
          errorMessage = `HTTP ${res.status}`;
        }
      } catch (err: any) {
        status = "failed";
        errorMessage = err.message || "Network error";
      }

      const latencyMs = Date.now() - start;

      // Log delivery
      await ctx.runMutation(internal.webhookDispatch.logDelivery, {
        webhookId: wh._id,
        userId: args.userId,
        event: args.event,
        payload: body,
        status,
        statusCode,
        responseBody,
        errorMessage,
        latencyMs,
      });

      // Update webhook fail count
      if (status === "failed") {
        await ctx.runMutation(internal.webhookDispatch.incrementFailCount, {
          webhookId: wh._id,
        });
      } else {
        await ctx.runMutation(internal.webhookDispatch.resetFailCount, {
          webhookId: wh._id,
        });
      }
    }
  },
});

/** Get webhooks matching event for user */
import { internalQuery } from "./_generated/server";

export const getMatchingWebhooks = internalQuery({
  args: { userId: v.id("users"), event: v.string() },
  handler: async (ctx, args) => {
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return webhooks.filter((w) => w.events.includes(args.event) || w.events.includes("*"));
  },
});

/** Log a webhook delivery */
export const logDelivery = internalMutation({
  args: {
    webhookId: v.id("webhooks"),
    userId: v.id("users"),
    event: v.string(),
    payload: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    statusCode: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    latencyMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookDeliveries", {
      ...args,
      attempt: 1,
      createdAt: Date.now(),
    });
  },
});

/** Increment webhook fail count (disable after 10 consecutive failures) */
export const incrementFailCount = internalMutation({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    const wh = await ctx.db.get(args.webhookId);
    if (!wh) return;
    const newCount = wh.failCount + 1;
    await ctx.db.patch(args.webhookId, {
      failCount: newCount,
      lastTriggeredAt: Date.now(),
      ...(newCount >= 10 ? { status: "disabled" as const } : {}),
    });
  },
});

/** Reset fail count on success */
export const resetFailCount = internalMutation({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.webhookId, {
      failCount: 0,
      lastTriggeredAt: Date.now(),
    });
  },
});
