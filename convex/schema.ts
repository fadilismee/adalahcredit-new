import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  /* ═══════════════════════════════════════════════════════════════
     USER PROFILES (extends auth users)
     ═══════════════════════════════════════════════════════════════ */
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    role: v.union(v.literal("user"), v.literal("admin")),
    avatar: v.optional(v.string()),
    onboardingCompleted: v.boolean(),
    referralCode: v.string(),
    referredBy: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_referralCode", ["referralCode"]),

  /* ═══════════════════════════════════════════════════════════════
     API KEYS
     ═══════════════════════════════════════════════════════════════ */
  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    keyPrefix: v.string(),       // "sk-ac-...abc" (visible part)
    keyHash: v.string(),          // sha256 of full key (for lookup)
    status: v.union(v.literal("active"), v.literal("revoked"), v.literal("expired")),
    rateLimit: v.number(),        // requests per minute
    monthlyLimit: v.optional(v.number()),
    allowedModels: v.optional(v.array(v.string())),
    allowedIPs: v.optional(v.array(v.string())),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_keyHash", ["keyHash"])
    .index("by_status", ["status"]),

  /* ═══════════════════════════════════════════════════════════════
     USAGE LOGS — each API request
     ═══════════════════════════════════════════════════════════════ */
  usageLogs: defineTable({
    userId: v.id("users"),
    apiKeyId: v.id("apiKeys"),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    latencyMs: v.number(),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("rate_limited")),
    errorMessage: v.optional(v.string()),
    cost: v.number(),             // in USD cents
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_apiKeyId", ["apiKeyId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  /* ═══════════════════════════════════════════════════════════════
     DAILY USAGE AGGREGATES — for charts
     ═══════════════════════════════════════════════════════════════ */
  dailyUsage: defineTable({
    userId: v.id("users"),
    date: v.string(),             // "2026-06-13"
    totalRequests: v.number(),
    successCount: v.number(),
    errorCount: v.number(),
    totalInputTokens: v.number(),
    totalOutputTokens: v.number(),
    totalCost: v.number(),        // USD cents
    avgLatencyMs: v.number(),
    modelBreakdown: v.array(v.object({
      model: v.string(),
      provider: v.string(),
      requests: v.number(),
      cost: v.number(),
    })),
  })
    .index("by_userId_date", ["userId", "date"]),

  /* ═══════════════════════════════════════════════════════════════
     PLANS / SUBSCRIPTIONS
     ═══════════════════════════════════════════════════════════════ */
  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("past_due"), v.literal("cancelled")),
    monthlyCredits: v.number(),   // USD cents — included with plan each cycle
    usedCredits: v.number(),      // USD cents used this period (from plan credits)
    balance: v.optional(v.number()),   // USD cents — PAYG top-up balance (never resets)
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelledAt: v.optional(v.number()),
    autoRenew: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  /* ═══════════════════════════════════════════════════════════════
     SUBSCRIPTION ORDERS — plan purchase/upgrade/renewal via confirmation
     ═══════════════════════════════════════════════════════════════ */
  subscriptionOrders: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("new"), v.literal("upgrade"), v.literal("renewal"), v.literal("topup")),
    plan: v.optional(v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise"))),
    amountIdr: v.number(),           // amount in IDR
    creditAmountCents: v.optional(v.number()),  // for topup: USD cents to add
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),          // user uploaded proof
      v.literal("confirmed"),     // admin confirmed
      v.literal("rejected"),
      v.literal("expired")
    ),
    paymentMethod: v.optional(v.string()),
    proofImageUrl: v.optional(v.string()),
    adminNote: v.optional(v.string()),
    confirmedBy: v.optional(v.id("users")),
    confirmedAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_userId_status", ["userId", "status"]),

  /* ═══════════════════════════════════════════════════════════════
     TRANSACTIONS / BILLING
     ═══════════════════════════════════════════════════════════════ */
  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("charge"), v.literal("credit"), v.literal("refund"), v.literal("referral_bonus")),
    amount: v.number(),           // USD cents
    description: v.string(),
    status: v.union(v.literal("completed"), v.literal("pending"), v.literal("failed")),
    stripePaymentId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  /* ═══════════════════════════════════════════════════════════════
     TEAMS
     ═══════════════════════════════════════════════════════════════ */
  teams: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    createdAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member"), v.literal("viewer")),
    invitedBy: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_teamId", ["teamId"])
    .index("by_userId", ["userId"]),

  /* ═══════════════════════════════════════════════════════════════
     WEBHOOKS
     ═══════════════════════════════════════════════════════════════ */
  webhooks: defineTable({
    userId: v.id("users"),
    url: v.string(),
    events: v.array(v.string()),  // ["usage.limit_reached", "key.created", ...]
    status: v.union(v.literal("active"), v.literal("disabled")),
    secret: v.string(),
    lastTriggeredAt: v.optional(v.number()),
    failCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  /* ═══════════════════════════════════════════════════════════════
     REFERRALS
     ═══════════════════════════════════════════════════════════════ */
  referrals: defineTable({
    referrerId: v.id("users"),
    referredUserId: v.id("users"),
    referredEmail: v.string(),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("expired")),
    rewardCents: v.number(),
    paidOut: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_referrerId", ["referrerId"])
    .index("by_referredUserId", ["referredUserId"]),

  /* ═══════════════════════════════════════════════════════════════
     PAYMENT GATEWAY SETTINGS (admin configures)
     ═══════════════════════════════════════════════════════════════ */
  paymentGateways: defineTable({
    gateway: v.union(v.literal("duitku"), v.literal("tripay"), v.literal("manual_qris")),
    enabled: v.boolean(),
    displayName: v.string(),
    // Duitku config
    merchantCode: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    callbackUrl: v.optional(v.string()),
    // Tripay config
    tripayApiKey: v.optional(v.string()),
    tripayPrivateKey: v.optional(v.string()),
    tripayMerchantCode: v.optional(v.string()),
    // Manual QRIS config
    qrisImageUrl: v.optional(v.string()),
    qrisAccountName: v.optional(v.string()),
    qrisInstructions: v.optional(v.string()),
    // Sandbox/production
    sandbox: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_gateway", ["gateway"]),

  /* ═══════════════════════════════════════════════════════════════
     PAYMENT ORDERS (user top-ups)
     ═══════════════════════════════════════════════════════════════ */
  paymentOrders: defineTable({
    userId: v.id("users"),
    gateway: v.union(v.literal("duitku"), v.literal("tripay"), v.literal("manual_qris")),
    amount: v.number(),             // IDR
    creditAmount: v.number(),       // USD cents to be credited
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("confirmed"),
      v.literal("expired"),
      v.literal("failed")
    ),
    // Gateway-specific ref
    externalRef: v.optional(v.string()),    // payment reference from gateway
    paymentUrl: v.optional(v.string()),     // redirect URL for payment
    paymentMethod: v.optional(v.string()),  // e.g. "QRIS", "VA_BCA", etc.
    // Manual QRIS proof
    proofImageUrl: v.optional(v.string()),
    adminNote: v.optional(v.string()),
    confirmedBy: v.optional(v.id("users")),
    confirmedAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_externalRef", ["externalRef"]),

  /* ═══════════════════════════════════════════════════════════════
     AI PROVIDER CONFIGS (admin connects providers)
     ═══════════════════════════════════════════════════════════════ */
  providerConfigs: defineTable({
    provider: v.string(),           // "openai", "anthropic", "google", etc.
    displayName: v.string(),
    enabled: v.boolean(),
    authType: v.union(
      v.literal("api_key"),
      v.literal("oauth"),
      v.literal("cookie"),
      v.literal("free"),
      v.literal("device_code"),
      v.literal("service_account")
    ),
    tier: v.optional(v.union(
      v.literal("subscription"),    // OAuth/subscription-based (Claude Code, Codex, Copilot)
      v.literal("api_key"),         // Standard API key providers
      v.literal("cheap"),           // Budget API key providers
      v.literal("free")             // Free providers (no auth or free tier)
    )),
    apiKey: v.optional(v.string()),
    apiKeys: v.optional(v.array(v.string())),  // multiple keys for load balancing
    apiSecret: v.optional(v.string()),
    baseUrl: v.optional(v.string()),       // custom endpoint URL
    orgId: v.optional(v.string()),
    projectId: v.optional(v.string()),
    // OAuth config
    oauthClientId: v.optional(v.string()),
    oauthClientSecret: v.optional(v.string()),
    oauthAuthUrl: v.optional(v.string()),
    oauthTokenUrl: v.optional(v.string()),
    oauthScopes: v.optional(v.array(v.string())),
    oauthAccessToken: v.optional(v.string()),
    oauthRefreshToken: v.optional(v.string()),
    oauthExpiresAt: v.optional(v.number()),
    // Cookie/session config
    sessionCookie: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    cookieExpiresAt: v.optional(v.number()),
    // Quota tracking
    quotaLimit: v.optional(v.number()),        // max requests/tokens per period
    quotaUsed: v.optional(v.number()),         // used this period
    quotaResetAt: v.optional(v.number()),      // when quota resets
    quotaType: v.optional(v.union(
      v.literal("requests_per_minute"),
      v.literal("requests_per_day"),
      v.literal("tokens_per_month"),
      v.literal("requests_per_5h"),
      v.literal("unlimited")
    )),
    // Category & capabilities
    category: v.optional(v.string()),     // "apikey", "oauth", "free", "aggregator", "enterprise", "local", "ide"
    serviceKinds: v.optional(v.array(v.string())), // "llm", "image", "embedding", "tts", "stt", "video", "search"
    iconUrl: v.optional(v.string()),      // provider logo URL
    website: v.optional(v.string()),      // provider website
    // Fallback config
    fallbackPriority: v.optional(v.number()),  // lower = higher priority in fallback chain
    models: v.array(v.object({
      modelId: v.string(),         // e.g. "gpt-4o"
      displayName: v.string(),
      enabled: v.boolean(),
      inputPricePer1M: v.number(), // Cost from provider (USD per 1M tokens)
      outputPricePer1M: v.number(),// Cost from provider
      sellInputPer1M: v.optional(v.number()),  // Sell price to user (IDR per 1M tokens), if empty = auto from markup
      sellOutputPer1M: v.optional(v.number()), // Sell price to user (IDR per 1M tokens)
      maxTokens: v.number(),
      rateLimit: v.number(),       // RPM
      tier: v.optional(v.string()),  // "free" | "starter" | "pro" | "ultimate" — which plan tier can access
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider", ["provider"])
    .index("by_tier", ["tier"]),

  /* ═══════════════════════════════════════════════════════════════
     PRICING CONFIG (global markup settings)
     ═══════════════════════════════════════════════════════════════ */
  pricingConfig: defineTable({
    key: v.string(),               // "global"
    markupPercent: v.number(),     // e.g. 30 = 30% markup over cost
    usdToIdr: v.number(),         // e.g. 16500
    minMarkupIdr: v.number(),     // minimum markup per 1M tokens in IDR
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  /* ═══════════════════════════════════════════════════════════════
     SUBSCRIPTION PLANS (Rupiah-based)
     ═══════════════════════════════════════════════════════════════ */
  subscriptionPlans: defineTable({
    planId: v.string(),            // "free", "starter", "pro", "enterprise"
    name: v.string(),
    priceIdr: v.number(),          // Monthly price in IDR
    creditsCents: v.optional(v.number()),      // Monthly included credits in USD cents
    creditsIdr: v.optional(v.number()),        // LEGACY — kept for migration compat
    maxKeys: v.number(),
    rateLimit: v.optional(v.number()),         // RPM per key
    dailyRequestLimit: v.optional(v.number()), // Max requests per day (0 = unlimited)
    modelTier: v.optional(v.string()),         // "free", "starter", "pro", "ultimate"
    allowedModelTiers: v.optional(v.array(v.string())), // ["free"], ["free","starter"], etc.
    features: v.array(v.string()),
    popular: v.boolean(),
    enabled: v.boolean(),
    sortOrder: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_planId", ["planId"]),

  /* ═══════════════════════════════════════════════════════════════
     SYSTEM STATUS (for status page)
     ═══════════════════════════════════════════════════════════════ */
  serviceStatus: defineTable({
    serviceName: v.string(),
    status: v.union(v.literal("operational"), v.literal("degraded"), v.literal("partial_outage"), v.literal("major_outage")),
    uptimePercent: v.number(),
    lastCheckedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_serviceName", ["serviceName"]),

  incidents: defineTable({
    title: v.string(),
    severity: v.union(v.literal("minor"), v.literal("major"), v.literal("critical")),
    status: v.union(v.literal("investigating"), v.literal("identified"), v.literal("monitoring"), v.literal("resolved")),
    affectedServices: v.array(v.string()),
    updates: v.array(v.object({
      message: v.string(),
      status: v.string(),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  webhookDeliveries: defineTable({
    webhookId: v.id("webhooks"),
    userId: v.id("users"),
    event: v.string(),
    payload: v.string(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    statusCode: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    latencyMs: v.optional(v.number()),
    attempt: v.number(),
    createdAt: v.number(),
  })
    .index("by_webhookId", ["webhookId"])
    .index("by_userId", ["userId", "createdAt"]),

  /* ═══════════════════════════════════════════════════════════════
     AUDIT LOG — admin/system action history
     ═══════════════════════════════════════════════════════════════ */
  auditLogs: defineTable({
    actorId: v.optional(v.id("users")),   // null = system
    action: v.string(),                    // e.g. "payment.confirmed", "provider.toggled"
    resource: v.string(),                  // e.g. "paymentOrders", "providerConfigs"
    resourceId: v.optional(v.string()),
    details: v.optional(v.string()),       // JSON string of change details
    ip: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actorId", ["actorId", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_resource", ["resource", "createdAt"]),

  /* ═══════════════════════════════════════════════════════════════
     BLOG POSTS
     ═══════════════════════════════════════════════════════════════ */
  blogPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),             // markdown
    coverImage: v.optional(v.string()),
    author: v.string(),
    tags: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status", "publishedAt"]),

  /* ═══════════════════════════════════════════════════════════════
     CHANGELOG ENTRIES
     ═══════════════════════════════════════════════════════════════ */
  changelogEntries: defineTable({
    version: v.string(),
    title: v.string(),
    content: v.string(),             // markdown
    type: v.union(v.literal("feature"), v.literal("improvement"), v.literal("fix"), v.literal("breaking")),
    publishedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_publishedAt", ["publishedAt"]),

  /* ═══════════════════════════════════════════════════════════════
     SUPPORT TICKETS
     ═══════════════════════════════════════════════════════════════ */
  supportTickets: defineTable({
    userId: v.optional(v.id("users")),
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    message: v.string(),
    category: v.union(v.literal("billing"), v.literal("technical"), v.literal("general"), v.literal("bug"), v.literal("feature_request")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    assignedTo: v.optional(v.id("users")),
    replies: v.array(v.object({
      from: v.union(v.literal("user"), v.literal("admin")),
      message: v.string(),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId", "createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_email", ["email"]),

  /* ═══════════════════════════════════════════════════════════════
     ERROR LOG — production error tracking
     ═══════════════════════════════════════════════════════════════ */
  errorLogs: defineTable({
    source: v.string(),              // "proxy", "webhook", "payment", etc.
    level: v.union(v.literal("error"), v.literal("warn"), v.literal("info")),
    message: v.string(),
    stack: v.optional(v.string()),
    metadata: v.optional(v.string()), // JSON
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_source", ["source", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  /* ═══════════════════════════════════════════════════════════════
     MODEL ALIASES — users can map custom names to real models
     ═══════════════════════════════════════════════════════════════ */
  modelAliases: defineTable({
    userId: v.id("users"),
    alias: v.string(),              // "my-gpt" → maps to real model
    targetModel: v.string(),        // "gpt-4o"
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_alias", ["userId", "alias"]),

  /* ═══════════════════════════════════════════════════════════════
     SPENDING ALERTS — per-key or per-user budget limits
     ═══════════════════════════════════════════════════════════════ */
  spendingAlerts: defineTable({
    userId: v.id("users"),
    apiKeyId: v.optional(v.id("apiKeys")),  // null = account-wide
    limitCents: v.number(),                  // monthly spending cap in USD cents
    currentSpendCents: v.number(),           // current period spend
    periodStart: v.number(),                 // period start timestamp
    action: v.union(
      v.literal("warn"),                     // just notify
      v.literal("block")                     // block requests
    ),
    notifiedAt: v.optional(v.number()),      // last notification sent
    enabled: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_apiKeyId", ["apiKeyId"]),

  /* ═══════════════════════════════════════════════════════════════
     NOTIFICATIONS — in-app notification center
     ═══════════════════════════════════════════════════════════════ */
  notifications: defineTable({
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
    read: v.boolean(),
    actionUrl: v.optional(v.string()),   // link to relevant page
    metadata: v.optional(v.string()),    // JSON extra data
    createdAt: v.number(),
  })
    .index("by_userId", ["userId", "createdAt"])
    .index("by_userId_read", ["userId", "read"]),

  responseCache: defineTable({
    requestHash: v.string(),       // SHA-256 of model + messages JSON
    model: v.string(),
    responseJson: v.string(),      // cached response body
    inputTokens: v.number(),
    outputTokens: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),         // TTL
    hitCount: v.number(),
  })
    .index("by_requestHash", ["requestHash"])
    .index("by_expiresAt", ["expiresAt"]),

  /* ═══════════════════════════════════════════════════════════════
     PROVIDER OAUTH STATES — tracks pending OAuth flows
     ═══════════════════════════════════════════════════════════════ */
  providerOAuthStates: defineTable({
    state: v.string(),             // random CSRF token
    provider: v.string(),          // provider slug (e.g., "github-copilot")
    userId: v.optional(v.string()), // admin who initiated the flow
    createdAt: v.number(),
    expiresAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
  })
    .index("by_state", ["state"])
    .index("by_expiresAt", ["expiresAt"]),
  /* ═══════════════════════════════════════════════════════════════
     PROVIDER CONNECTIONS — OAuth tokens & API keys for AI providers
     Ported from OmniRoute: connectionPersistence.ts
     ═══════════════════════════════════════════════════════════════ */
  providerConnections: defineTable({
    provider: v.string(),          // provider slug (e.g., "claude", "codex", "github")
    authType: v.string(),          // "oauth" | "api_key" | "import_token"
    label: v.optional(v.string()), // human label (email, display name, or custom)
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    expiresAt: v.optional(v.string()),    // ISO 8601 expiry
    expiresIn: v.optional(v.number()),
    scope: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    projectId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),    // whether connection is active
    testStatus: v.optional(v.string()),   // "active" | "expired" | "error" | "untested"
    rateLimitedUntil: v.optional(v.number()), // timestamp ms for rate limit cooldown
    lastUsedAt: v.optional(v.number()),   // timestamp ms when last used for proxy
    providerSpecificData: v.optional(v.any()),  // provider-specific extra data
    userId: v.optional(v.string()),       // which admin/user created this connection
    // ── KeiRouter import: multi-account + resilience fields ──
    priority: v.optional(v.number()),          // lower = higher priority (default 100)
    backoffLevel: v.optional(v.number()),      // exponential backoff level (0 = none)
    needsReconnect: v.optional(v.boolean()),   // true when refresh permanently failed
    lastTestAt: v.optional(v.number()),        // timestamp ms of last connection test
    lastTestResult: v.optional(v.string()),    // "ok" | "error"
    lastTestMessage: v.optional(v.string()),   // error message from last test
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider", ["provider"])
    .index("by_provider_email", ["provider", "email"])
    .index("by_provider_isActive", ["provider", "isActive"])
    .index("by_provider_priority", ["provider", "priority"])
    .index("by_testStatus", ["testStatus"])
    .index("by_needsReconnect", ["needsReconnect"]),

  // ── Routing state for round-robin + smart routing ──────────
  routingState: defineTable({
    scopeKey: v.string(),              // unique key for rotation scope
    stateType: v.string(),             // "chain" | "target" | "affinity"
    lastIndex: v.optional(v.number()), // cursor position
    hitCount: v.optional(v.number()),  // consecutive hits on current
    accountId: v.optional(v.string()), // affinity target account
    expiresAt: v.optional(v.number()), // affinity TTL
    updatedAt: v.number(),
  })
    .index("by_scopeKey", ["scopeKey"])
    .index("by_stateType", ["stateType"]),
});

export default schema;
