# AdalahCredit - Local Setup Guide (Arch Linux)

## Prerequisites

### 1. Install Required Packages
```bash
# Update system
sudo pacman -Syu

# Install Node.js (LTS) via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Install Bun (package manager & runtime)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install Git
sudo pacman -S git
```

### 2. Clone / Copy Project
```bash
# Copy the project folder or clone from your repo
cd ~/projects
cp -r /path/to/api-gateway-landing ./adalahcredit
cd adalahcredit
```

### 3. Install Dependencies
```bash
bun install
```

### 4. Setup Convex Backend
```bash
# Install Convex CLI globally (optional, bunx works too)
bun add -g convex

# Login to Convex
bunx convex login

# Initialize a new Convex project (or link existing)
bunx convex init
# Or link to existing deployment:
# bunx convex dev --once
```

### 5. Configure Environment Variables

Create `.env.local`:
```bash
cat > .env.local << 'EOF'
# Convex URLs (replace with your deployment)
VITE_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud
VITE_CONVEX_SITE_URL=https://YOUR-DEPLOYMENT.convex.site

# Auth Secret (generate one)
CONVEX_AUTH_ADAPTER_SECRET=$(openssl rand -hex 32)

# For test login (preview mode)
VIKTOR_SPACES_IS_PREVIEW=true
EOF
```

Also set Convex environment variables:
```bash
bunx convex env set AUTH_ADAPTER_SECRET $(openssl rand -hex 32)
bunx convex env set SITE_URL http://localhost:5173
bunx convex env set VIKTOR_SPACES_IS_PREVIEW true
```

### 6. Deploy Convex Schema & Functions
```bash
# Push schema and functions to Convex
bunx convex dev --once

# Seed initial data (providers, models, etc.)
bunx convex run seed:seedInitialData
```

### 7. Run Development Server
```bash
# Terminal 1: Convex dev server (watches for changes)
bunx convex dev

# Terminal 2: Vite dev server
bun run dev
```

Open http://localhost:5173

### 8. Test Accounts
- **User**: `user@test.local` / `test123`
- **Admin**: `admin@test.local` / `admin123`

Use the quick-login buttons on the login page.

---

## Project Structure

```
adalahcredit/
├── convex/                  # Backend (Convex functions)
│   ├── schema.ts            # Database schema (28 tables)
│   ├── auth.ts              # Authentication config
│   ├── proxy.ts             # Main API proxy (chat completions)
│   ├── proxyInternal.ts     # Proxy helpers (auth, rate limit, billing)
│   ├── proxyEmbeddings.ts   # /v1/embeddings endpoint
│   ├── proxyImages.ts       # /v1/images/generations endpoint
│   ├── proxyAudio.ts        # /v1/audio/* endpoints
│   ├── proxyModerations.ts  # /v1/moderations endpoint
│   ├── providerAuth.ts      # Provider API key management
│   ├── providers.ts         # Provider CRUD + health checks
│   ├── apiKeys.ts           # User API key management
│   ├── billing.ts           # Subscription & credit system
│   ├── usage.ts             # Usage tracking & stats
│   ├── admin.ts             # Admin dashboard queries
│   ├── analytics.ts         # Analytics charts data
│   ├── notifications.ts     # Notification system
│   ├── modelAliases.ts      # Model alias mapping
│   ├── spendingLimits.ts    # Spending limit controls
│   ├── profiles.ts          # User profiles
│   ├── supportTickets.ts    # Support ticket system
│   ├── blog.ts              # Blog CMS
│   ├── changelog.ts         # Changelog entries
│   ├── referrals.ts         # Referral program
│   ├── webhooks.ts          # Webhook system
│   ├── seedPhase2.ts        # Seed 204 providers + 321 models
│   ├── seedPhase3.ts        # Seed Phase 3 models
│   └── seedTestUser.ts      # Seed test accounts
├── src/
│   ├── pages/               # 25 page components
│   │   ├── PublicLandingPage.tsx
│   │   ├── UserDashboard.tsx    # 12 tabs
│   │   ├── AdminDashboard.tsx   # 9 tabs
│   │   ├── PlaygroundPage.tsx   # API playground + code snippets
│   │   ├── DocsPage.tsx
│   │   ├── ModelsPage.tsx
│   │   └── ... (20+ more)
│   ├── components/          # 69 reusable components
│   │   ├── NotificationBell.tsx
│   │   ├── AnalyticsCharts.tsx
│   │   ├── CodeSnippets.tsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utilities
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## Key Features

| Feature | Description |
|---------|-------------|
| API Proxy | OpenAI-compatible proxy with 204+ providers, 321+ models |
| Multi-Auth | 6 auth types (API key header, Bearer, query param, etc.) |
| Streaming | SSE streaming for chat completions |
| 5 Endpoints | chat/completions, embeddings, images, audio, moderations |
| Dashboard | User (12 tabs) + Admin (9 tabs) with real-time data |
| Analytics | Recharts-based charts (usage, cost, latency, model breakdown) |
| Notifications | 8 notification types with bell dropdown |
| Code Snippets | Auto-generated cURL, Python, JS, Go examples |
| i18n | English + Bahasa Indonesia |
| Dark/Light | Theme toggle with system preference |
| 4-Tier Fallback | Automatic provider failover |
| Rate Limiting | Per-plan rate limits |
| Spending Limits | Per-model and global spending caps |
| Model Aliases | Custom model name mapping |

## Production Build
```bash
bun run tsc -b && bun run vite build
# Output in dist/
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `node_modules` errors | `rm -rf node_modules && bun install` |
| Convex type errors | `bunx convex dev --once` to regenerate types |
| Test login not working | Set `VIKTOR_SPACES_IS_PREVIEW=true` in Convex env |
| Provider auth fails | Add provider API keys via Admin dashboard |
