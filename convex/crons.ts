import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired response cache entries — every 10 minutes
crons.interval(
  "cleanup expired cache",
  { minutes: 10 },
  internal.cronTasks.cleanupExpiredCache
);

// Expire old API keys — every hour
crons.interval(
  "expire old API keys",
  { hours: 1 },
  internal.cronTasks.expireApiKeys
);

// Aggregate daily usage — every day at 00:05 UTC
crons.cron(
  "aggregate daily usage",
  "5 0 * * *",
  internal.cronTasks.aggregateDailyUsage
);

// Clean up old error logs (>30 days) — daily
crons.cron(
  "cleanup old error logs",
  "30 0 * * *",
  internal.cronTasks.cleanupOldErrorLogs
);

// Update provider health status — every 5 minutes
crons.interval(
  "provider health check",
  { minutes: 5 },
  internal.cronTasks.checkProviderHealth
);

// KeepAlive: proactively refresh OAuth tokens — every 30 minutes
// (from KeiRouter: oauth/keepalive.go)
crons.interval(
  "keepalive oauth refresh",
  { minutes: 30 },
  internal.cronTasks.keepAliveRefresh
);

// Clear expired cooldowns — every 5 minutes
crons.interval(
  "clear expired cooldowns",
  { minutes: 5 },
  internal.cronTasks.clearExpiredCooldowns
);

export default crons;
