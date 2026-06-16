# AdalahCredit — Full A-Z Technical Report

> **Unified AI API Gateway & Marketplace**
> Version 1.0 · June 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack](#2-tech-stack)
3. [Logic Structure](#3-logic-structure)
4. [Code Structure](#4-code-structure)
5. [Flow Structure](#5-flow-structure)
6. [Database Schema](#6-database-schema)
7. [API Endpoints](#7-api-endpoints)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Proxy Engine](#9-proxy-engine)
10. [Subscription & Billing Engine](#10-subscription--billing-engine)
11. [OAuth Provider System](#11-oauth-provider-system)
12. [Connection Management](#12-connection-management)
13. [Frontend Pages & Dashboard](#13-frontend-pages--dashboard)
14. [Cron Jobs & Background Tasks](#14-cron-jobs--background-tasks)
15. [Internationalization](#15-internationalization)
16. [Security Measures](#16-security-measures)
17. [Deployment & Infrastructure](#17-deployment--infrastructure)
18. [Project Statistics](#18-project-statistics)
19. [Feature Checklist](#19-feature-checklist)
20. [Appendix: Environment Variables](#20-appendix-environment-variables)

---

## 1. Executive Summary

**AdalahCredit** is a full-stack AI API gateway and marketplace platform that lets users access 300+ AI models from multiple providers through a single unified OpenAI-compatible API. The platform handles authentication, billing, rate limiting, model routing, connection pooling, and multi-provider fallback — all behind one API key.

### Key Capabilities

| Capability | Description |
|---|---|
| **Unified API** | Single OpenAI-compatible endpoint for all providers |
| **Multi-Provider** | 204 providers, 321+ models seeded; 6 actively configured |
| **4-Tier Fallback** | Admin key → OAuth → User connections → Free tier |
| **Proxy Endpoints** | Chat completions, embeddings, images, audio (TTS/STT), moderations |
| **OAuth Connections** | 17 providers (Claude, Codex, OpenAI, Gemini, GitHub, etc.) |
| **Subscription Engine** | 4-tier plans (Free/Starter/Pro/Ultimate) with PAYG credits |
| **Admin Dashboard** | 9 tabs — full system management |
| **User Dashboard** | 10 tabs — keys, usage, billing, team, webhooks, etc. |
| **i18n** | English + Bahasa Indonesia |
| **Dark/Light Mode** | System-aware with manual toggle |

### Live URLs

- **App**: `https://preview-api-gateway-landing-45bd0329.viktor.space`
- **API Base**: `https://blessed-sardine-879.convex.site`
- **Convex Dashboard**: `https://blessed-sardine-879.convex.cloud`

---

## 2. Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 6 | Build tool & dev server |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | Component library |
| Framer Motion | Animations & transitions |
| Recharts | Analytics charts |
| React Router v6 | Client-side routing |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| Convex | Real-time serverless backend |
| Convex Auth | Authentication (email/password + OAuth) |
| HTTP Actions | RESTful API proxy endpoints |
| Internal Queries/Mutations | Secure server-side operations |
| Cron Jobs | Background tasks & scheduled work |

### Infrastructure
| Technology | Purpose |
|---|---|
| Viktor Spaces | Hosting & deployment |
| Convex Cloud | Backend-as-a-Service |
| Bun | Package manager & runtime |

---

## 3. Logic Structure

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                   │
│  React SPA · Tailwind · shadcn/ui · Framer Motion    │
└──────────────┬───────────────────────┬───────────────┘
               │ Convex Client SDK     │ HTTP REST
               ▼                       ▼
┌──────────────────────┐  ┌─────────────────────────────┐
│   CONVEX REALTIME    │  │      CONVEX HTTP ACTIONS     │
│                      │  │                               │
│  queries / mutations │  │  /v1/chat/completions         │
│  subscriptions       │  │  /v1/embeddings               │
│  auth                │  │  /v1/images/generations       │
│                      │  │  /v1/audio/transcriptions     │
│  profiles            │  │  /v1/audio/speech             │
│  apiKeys             │  │  /v1/moderations              │
│  usage               │  │  /v1/models                   │
│  billing             │  │  /api/provider-oauth/*        │
│  subscriptions       │  │  /api/test-provider           │
│  notifications       │  │  /api/test-connection         │
│  teams               │  │                               │
│  webhooks            │  └────────┬──────────────────────┘
│  support             │           │
│  admin               │           ▼
│  analytics           │  ┌────────────────────────┐
└──────────────────────┘  │     PROXY ENGINE       │
                          │                        │
                          │  1. Validate API Key   │
                          │  2. Check credits/plan │
                          │  3. Rate limit         │
                          │  4. Spending limits    │
                          │  5. Resolve model      │
                          │  6. Cache check        │
                          │  7. Build request      │
                          │  8. 4-tier fallback    │
                          │  9. Forward to provider│
                          │ 10. Log usage + cost   │
                          │ 11. Deduct credits     │
                          │ 12. Cache response     │
                          │ 13. Webhook dispatch   │
                          └────────┬───────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │   Groq   │  │  NVIDIA  │  │  Others  │
              │ (4 models)│  │(2 models)│  │ (300+)   │
              └──────────┘  └──────────┘  └──────────┘
```

### 3.2 Authentication Architecture

```
┌────────────────────────────────────────────────────┐
│                 AUTH LAYER                           │
│                                                     │
│  ┌─────────────────┐    ┌────────────────────┐     │
│  │  Email/Password  │    │   OAuth Providers   │     │
│  │  (Convex Auth)   │    │   (17 providers)    │     │
│  └────────┬────────┘    └────────┬───────────┘     │
│           │                      │                   │
│           ▼                      ▼                   │
│  ┌─────────────────────────────────────────┐        │
│  │        Session Management               │        │
│  │  JWT tokens · Refresh tokens            │        │
│  │  Viktor Spaces Auth integration         │        │
│  └────────────────┬────────────────────────┘        │
│                   │                                  │
│           ┌───────┴───────┐                         │
│           ▼               ▼                         │
│    ┌────────────┐  ┌─────────────┐                  │
│    │   Profile   │  │  Admin Guard │                  │
│    │  Creation   │  │  (role check)│                  │
│    │  Onboarding │  │              │                  │
│    └────────────┘  └─────────────┘                  │
└────────────────────────────────────────────────────┘
```

### 3.3 Proxy Request Pipeline

```
User Request
    │
    ▼
[1] Parse & Validate Headers
    │ Extract Authorization: Bearer sk-ac-xxx
    │ Extract model from body
    ▼
[2] Validate API Key (proxyInternal.validateApiKey)
    │ Check key exists, not revoked, not expired
    │ Check IP allowlist if configured
    ▼
[3] Resolve Model (providerAuth.resolveModel)
    │ Dynamic: DB lookup → providerConfigs table
    │ Static: MODEL_PROVIDER_MAP fallback
    │ Apply REAL_MODEL_ID_MAP for provider API names
    ▼
[4] Check Access (subscriptionEngine.checkModelAccess)
    │ Plan tier check (free/starter/pro/ultimate)
    │ Credit balance check
    │ Subscription expiry check
    ▼
[5] Rate Limit (proxyInternal.checkRateLimit)
    │ Per-key RPM enforcement
    ▼
[6] Spending Limit (proxyInternal.checkSpendingLimit)
    │ Monthly spending cap per key
    ▼
[7] Model Alias Resolution (proxyInternal.resolveModelAlias)
    │ User-defined aliases → real model IDs
    ▼
[8] Response Cache Check (proxyInternal.getCachedResponse)
    │ Hash-based deduplication
    │ Return cached if HIT (X-Cache: HIT header)
    ▼
[9] Build Provider Request
    │ Strip internal fields (_reqHash)
    │ Provider-specific builders:
    │   • buildOpenAICompatRequest (Groq, NVIDIA, OpenAI, etc.)
    │   • buildAnthropicRequest
    │   • buildGoogleRequest
    │   • buildCohereRequest
    ▼
[10] 4-Tier Fallback Execution
    │ Tier 1: Admin-configured provider key
    │ Tier 2: OAuth connections (user/admin)
    │ Tier 3: User provider connections
    │ Tier 4: Free-tier providers
    │ Auto-retry on 429/5xx with next tier
    ▼
[11] Forward to Provider
    │ Streaming (SSE) or non-streaming
    │ Provider-specific response conversion
    ▼
[12] Post-Processing
    │ Log usage (proxyInternal.logRequest)
    │ Deduct credits (subscriptionEngine.deductCredits)
    │ Cache response (proxyInternal.setCachedResponse)
    │ Dispatch webhooks (webhookDispatch)
    │ Create notifications if spending threshold hit
    ▼
Response to User (OpenAI-compatible format)
```

### 3.4 Billing & Subscription Logic

```
┌─────────────────────────────────────────────────────┐
│              SUBSCRIPTION ENGINE                     │
│                                                      │
│  Plans: Free → Starter → Pro → Ultimate              │
│                                                      │
│  ┌─────────┐  ┌───────────┐  ┌──────────┐          │
│  │  Free    │  │  Starter  │  │   Pro    │          │
│  │ Rp 0    │  │ Rp 50K   │  │ Rp 200K │          │
│  │ $1 cr   │  │ $10 cr   │  │ $50 cr  │          │
│  │ 2 keys  │  │ 5 keys   │  │ 20 keys │          │
│  │ 10 RPM  │  │ 30 RPM   │  │ 60 RPM  │          │
│  │ 200/day │  │ 2K/day   │  │ 10K/day │          │
│  └─────────┘  └───────────┘  └──────────┘          │
│                                                      │
│  Model Tier Access:                                  │
│  free: free models only                              │
│  starter: free + cheap models                        │
│  pro: free + cheap + standard models                 │
│  ultimate: all models including premium              │
│                                                      │
│  PAYG (Pay-As-You-Go):                              │
│  • Per-request cost = (input_tokens × input_price    │
│    + output_tokens × output_price) × markup          │
│  • Deducted from credit balance                      │
│  • Top-up via manual bank transfer + proof upload    │
│                                                      │
│  Payment Flow:                                       │
│  User creates order → Uploads proof → Admin confirms │
│  → Credits added → Audit log entry                   │
└─────────────────────────────────────────────────────┘
```

---

## 4. Code Structure

### 4.1 Directory Tree

```
adalahcredit/
├── convex/                          # Backend (Convex serverless)
│   ├── _generated/                  # Auto-generated types & API
│   ├── lib/
│   │   ├── adminGuard.ts            # requireAdmin() & isAdmin() helpers
│   │   └── validate.ts              # Input validation utilities
│   │
│   ├── # ── Core Proxy ──
│   ├── proxy.ts                     # Main chat completions handler (927 lines)
│   ├── proxyInternal.ts             # Internal helpers: validate, rate limit, cache (533 lines)
│   ├── proxyConnections.ts          # Connection pool & fallback management (816 lines)
│   ├── proxyEmbeddings.ts           # /v1/embeddings endpoint
│   ├── proxyImages.ts               # /v1/images/generations endpoint
│   ├── proxyAudio.ts                # /v1/audio/transcriptions & /v1/audio/speech (303 lines)
│   ├── proxyModerations.ts          # /v1/moderations endpoint
│   ├── providerAuth.ts              # Model resolution & provider auth (346 lines)
│   ├── providerMeta.ts              # Provider metadata & capabilities (265 lines)
│   │
│   ├── # ── Auth & Users ──
│   ├── auth.ts                      # Convex Auth configuration
│   ├── auth.config.ts               # Auth providers config
│   ├── testAuth.ts                  # Test user authentication
│   ├── profiles.ts                  # User profiles CRUD (211 lines)
│   ├── users.ts                     # Account deletion & management
│   │
│   ├── # ── OAuth System ──
│   ├── oauthConstants.ts            # 17 OAuth provider configs (317 lines)
│   ├── oauthActions.ts              # OAuth flow actions (400 lines)
│   ├── oauthPkce.ts                 # PKCE challenge/verifier
│   ├── oauthProviders.ts            # Provider management (1,034 lines)
│   ├── providerOAuth.ts             # OAuth token management (472 lines)
│   ├── providerConnections.ts       # Connection CRUD (379 lines)
│   │
│   ├── # ── Billing & Subscriptions ──
│   ├── subscriptionEngine.ts        # Full subscription & PAYG engine (941 lines)
│   ├── billing.ts                   # Billing queries & mutations
│   ├── payments.ts                  # Payment orders & proof upload (377 lines)
│   ├── pricing.ts                   # Pricing config & markup (304 lines)
│   │
│   ├── # ── API Keys & Usage ──
│   ├── apiKeys.ts                   # API key CRUD with crypto
│   ├── usage.ts                     # Usage stats & logging (220 lines)
│   ├── analytics.ts                 # Analytics queries (238 lines)
│   ├── spendingLimits.ts            # Per-key spending limits
│   ├── modelAliases.ts              # User model alias management
│   │
│   ├── # ── Admin & Platform ──
│   ├── admin.ts                     # Admin dashboard queries
│   ├── providers.ts                 # Provider config management (781 lines)
│   ├── notifications.ts             # Notification system (205 lines)
│   ├── auditLog.ts                  # Audit trail helper
│   ├── errorLog.ts                  # Error logging
│   │
│   ├── # ── Features ──
│   ├── teamFunctions.ts             # Team management
│   ├── webhookFunctions.ts          # Webhook CRUD
│   ├── webhookDispatch.ts           # Webhook event dispatch
│   ├── referralFunctions.ts         # Referral program
│   ├── supportFunctions.ts          # Support ticket system
│   ├── blogFunctions.ts             # Blog CMS
│   ├── changelogFunctions.ts        # Changelog management
│   ├── statusFunctions.ts           # Service status page
│   │
│   ├── # ── Testing & Tooling ──
│   ├── testConnection.ts            # Connection test HTTP action (262 lines)
│   ├── testProvider.ts              # Provider API key tester
│   ├── viktorTools.ts               # Viktor AI integration
│   │
│   ├── # ── Background Tasks ──
│   ├── cronTasks.ts                 # Cron task implementations (356 lines)
│   ├── crons.ts                     # Cron schedule definitions
│   ├── constants.ts                 # Shared constants
│   │
│   ├── # ── Data Seeding ──
│   ├── seed.ts                      # Base seed data
│   ├── seedProviders.ts             # 204 providers seed (1,659 lines)
│   ├── seedNewProviders.ts          # Additional providers (1,558 lines)
│   ├── seedPhase2.ts                # Phase 2 seed data (1,848 lines)
│   ├── seedPhase3.ts                # Phase 3 seed data (334 lines)
│   ├── seedPayments.ts              # Payment gateway seeds
│   ├── seedTestUser.ts              # Test user accounts (244 lines)
│   ├── migrations.ts                # Data migrations
│   │
│   ├── # ── Infrastructure ──
│   ├── http.ts                      # HTTP router (36 routes) (294 lines)
│   ├── schema.ts                    # Database schema (32 tables) (639 lines)
│   └── ViktorSpacesEmail.ts         # Email integration
│
├── src/                             # Frontend (React SPA)
│   ├── main.tsx                     # App entry point
│   ├── App.tsx                      # Root component
│   ├── vite-env.d.ts                # Vite type declarations
│   │
│   ├── auth/                        # Auth strategy routing
│   │   ├── AuthStrategyRoutes.tsx   # Strategy selector (public/space/viktor)
│   │   ├── convexClient.ts          # Convex client setup
│   │   ├── public/PublicAppRoutes.tsx    # Public auth routes (all 26 pages)
│   │   ├── space-auth/SpaceAuthAppRoutes.tsx
│   │   └── viktor-auth/ViktorAuthAppRoutes.tsx
│   │
│   ├── pages/                       # 26 page components
│   │   ├── PublicLandingPage.tsx     # Landing page (1,131 lines)
│   │   ├── UserDashboard.tsx        # User dashboard - 10 tabs (1,621 lines)
│   │   ├── AdminDashboard.tsx       # Admin dashboard - 9 tabs (2,058 lines)
│   │   ├── PlaygroundPage.tsx       # API playground (868 lines)
│   │   ├── DocsPage.tsx             # Documentation (1,035 lines)
│   │   ├── ModelsPage.tsx           # Model catalog (1,029 lines)
│   │   ├── TopUpPage.tsx            # Top up credits (537 lines)
│   │   ├── ComparePage.tsx          # Model comparison (350 lines)
│   │   ├── OnboardingPage.tsx       # New user onboarding (406 lines)
│   │   ├── SettingsPage.tsx         # User settings (350 lines)
│   │   ├── LoginPage.tsx            # Login
│   │   ├── SignupPage.tsx           # Registration
│   │   ├── OAuthCallbackPage.tsx    # OAuth callback handler
│   │   ├── BlogPage.tsx             # Blog listing
│   │   ├── BlogPostPage.tsx         # Blog post detail (271 lines)
│   │   ├── StatusPage.tsx           # Service status (255 lines)
│   │   ├── SupportPage.tsx          # Support tickets (320 lines)
│   │   ├── SDKsPage.tsx             # SDK & libraries (364 lines)
│   │   ├── ChangelogPage.tsx        # Changelog
│   │   ├── ReferralPage.tsx         # Referral program
│   │   ├── ReceiptPage.tsx          # Payment receipts
│   │   ├── TermsPage.tsx            # Terms of Service
│   │   ├── PrivacyPage.tsx          # Privacy Policy
│   │   ├── NotFoundPage.tsx         # Custom 404
│   │   └── index.ts                 # Re-exports
│   │
│   ├── components/                  # Shared components
│   │   ├── AppLayout.tsx            # Authenticated layout with sidebar
│   │   ├── AppSidebar.tsx           # Navigation sidebar
│   │   ├── PublicLayout.tsx         # Public pages layout
│   │   ├── PublicHeader.tsx         # Public navigation header
│   │   ├── Header.tsx               # App header
│   │   ├── AuthGuard.tsx            # Route auth protection
│   │   ├── AdminGuard.tsx           # Admin role guard
│   │   ├── ProtectedRoute.tsx       # Protected route wrapper
│   │   ├── PublicOnlyRoute.tsx      # Redirect if authenticated
│   │   ├── AnalyticsCharts.tsx      # Dashboard charts (279 lines)
│   │   ├── CodeSnippets.tsx         # Multi-language code generator
│   │   ├── NotificationBell.tsx     # Notification dropdown
│   │   ├── OAuthProviderModal.tsx   # OAuth connection modal (446 lines)
│   │   ├── ThemeToggle.tsx          # Dark/light mode switch
│   │   ├── ErrorBoundary.tsx        # React error boundary
│   │   ├── SignIn.tsx               # Sign in form (360 lines)
│   │   ├── SignUp.tsx               # Sign up form (241 lines)
│   │   ├── TestUserLoginSection.tsx # Dev test login
│   │   ├── connections/             # Connection management UI
│   │   │   ├── ConnectionsPanel.tsx # Full panel (586 lines)
│   │   │   ├── ConnectionRow.tsx    # Single connection (509 lines)
│   │   │   ├── EditConnectionModal.tsx
│   │   │   └── index.ts
│   │   └── ui/                      # shadcn/ui components (60+ files)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAnalytics.ts          # Analytics data hook
│   │   ├── useEnsureProfile.ts      # Auto-create profile hook
│   │   ├── useProviderOAuthV2.ts    # OAuth flow hook (353 lines)
│   │   ├── useTheme.tsx             # Theme management hook
│   │   ├── useComposition.ts        # IME composition hook
│   │   ├── usePersistFn.ts          # Stable function reference
│   │   └── use-mobile.tsx           # Mobile detection
│   │
│   ├── contexts/
│   │   └── ThemeContext.tsx          # Theme context provider
│   │
│   ├── lib/                         # Utilities & libraries
│   │   ├── utils.ts                 # General utilities (cn, etc.)
│   │   ├── constants.ts             # Frontend constants
│   │   ├── currency.tsx             # IDR/USD formatting
│   │   ├── i18n.tsx                 # Internationalization (631 lines)
│   │   ├── analytics.ts            # Analytics utilities
│   │   ├── sanitize.ts              # Input sanitization
│   │   └── viktor-spaces-access/    # Viktor Spaces auth SDK
│   │       ├── index.ts
│   │       ├── client.ts
│   │       ├── server.ts
│   │       ├── config.ts
│   │       ├── constants.ts
│   │       ├── types.ts
│   │       ├── pkce.ts
│   │       ├── authjs.ts
│   │       ├── sessionMarkers.ts
│   │       └── ViktorAuthGlobalGate.tsx
│   │
│   └── styles/                      # Global CSS
│
├── docs/                            # Documentation
│   ├── ADALAHCREDIT_FULL_REPORT.md  # This file
│   ├── email-integration.ts         # Email setup guide
│   └── payment-integration.ts       # Payment integration guide
│
├── scripts/                         # Build & utility scripts
├── tests/                           # Test files
├── public/                          # Static assets
├── vite.config.ts                   # Vite configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript config
├── package.json                     # Dependencies
└── .env.local                       # Environment variables
```

### 4.2 Module Dependency Map

```
                    ┌──────────────────┐
                    │    schema.ts     │  (32 tables, 64 indexes)
                    └────────┬─────────┘
                             │ defines types for
            ┌────────────────┼──────────────────────┐
            ▼                ▼                       ▼
    ┌──────────────┐  ┌──────────────┐    ┌─────────────────┐
    │   http.ts    │  │   crons.ts   │    │   auth.ts       │
    │  (36 routes) │  │  (7 jobs)    │    │  (auth config)  │
    └──────┬───────┘  └──────┬───────┘    └────────┬────────┘
           │                 │                      │
    routes to:        schedules:             used by:
    ┌──────┴──────┐   ┌─────┴──────┐    ┌──────────┴──────┐
    │ proxy.ts    │   │cronTasks.ts│    │ profiles.ts     │
    │ proxyEmbed  │   └────────────┘    │ apiKeys.ts      │
    │ proxyImages │                     │ users.ts        │
    │ proxyAudio  │                     └─────────────────┘
    │ proxyMod    │
    │ testConn    │
    │ providerOA  │
    └──────┬──────┘
           │ calls internally
    ┌──────┴──────────────────────────────────────────┐
    │                                                  │
    ▼                    ▼                  ▼          ▼
 proxyInternal.ts   providerAuth.ts   proxyConn.ts  subscriptionEngine.ts
 (validate,cache)   (resolve model)   (fallback)    (plans,credits)
```

---

## 5. Flow Structure

### 5.1 User Registration & Onboarding Flow

```
[User visits /signup]
    │
    ▼
[Enter email + password]
    │
    ▼
[Convex Auth creates account]
    │
    ▼
[Redirect → /onboarding]
    │
    ▼
[Create profile (profiles.createProfile)]
    │  name, company, use case
    │
    ▼
[Auto-assign Free plan (subscriptionEngine)]
    │  $1.00 monthly credits, 2 API keys, 10 RPM
    │
    ▼
[Generate referral code (profiles)]
    │  collision-checked unique code
    │
    ▼
[Send welcome notification (_sendWelcome)]
    │
    ▼
[Redirect → /dashboard]
    │
    ▼
[useEnsureProfile hook verifies profile exists]
    │  Retry 3x with exponential backoff
    │
    ▼
[Dashboard ready — user can create API keys]
```

### 5.2 API Request Flow (End-to-End)

```
┌────────────────────────────────────────────────────────┐
│ curl https://blessed-sardine-879.convex.site           │
│      /v1/chat/completions                              │
│   -H "Authorization: Bearer sk-ac-xxx"                 │
│   -d '{"model":"groq/llama-4-scout",                   │
│        "messages":[{"role":"user","content":"Hi"}]}'   │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌─ HTTP Action: proxy.chatCompletions ──────────────────┐
│                                                        │
│  1. Parse Authorization header                         │
│     → sk-ac-tja0jh9wy39bw3u1yzbfvs8xkrhqlrzuj3t...   │
│                                                        │
│  2. Validate API key (proxyInternal.validateApiKey)    │
│     → userId, keyId, allowedIPs, keyName               │
│                                                        │
│  3. IP check (if allowedIPs configured)                │
│     → X-Forwarded-For or X-Real-IP                     │
│                                                        │
│  4. Resolve model "groq/llama-4-scout"                 │
│     a. providerAuth.resolveModel (DB lookup)           │
│        → provider: "groq", realModel: "groq/llama..."  │
│     b. REAL_MODEL_ID_MAP transform                     │
│        → "meta-llama/llama-4-scout-17b-16e-instruct"   │
│                                                        │
│  5. Check plan access                                  │
│     subscriptionEngine.checkModelAccess                │
│     → allowed: true (free tier model)                  │
│                                                        │
│  6. Check rate limit (10 RPM for free plan)            │
│     proxyInternal.checkRateLimit                       │
│                                                        │
│  7. Check spending limit (per-key monthly cap)         │
│     proxyInternal.checkSpendingLimit                   │
│                                                        │
│  8. Resolve model alias (if user has aliases)          │
│     proxyInternal.resolveModelAlias                    │
│                                                        │
│  9. Check response cache                               │
│     Hash request → proxyInternal.getCachedResponse     │
│     Cache HIT → return with X-Cache: HIT              │
│                                                        │
│ 10. Get provider credentials                           │
│     providerAuth.getProviderAuth                       │
│     proxyInternal.getProviderKey                       │
│     → apiKey: "gsk_iXlnlB86..."                       │
│     → baseUrl: "https://api.groq.com/openai/v1"       │
│                                                        │
│ 11. Build request (buildOpenAICompatRequest)           │
│     Strip _reqHash from body                           │
│     → POST groq.com/openai/v1/chat/completions        │
│     → model: "meta-llama/llama-4-scout-17b-16e-..."    │
│                                                        │
│ 12. Send to Groq                                       │
│     ← 200 OK                                          │
│     ← "Hello, it's nice to meet!"                     │
│                                                        │
│ 13. Post-processing                                    │
│     a. Log request (model, tokens, latency, cost)      │
│     b. Deduct credits from user balance                │
│     c. Cache response for future requests              │
│     d. Dispatch webhooks (if configured)               │
│     e. Check spending alerts                           │
│                                                        │
│ 14. Return OpenAI-compatible response                  │
│     → { id, model, choices, usage }                    │
└────────────────────────────────────────────────────────┘
```

### 5.3 4-Tier Fallback Flow

```
Request for model "groq/llama-4-scout"
    │
    ▼
[Tier 1: Admin Provider Key]
    │ Provider: groq
    │ Key: gsk_iXlnlB86... (configured by admin)
    │ ── Success? → Return response
    │ ── 429/5xx? ↓
    │
    ▼
[Tier 2: OAuth Connections]
    │ Look for OAuth connections to Groq
    │ proxyConnections.getActiveConnections
    │ Sort by priority, filter healthy ones
    │ ── Success? → Return response
    │ ── Fail? → Mark connection, try next ↓
    │
    ▼
[Tier 3: User Provider Connections]
    │ User's own API keys for this provider
    │ proxyConnections.getAllConnections
    │ ── Success? → Return response
    │ ── Fail? ↓
    │
    ▼
[Tier 4: Free Tier Providers]
    │ NVIDIA NIM free credits
    │ Map to equivalent model if available
    │ ── Success? → Return response
    │ ── Fail? → Return error to user
    │
    ▼
[Connection Health Tracking]
    │ Success → proxyConnections.noteSuccess
    │ Failure → proxyConnections.noteFailure
    │ Rate limited → proxyConnections.markRateLimited
    │ Auth failed → proxyConnections.markAuthFailed
```

### 5.4 OAuth Provider Connection Flow

```
[User clicks "Connect" on provider in dashboard]
    │
    ▼
[Frontend: useProviderOAuthV2 hook]
    │ Determine flow type:
    │ ├── PKCE OAuth (Claude, Codex, OpenAI, Gemini, GitHub...)
    │ ├── Device Code (Cursor, Windsurf, Trae...)
    │ └── Import Token (manual paste)
    │
    ▼ (PKCE flow shown)
[Generate PKCE challenge]
    │ code_verifier → SHA-256 → code_challenge
    │
    ▼
[POST /api/provider-oauth-v2/authorize]
    │ Store state + code_verifier in providerOAuthStates table
    │ Return authorization URL
    │
    ▼
[Open popup window → provider login page]
    │ User authorizes access at provider
    │
    ▼
[Provider redirects to callback URL]
    │ Returns authorization code + state
    │
    ▼
[POST /api/provider-oauth-v2/exchange]
    │ Verify state matches
    │ Exchange code for access_token + refresh_token
    │ Store in providerConnections table
    │
    ▼
[Connection saved & active]
    │ Available for proxy fallback
    │ Token auto-refresh via cron (every 30 min)
```

### 5.5 Payment & Top-Up Flow

```
[User navigates to /topup]
    │
    ▼
[Select plan upgrade or credit top-up]
    │ ├── Subscription: Starter/Pro/Ultimate
    │ └── PAYG top-up: Rp 25K / 50K / 100K / 500K
    │
    ▼
[Create order (payments.createOrder)]
    │ Amount, type, gateway
    │ Status: "pending"
    │
    ▼
[Show payment instructions]
    │ Bank transfer details (BCA, Mandiri, etc.)
    │ Order ID for reference
    │
    ▼
[User transfers money & takes screenshot]
    │
    ▼
[Upload payment proof (payments.uploadPaymentProof)]
    │ Image stored in Convex file storage
    │ Status: "proof_uploaded"
    │
    ▼
[Admin reviews in Admin Dashboard → Payments tab]
    │
    ├── [Confirm (payments.confirmPayment)]
    │   │ Credits added to user balance
    │   │ Subscription activated/upgraded
    │   │ Notification sent to user
    │   │ Audit log entry created
    │   └── Status: "confirmed"
    │
    └── [Reject (payments.rejectPayment)]
        │ Reason provided
        │ Notification sent to user
        └── Status: "rejected"
```

### 5.6 Admin Management Flow

```
[Admin logs in (admin@test.local)]
    │
    ▼
[AdminGuard checks role === "admin"]
    │
    ▼
[Admin Dashboard — 9 Tabs]
    │
    ├── [Overview]
    │   Total users, API calls, revenue, active keys
    │   Real-time charts (Recharts)
    │
    ├── [Users]
    │   List all users, view profiles
    │   Change roles, manage plans
    │
    ├── [Models]
    │   View all configured models
    │   Set model tiers (free/cheap/standard/premium)
    │   Enable/disable models
    │
    ├── [Provider Config]
    │   Add/edit provider API keys
    │   Set base URLs, rate limits
    │   Test provider connectivity
    │
    ├── [Connections]
    │   View all OAuth connections
    │   Monitor connection health
    │   Force reconnect / revoke
    │
    ├── [Pricing]
    │   Set global markup percentage
    │   Custom model pricing overrides
    │   Configure subscription plans
    │
    ├── [Payments]
    │   Review pending payment proofs
    │   Confirm or reject payments
    │   Transaction history
    │
    ├── [Audit]
    │   View all audit log entries
    │   Filter by user, action, date
    │
    └── [System]
        Service status management
        Error logs
        System health overview
```

---

## 6. Database Schema

### 32 Tables with 64 Indexes

| # | Table | Purpose | Key Fields |
|---|-------|---------|------------|
| 1 | `profiles` | User profiles | userId, email, name, role, plan, referralCode |
| 2 | `apiKeys` | API keys | userId, key (hashed), name, status, expiresAt |
| 3 | `usageLogs` | Per-request logs | apiKeyId, model, provider, tokens, cost, latencyMs |
| 4 | `dailyUsage` | Aggregated daily stats | userId, date, totalRequests, totalTokens, totalCost |
| 5 | `subscriptions` | Active subscriptions | userId, plan, status, creditsCents, expiresAt |
| 6 | `subscriptionOrders` | Subscription orders | userId, plan, amount, status, proofFileId |
| 7 | `transactions` | Credit transactions | userId, type, amount, description |
| 8 | `teams` | Team organizations | ownerId, name, plan |
| 9 | `teamMembers` | Team membership | teamId, userId, role |
| 10 | `webhooks` | User webhooks | userId, url, events, secret, active |
| 11 | `referrals` | Referral tracking | referrerId, refereeId, code, status |
| 12 | `paymentGateways` | Payment methods | name, type, config, active |
| 13 | `paymentOrders` | Payment orders | userId, amount, gateway, status, proofUrl |
| 14 | `providerConfigs` | AI provider configs | provider, apiKey, baseUrl, models[], tier |
| 15 | `pricingConfig` | Global pricing | markupPercent, currency |
| 16 | `subscriptionPlans` | Plan definitions | slug, name, priceIdr, creditsCents, features[] |
| 17 | `serviceStatus` | Service health | name, status, lastChecked |
| 18 | `incidents` | Incident reports | title, severity, status, affectedServices |
| 19 | `webhookDeliveries` | Webhook delivery logs | webhookId, event, status, responseCode |
| 20 | `auditLogs` | Audit trail | userId, action, resource, details, ip |
| 21 | `blogPosts` | Blog content | title, slug, content, published, authorId |
| 22 | `changelogEntries` | Changelog | version, title, content, type, date |
| 23 | `supportTickets` | Support tickets | userId, subject, status, priority, messages[] |
| 24 | `errorLogs` | Error tracking | source, message, stack, metadata |
| 25 | `modelAliases` | User model aliases | userId, alias, targetModel |
| 26 | `spendingAlerts` | Spending limit configs | userId, apiKeyId, monthlyLimit, currentSpend |
| 27 | `notifications` | User notifications | userId, type, title, body, read |
| 28 | `responseCache` | Response caching | requestHash, responseJson, expiresAt, hitCount |
| 29 | `providerOAuthStates` | OAuth flow states | state, codeVerifier, provider, expiresAt |
| 30 | `providerConnections` | Provider connections | userId, provider, type, credentials, health |
| 31 | `routingState` | Connection routing | provider, activeConnectionId, failoverHistory |
| 32 | `_scheduled_functions` | (system) Convex cron state | — |

---

## 7. API Endpoints

### 7.1 Proxy API (OpenAI-Compatible)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/chat/completions` | Chat completions (streaming & non-streaming) |
| GET | `/v1/models` | List available models |
| POST | `/v1/embeddings` | Text embeddings |
| POST | `/v1/images/generations` | Image generation |
| POST | `/v1/audio/transcriptions` | Speech-to-text |
| POST | `/v1/audio/speech` | Text-to-speech |
| POST | `/v1/moderations` | Content moderation |

### 7.2 Internal API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/test-provider` | Test provider API key |
| POST | `/api/test-connection` | Test connection health |
| GET | `/api/provider-oauth/start` | Start OAuth flow |
| GET | `/api/provider-oauth/callback` | OAuth callback |
| POST | `/api/provider-oauth/complete` | Complete OAuth |
| POST | `/api/provider-oauth-v2/authorize` | PKCE OAuth start |
| POST | `/api/provider-oauth-v2/exchange` | Exchange auth code |
| POST | `/api/provider-oauth-v2/device-code` | Device code flow |
| POST | `/api/provider-oauth-v2/poll` | Poll device code |
| POST | `/api/provider-oauth-v2/import-token` | Import token |
| GET | `/api/provider-oauth-v2/list-providers` | List OAuth providers |

### 7.3 Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/__viktor_auth/callback` | Auth callback |
| GET | `/__viktor_auth/me` | Current user info |
| POST | `/__viktor_auth/logout` | Logout |

---

## 8. Authentication & Authorization

### 8.1 Auth Types

| Type | Description | Used By |
|------|-------------|---------|
| Email/Password | Convex Auth built-in | User registration & login |
| Test Auth | Special auth for test accounts | Development (`testAuth.ts`) |
| Viktor Spaces Auth | OAuth with Viktor platform | Production deployment |
| API Key (Bearer) | `sk-ac-*` prefix keys | Proxy API access |

### 8.2 Authorization Levels

```
┌────────────────────────────────────────┐
│ Public (no auth required)              │
│  Landing, Docs, Blog, Status,          │
│  Changelog, Models, Compare,           │
│  Terms, Privacy, SDKs, Login, Signup   │
├────────────────────────────────────────┤
│ Authenticated User (AuthGuard)         │
│  Dashboard, Playground, TopUp,         │
│  Onboarding, Referral, Receipt,        │
│  Settings                              │
├────────────────────────────────────────┤
│ Admin Only (AdminGuard)                │
│  Admin Dashboard (all 9 tabs)          │
│  Provider management                   │
│  User role management                  │
│  Payment confirmation                  │
├────────────────────────────────────────┤
│ API Key (Bearer token)                 │
│  All /v1/* proxy endpoints             │
│  Per-key rate limits & spending caps   │
└────────────────────────────────────────┘
```

### 8.3 API Key Format

```
sk-ac-{random_32_chars}
  │  │   └── 32 random alphanumeric chars (crypto.getRandomValues)
  │  └────── "ac" = AdalahCredit prefix
  └───────── "sk" = secret key marker
```

Keys are hashed before storage; the plain key is shown only once at creation.

---

## 9. Proxy Engine

### 9.1 Supported Providers

| Provider | Auth | Models | Status |
|----------|------|--------|--------|
| Groq | API Key | llama-4-scout, llama-3.3-70b, qwen3-32b, llama-3.1-8b | ✅ Active |
| NVIDIA NIM | API Key | llama-3.3-70b, mistral-large | ✅ Active (cold start) |
| OpenAI | API Key / OAuth | gpt-4o, gpt-4o-mini, gpt-4.1, o3, o4-mini | 🔧 Needs key |
| Anthropic | API Key / OAuth | claude-opus-4, claude-sonnet-4, claude-3.5-haiku | 🔧 Needs key |
| Google | API Key / OAuth | gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash | 🔧 Needs key |
| Mistral | API Key | mistral-large, codestral | 🔧 Needs key |
| xAI | API Key | grok-3 | 🔧 Needs key |
| DeepSeek | API Key | deepseek-v3 | 🔧 Needs key |
| Cohere | API Key | command-r-plus | 🔧 Needs key |

### 9.2 Model ID Mapping

Internal model IDs are mapped to real provider API IDs:

```
Internal ID              → Provider API ID
groq/llama-4-scout      → meta-llama/llama-4-scout-17b-16e-instruct
groq/llama-4-maverick   → meta-llama/llama-4-maverick-17b-128e-instruct
groq/llama-3.3-70b      → llama-3.3-70b-versatile
groq/llama-3.1-8b       → llama-3.1-8b-instant
groq/qwen3-32b          → qwen/qwen3-32b
nv/llama-3.3-70b        → meta/llama-3.3-70b-instruct
nv/mistral-large        → mistralai/mistral-large-2-instruct
```

### 9.3 Streaming Support

Both SSE streaming and non-streaming responses are supported. The proxy transforms provider-specific formats to OpenAI-compatible:

- **OpenAI-compatible** (Groq, NVIDIA, etc.): Pass-through with model name rewrite
- **Anthropic**: Event type translation (`content_block_delta` → `delta`)
- **Google Gemini**: Candidate extraction → OpenAI format
- **Cohere**: Stream event transformation

### 9.4 Response Caching

```
Request → SHA-256 hash of (model + messages + temperature + max_tokens)
         │
         ├── Cache HIT → Return cached response
         │   Header: X-Cache: HIT
         │   No provider call needed
         │
         └── Cache MISS → Forward to provider
             Store response in responseCache table
             TTL: 10 minutes (cleaned by cron)
```

---

## 10. Subscription & Billing Engine

### 10.1 Plan Tiers

| Feature | Free | Starter (Rp 50K) | Pro (Rp 200K) | Ultimate (Rp 500K) |
|---------|------|-------------------|----------------|---------------------|
| Monthly Credits | $1.00 | $10.00 | $50.00 | $200.00 |
| API Keys | 2 | 5 | 20 | Unlimited |
| Rate Limit | 10 RPM | 30 RPM | 60 RPM | 120 RPM |
| Daily Requests | 200 | 2,000 | 10,000 | Unlimited |
| Model Access | Free | Free + Cheap | Free + Cheap + Standard | All |
| Team Members | — | 3 | 10 | Unlimited |
| Support | Community | Email | Priority | Dedicated |

### 10.2 Model Tier Classification

| Tier | Examples | Plans |
|------|----------|-------|
| `free` | NVIDIA NIM models (free credits) | All plans |
| `cheap` | Groq models (low-cost inference) | Starter+ |
| `standard` | GPT-4o-mini, Claude Haiku | Pro+ |
| `premium` | GPT-4o, Claude Opus, Gemini Pro | Ultimate |

### 10.3 Cost Calculation

```
cost_usd = (input_tokens / 1_000_000) × input_price_per_1M
         + (output_tokens / 1_000_000) × output_price_per_1M

cost_with_markup = cost_usd × (1 + markup_percent / 100)

cost_cents = cost_with_markup × 100
```

---

## 11. OAuth Provider System

### 11.1 Supported OAuth Providers (17)

| # | Provider | Slug | Flow Types |
|---|----------|------|------------|
| 1 | Claude (Anthropic) | `claude` | PKCE, Import Token |
| 2 | Codex (OpenAI) | `codex` | PKCE |
| 3 | OpenAI Native | `openai` | PKCE |
| 4 | Gemini CLI (Google) | `gemini-cli` | PKCE |
| 5 | Antigravity | `antigravity` | PKCE |
| 6 | AGY | `agy` | PKCE |
| 7 | GitHub Copilot | `github` | PKCE, Device Code |
| 8 | Qwen (Alibaba) | `qwen` | PKCE |
| 9 | Kimi Coding | `kimi-coding` | PKCE |
| 10 | Kilocode | `kilocode` | PKCE |
| 11 | Cline | `cline` | PKCE |
| 12 | Kiro (AWS) | `kiro` | PKCE, Device Code |
| 13 | GitLab Duo | `gitlab-duo` | PKCE, Device Code |
| 14 | Qoder | `qoder` | PKCE |
| 15 | Cursor | `cursor` | Device Code, Import Token |
| 16 | Trae | `trae` | Device Code, Import Token |
| 17 | Windsurf | `windsurf` | Device Code, Import Token |

### 11.2 OAuth Flow Types

| Flow | Description | Providers |
|------|-------------|-----------|
| **PKCE** | Browser popup → provider login → code exchange | Most providers |
| **Device Code** | CLI-style: get code → user enters at URL → poll for token | Cursor, Windsurf, Trae, GitHub, Kiro, GitLab |
| **Import Token** | User manually pastes an existing access token | Claude, Cursor, Trae, Windsurf |

---

## 12. Connection Management

### 12.1 Connection Types

| Type | Source | Priority |
|------|--------|----------|
| `admin_key` | Admin-configured provider API key | Highest (Tier 1) |
| `oauth` | OAuth-connected user/admin accounts | High (Tier 2) |
| `user_key` | User's own provider API key | Medium (Tier 3) |
| `free` | Free-tier provider credits | Lowest (Tier 4) |

### 12.2 Health Tracking

Each connection tracks:
- **Success/failure counts**: Rolling window
- **Rate limit status**: Cooldown period
- **Auth status**: Valid, expired, needs reconnect
- **Last used**: Timestamp
- **Test results**: Last health check result

### 12.3 Routing State Machine

```
HEALTHY → on success, reset failure count
   │
   ├── on 429 → RATE_LIMITED (cooldown 60s)
   ├── on 401 → AUTH_FAILED (needs reconnect)
   ├── on 5xx → DEGRADED (try next, increment failures)
   │
   └── failures > threshold → UNHEALTHY (skip for fallback)
```

---

## 13. Frontend Pages & Dashboard

### 13.1 Public Pages (No Auth Required)

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Marketing page with features, pricing, CTA |
| Documentation | `/docs` | API documentation with code examples |
| Models | `/models` | Browse all 321+ AI models |
| Compare | `/compare` | Side-by-side model comparison |
| Status | `/status` | Real-time service health |
| Blog | `/blog` | Blog articles |
| Blog Post | `/blog/:slug` | Individual blog post |
| Changelog | `/changelog` | Version history |
| SDKs | `/sdks` | SDK & library downloads |
| Support | `/support` | Support ticket submission |
| Terms | `/terms` | Terms of Service |
| Privacy | `/privacy` | Privacy Policy |
| Login | `/login` | Sign in form |
| Signup | `/signup` | Registration form |

### 13.2 User Dashboard (10 Tabs)

| Tab | Features |
|-----|----------|
| **Overview** | Stats cards, usage chart, recent activity, quick actions |
| **Keys** | Create/revoke/delete API keys, view key stats, copy key |
| **Usage** | Request logs, token usage, model breakdown charts |
| **Logs** | Detailed per-request logs with latency, cost, status |
| **Billing** | Current plan, credit balance, transaction history |
| **Aliases** | Create model aliases (e.g., "fast" → "groq/llama-3.1-8b") |
| **Limits** | Set per-key monthly spending limits with alerts |
| **Settings** | Profile edit, password change, language, theme |
| **Team** | Create team, invite members, manage roles |
| **Webhooks** | Configure webhook URLs, select events, view delivery logs |

### 13.3 Admin Dashboard (9 Tabs)

| Tab | Features |
|-----|----------|
| **Overview** | System-wide stats, revenue, user growth chart |
| **Users** | All users list, role management, plan assignment |
| **Models** | Model tier assignment, enable/disable, auto-assign |
| **Provider Config** | API key management, base URL, test connectivity |
| **Connections** | All OAuth connections, health monitoring, force reconnect |
| **Pricing** | Global markup %, custom model prices, plan editing |
| **Payments** | Pending proof review, confirm/reject, transaction history |
| **Audit** | Complete audit trail — who did what, when |
| **System** | Service status, error logs, system health |

### 13.4 Other Authenticated Pages

| Page | Route | Description |
|------|-------|-------------|
| Playground | `/playground` | Interactive API testing with live responses |
| Top Up | `/topup` | Purchase credits or upgrade plan |
| Onboarding | `/onboarding` | New user setup wizard |
| Referral | `/referral` | Referral program dashboard |
| Receipt | `/receipt` | Payment receipt viewer |
| Settings | `/settings` | Account settings (standalone) |
| OAuth Callback | `/oauth/callback` | OAuth redirect handler |
| 404 | `*` | Custom not found page |

---

## 14. Cron Jobs & Background Tasks

| Cron Job | Schedule | Description |
|----------|----------|-------------|
| Cleanup expired cache | Every 10 min | Remove expired response cache entries |
| Expire API keys | Every 1 hour | Revoke keys past expiration date |
| Aggregate daily usage | Daily 00:05 UTC | Roll up per-request logs into daily stats |
| Cleanup error logs | Daily 00:30 UTC | Delete error logs older than 30 days |
| Provider health check | Every 5 min | Ping providers, update service status |
| OAuth token refresh | Every 30 min | Proactively refresh expiring OAuth tokens |
| Clear expired cooldowns | Every 5 min | Remove rate-limit cooldowns that expired |

---

## 15. Internationalization

### Supported Languages

| Language | Code | Coverage |
|----------|------|----------|
| English | `en` | 100% — all UI strings |
| Bahasa Indonesia | `id` | 100% — all UI strings |

### Implementation

- **File**: `src/lib/i18n.tsx` (631 lines)
- **Pattern**: React context + hook (`useI18n`)
- **Storage**: `localStorage` for language preference
- **Detection**: Browser language auto-detect on first visit
- **Scope**: All dashboard labels, messages, buttons, errors, placeholders

---

## 16. Security Measures

### 16.1 Implemented Security

| Area | Measure |
|------|---------|
| **API Keys** | Generated with `crypto.getRandomValues`, hashed before storage |
| **Auth** | Convex Auth with session management, JWT tokens |
| **Admin** | `requireAdmin()` guard on all admin mutations |
| **Ownership** | All user queries filter by authenticated userId |
| **Input Validation** | Server-side validation on all mutations |
| **Rate Limiting** | Per-key RPM enforcement |
| **Spending Limits** | Per-key monthly caps with alerts |
| **IP Allowlist** | Optional per-key IP restriction |
| **CORS** | Handled by Convex HTTP actions |
| **XSS Prevention** | React's built-in escaping + input sanitization |
| **Audit Trail** | All admin actions logged with timestamp & IP |
| **OAuth State** | PKCE + state parameter validation |
| **Referral Codes** | Collision-checked unique generation |
| **Payment Proofs** | Rate limited (1 upload per minute) |
| **Account Deletion** | Full cascade: keys, usage, subscriptions, webhooks, team |

### 16.2 Bug Fixes Applied (75 Issues)

- **Critical (16)**: Auth bypass, backdoor removal, ownership checks, internal mutation exposure
- **High (15)**: Bounded queries, rate limiting, input validation
- **Medium (28)**: Error handling, controlled inputs, state management
- **Low (16)**: Pagination, negative value rejection, cleanup

---

## 17. Deployment & Infrastructure

### 17.1 Deployment Stack

```
┌────────────────────────────────────┐
│        Viktor Spaces               │
│   Static hosting + CDN             │
│   URL: preview-api-gateway-*       │
│   Deploy: viktor_spaces_tools      │
└──────────────┬─────────────────────┘
               │ serves
               ▼
┌────────────────────────────────────┐
│      Vite Build Output (dist/)     │
│   index.html + JS bundles + CSS    │
│   Client-side React SPA            │
└──────────────┬─────────────────────┘
               │ connects to
               ▼
┌────────────────────────────────────┐
│        Convex Cloud                │
│   blessed-sardine-879              │
│                                    │
│   ├── Real-time subscriptions      │
│   ├── HTTP actions (API proxy)     │
│   ├── Cron jobs (7 scheduled)      │
│   ├── File storage (payment proof) │
│   └── Database (32 tables)         │
└────────────────────────────────────┘
```

### 17.2 Deploy Process

```bash
# 1. Deploy Convex backend
CONVEX_DEPLOY_KEY=... bunx convex deploy --cmd 'echo skip'

# 2. Build frontend
bun run vite build

# 3. Deploy to Viktor Spaces
uv run python temp/deploy_v4.py
```

### 17.3 Environment Variables

```
CONVEX_DEPLOYMENT=dev:blessed-sardine-879
VITE_CONVEX_URL=https://blessed-sardine-879.convex.cloud
VITE_CONVEX_SITE_URL=https://blessed-sardine-879.convex.site
CONVEX_DEPLOY_KEY=dev:blessed-sardine-879|eyJ2Mi...
```

---

## 18. Project Statistics

### Code Size

| Category | Files | Lines |
|----------|-------|-------|
| Backend (Convex) | 62 | 19,587 |
| Frontend (React) | 135 | 25,064 |
| **Total** | **197** | **45,021** |

### Database

| Metric | Count |
|--------|-------|
| Tables | 32 |
| Indexes | 64 |
| HTTP Routes | 36 (21 unique paths) |
| Cron Jobs | 7 |

### Features

| Category | Count |
|----------|-------|
| Pages | 26 + custom 404 |
| User Dashboard Tabs | 10 |
| Admin Dashboard Tabs | 9 |
| OAuth Providers | 17 |
| Proxy Endpoints | 7 (chat, models, embeddings, images, audio×2, moderations) |
| Seeded Providers | 204 |
| Seeded Models | 321+ |
| Active Providers | 2 (Groq, NVIDIA) |
| Active Models | 6 |
| Languages | 2 (EN, ID) |
| Themes | 2 (Light, Dark) |

### Top 10 Largest Files

| File | Lines | Purpose |
|------|-------|---------|
| AdminDashboard.tsx | 2,058 | Admin dashboard (9 tabs) |
| seedPhase2.ts | 1,848 | Phase 2 data seeding |
| seedProviders.ts | 1,659 | 204 providers seed |
| UserDashboard.tsx | 1,621 | User dashboard (10 tabs) |
| seedNewProviders.ts | 1,558 | Additional providers |
| PublicLandingPage.tsx | 1,131 | Landing page |
| oauthProviders.ts | 1,034 | OAuth provider management |
| DocsPage.tsx | 1,035 | Documentation page |
| ModelsPage.tsx | 1,029 | Model catalog |
| subscriptionEngine.ts | 941 | Subscription & billing |

---

## 19. Feature Checklist

### Core Platform ✅
- [x] Landing page with pricing & features
- [x] User registration & login (email/password)
- [x] User profile & onboarding flow
- [x] Admin & user role separation
- [x] Dark/light theme with system detection
- [x] English & Indonesian i18n
- [x] Custom 404 page
- [x] Error boundary on all pages

### API Gateway ✅
- [x] OpenAI-compatible chat completions
- [x] Model listing endpoint
- [x] Embeddings endpoint
- [x] Image generation endpoint
- [x] Audio transcription (STT) endpoint
- [x] Audio speech (TTS) endpoint
- [x] Content moderation endpoint
- [x] SSE streaming support
- [x] Non-streaming support
- [x] Response caching with TTL
- [x] Provider-specific request builders (OpenAI, Anthropic, Google, Cohere)
- [x] Model ID mapping (internal → provider)

### Multi-Provider System ✅
- [x] 204 providers seeded
- [x] 321+ models cataloged
- [x] Dynamic provider configuration via admin
- [x] 4-tier fallback (admin key → OAuth → user key → free)
- [x] Connection health tracking
- [x] Auto-failover on 429/5xx
- [x] Rate limit detection & cooldown
- [x] Provider connectivity testing

### OAuth & Connections ✅
- [x] 17 OAuth providers configured
- [x] PKCE authorization code flow
- [x] Device code flow
- [x] Token import flow
- [x] Automatic token refresh (cron)
- [x] Connection health monitoring
- [x] Multi-connection per provider

### Billing & Subscriptions ✅
- [x] 4-tier subscription plans
- [x] Pay-as-you-go credits
- [x] Per-request cost calculation with markup
- [x] Manual payment (bank transfer + proof)
- [x] Admin payment confirmation/rejection
- [x] Credit deduction per API call
- [x] Transaction history
- [x] Payment receipts

### User Dashboard ✅
- [x] API key management (create/revoke/delete)
- [x] Usage statistics & charts
- [x] Request logs with details
- [x] Billing & credit balance
- [x] Model aliases
- [x] Per-key spending limits
- [x] Team management
- [x] Webhook configuration
- [x] Notification system
- [x] Account settings

### Admin Dashboard ✅
- [x] System overview with real-time stats
- [x] User management & role assignment
- [x] Model tier configuration
- [x] Provider API key management
- [x] Connection monitoring
- [x] Pricing & markup control
- [x] Payment review workflow
- [x] Complete audit trail
- [x] System health & error logs

### Content & Marketing ✅
- [x] Blog with CMS (create/edit/publish)
- [x] Changelog management
- [x] Service status page with incidents
- [x] Support ticket system
- [x] SDK & libraries page
- [x] Model comparison tool
- [x] API documentation
- [x] Terms of Service
- [x] Privacy Policy
- [x] Referral program

### Security ✅
- [x] Cryptographic API key generation
- [x] Server-side auth validation on all mutations
- [x] Admin guard on privileged operations
- [x] Per-key rate limiting
- [x] Per-key spending limits
- [x] IP allowlist (optional)
- [x] Input sanitization
- [x] Audit logging
- [x] PKCE for OAuth flows
- [x] 75 security bug fixes applied

### Infrastructure ✅
- [x] Viktor Spaces deployment
- [x] Convex Cloud backend
- [x] 7 automated cron jobs
- [x] GitHub repository
- [x] TypeScript throughout (frontend + backend)

---

## 20. Appendix: Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `CONVEX_DEPLOYMENT` | `dev:blessed-sardine-879` | Convex project identifier |
| `VITE_CONVEX_URL` | `https://blessed-sardine-879.convex.cloud` | Frontend Convex connection |
| `VITE_CONVEX_SITE_URL` | `https://blessed-sardine-879.convex.site` | HTTP actions base URL |
| `CONVEX_DEPLOY_KEY` | `dev:blessed-sardine-879\|eyJ2Mi...` | Deploy authentication |

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| User | `user@test.local` | `test123` |
| Admin | `admin@test.local` | `admin123` |

### Active Provider Keys

| Provider | Key Prefix | Status |
|----------|-----------|--------|
| Groq | `gsk_iXlnl...` | ✅ Active (4 models) |
| NVIDIA NIM | `nvapi-iL4Su...` | ✅ Active (2 models, cold start) |

---

*Generated June 2026 · AdalahCredit v1.0*
*Total: 45,021 lines of code across 197 files*
