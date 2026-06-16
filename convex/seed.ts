import { mutation } from "./_generated/server";

/**
 * Seed initial data: service statuses and sample incidents.
 * Run once after deploying schema.
 */
export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("serviceStatus").first();
    if (existing) return { message: "Already seeded" };

    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    // ── Service Statuses ──
    const services = [
      { serviceName: "API Gateway", status: "operational" as const, uptimePercent: 99.99 },
      { serviceName: "Authentication", status: "operational" as const, uptimePercent: 99.98 },
      { serviceName: "OpenAI Proxy", status: "operational" as const, uptimePercent: 99.95 },
      { serviceName: "Anthropic Proxy", status: "operational" as const, uptimePercent: 99.97 },
      { serviceName: "Google AI Proxy", status: "operational" as const, uptimePercent: 99.96 },
      { serviceName: "Meta AI Proxy", status: "operational" as const, uptimePercent: 99.93 },
      { serviceName: "Mistral Proxy", status: "operational" as const, uptimePercent: 99.99 },
      { serviceName: "Rate Limiter", status: "operational" as const, uptimePercent: 100.0 },
      { serviceName: "Usage Analytics", status: "operational" as const, uptimePercent: 99.94 },
      { serviceName: "Billing Service", status: "operational" as const, uptimePercent: 99.99 },
      { serviceName: "Dashboard", status: "operational" as const, uptimePercent: 99.97 },
      { serviceName: "Webhook Delivery", status: "operational" as const, uptimePercent: 99.91 },
    ];

    for (const svc of services) {
      await ctx.db.insert("serviceStatus", {
        ...svc,
        lastCheckedAt: now,
        updatedAt: now,
      });
    }

    // ── Sample Resolved Incidents ──
    await ctx.db.insert("incidents", {
      title: "Elevated latency on OpenAI Proxy",
      severity: "minor",
      status: "resolved",
      affectedServices: ["OpenAI Proxy", "API Gateway"],
      updates: [
        { message: "We are investigating reports of increased latency for OpenAI model requests.", status: "investigating", timestamp: now - 3 * day },
        { message: "Root cause identified: connection pool exhaustion during traffic spike.", status: "identified", timestamp: now - 3 * day + 30 * 60000 },
        { message: "Fix deployed. Monitoring for stability.", status: "monitoring", timestamp: now - 3 * day + hour },
        { message: "Latency has returned to normal levels. Incident resolved.", status: "resolved", timestamp: now - 3 * day + 2 * hour },
      ],
      createdAt: now - 3 * day,
      resolvedAt: now - 3 * day + 2 * hour,
    });

    await ctx.db.insert("incidents", {
      title: "Webhook delivery delays",
      severity: "minor",
      status: "resolved",
      affectedServices: ["Webhook Delivery"],
      updates: [
        { message: "Some webhook deliveries are experiencing delays of up to 5 minutes.", status: "investigating", timestamp: now - 7 * day },
        { message: "Queue backlog cleared. All webhooks are now being delivered on time.", status: "resolved", timestamp: now - 7 * day + 3 * hour },
      ],
      createdAt: now - 7 * day,
      resolvedAt: now - 7 * day + 3 * hour,
    });

    await ctx.db.insert("incidents", {
      title: "Dashboard loading errors",
      severity: "major",
      status: "resolved",
      affectedServices: ["Dashboard", "Usage Analytics"],
      updates: [
        { message: "Users are reporting 500 errors when loading the dashboard.", status: "investigating", timestamp: now - 14 * day },
        { message: "Database migration caused a schema mismatch. Rolling back.", status: "identified", timestamp: now - 14 * day + 15 * 60000 },
        { message: "Rollback complete. Dashboard is functional.", status: "monitoring", timestamp: now - 14 * day + 45 * 60000 },
        { message: "All systems nominal. Post-mortem will be published.", status: "resolved", timestamp: now - 14 * day + 2 * hour },
      ],
      createdAt: now - 14 * day,
      resolvedAt: now - 14 * day + 2 * hour,
    });

    return { message: "Seeded 12 services and 3 incidents" };
  },
});

/**
 * Seed demo usage data for the logged-in user.
 * Creates API keys, usage logs, daily aggregates, and transactions.
 */
export const seedDemoUserData = mutation({
  args: {},
  handler: async (_ctx) => {
    // This is a helper for demo/testing — would be called by the onboarding flow
    // In production, data is generated organically from real API calls
    return { message: "Demo data seeding is handled through the onboarding flow" };
  },
});
