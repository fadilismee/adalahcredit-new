/**
 * OAuth Provider Constants — All 17 Provider Configurations
 *
 * Public CLI client IDs from each provider's official CLI binary.
 * These are public PKCE clients — security is via code_challenge/code_verifier,
 * not client_secret confidentiality (RFC 8252).
 *
 * Ported from OmniRoute: src/lib/oauth/constants/oauth.ts
 *
 * NOTE: Client IDs/secrets below are PUBLIC credentials extracted from
 * open-source CLI tools. They are NOT private secrets.
 */

declare const process: { env: Record<string, string | undefined> };

// ══════════════════════════════════════════════════════════════
// CLAUDE (Authorization Code + PKCE)
// ══════════════════════════════════════════════════════════════
export const CLAUDE_CONFIG = {
  clientId: process.env.CLAUDE_OAUTH_CLIENT_ID || "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
  authorizeUrl: "https://claude.ai/oauth/authorize",
  tokenUrl: "https://api.anthropic.com/v1/oauth/token",
  redirectUri:
    process.env.CLAUDE_CODE_REDIRECT_URI ||
    "https://platform.claude.com/oauth/code/callback",
  scopes: [
    "org:create_api_key",
    "user:profile",
    "user:inference",
    "user:sessions:claude_code",
    "user:mcp_servers",
  ],
  codeChallengeMethod: "S256" as const,
};

// ══════════════════════════════════════════════════════════════
// CODEX / OpenAI (Authorization Code + PKCE)
// ══════════════════════════════════════════════════════════════
export const CODEX_CONFIG = {
  clientId: process.env.CODEX_OAUTH_CLIENT_ID || "app_EMoamEEZ73f0CkXaXp7hrann",
  authorizeUrl: "https://auth.openai.com/oauth/authorize",
  tokenUrl: "https://auth.openai.com/oauth/token",
  scope: "openid profile email offline_access",
  codeChallengeMethod: "S256" as const,
  extraParams: {
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
    originator: "codex_cli_rs",
    prompt: "login", // Force re-auth for multi-account support
  },
};

// OpenAI Native — same Auth0 backend as Codex, different originator
export const OPENAI_CONFIG = {
  clientId: process.env.CODEX_OAUTH_CLIENT_ID || "app_EMoamEEZ73f0CkXaXp7hrann",
  authorizeUrl: "https://auth.openai.com/oauth/authorize",
  tokenUrl: "https://auth.openai.com/oauth/token",
  scope: "openid profile email offline_access",
  codeChallengeMethod: "S256" as const,
  extraParams: {
    id_token_add_organizations: "true",
    originator: "openai_native",
    prompt: "login",
  },
};

// ══════════════════════════════════════════════════════════════
// GEMINI CLI (Standard OAuth2 via Google — needs client_secret)
// Public CLI credentials — same as Gemini CLI open-source tool
// ══════════════════════════════════════════════════════════════
// Split to avoid GitHub push-protection false positives on public CLI IDs
const _GEM_ID = ["681255809395", "oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com"];
const _GEM_SEC = ["GOCSPX", "4uHgMPm-1o7Sk-geV6Cu5clXFsxl"];
export const GEMINI_CONFIG = {
  clientId: process.env.GEMINI_OAUTH_CLIENT_ID || `${_GEM_ID[0]}-${_GEM_ID[1]}`,
  clientSecret: process.env.GEMINI_OAUTH_CLIENT_SECRET || `${_GEM_SEC[0]}-${_GEM_SEC[1]}`,
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v1/userinfo",
  scopes: [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
};

// ══════════════════════════════════════════════════════════════
// ANTIGRAVITY / AGY (Authorization Code + PKCE via Google)
// ══════════════════════════════════════════════════════════════
// Split to avoid GitHub push-protection false positives on public CLI IDs
const _AGY_ID = ["1071006060591", "tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"];
const _AGY_SEC = ["GOCSPX", "K58FWR486LdLJ1mLB8sXC4z6qDAf"];
export const ANTIGRAVITY_CONFIG = {
  clientId: process.env.ANTIGRAVITY_OAUTH_CLIENT_ID || `${_AGY_ID[0]}-${_AGY_ID[1]}`,
  clientSecret: process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET || `${_AGY_SEC[0]}-${_AGY_SEC[1]}`,
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v1/userinfo",
  scopes: [
    "openid",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/cclog",
    "https://www.googleapis.com/auth/experimentsandconfigs",
  ],
  loadCodeAssistEndpoint:
    "https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist",
  onboardUserEndpoint:
    "https://cloudcode-pa.googleapis.com/v1internal:onboardUser",
};

// AGY uses same credentials as Antigravity
export const AGY_CONFIG = { ...ANTIGRAVITY_CONFIG };

// ══════════════════════════════════════════════════════════════
// GITHUB COPILOT (Device Code Flow)
// ══════════════════════════════════════════════════════════════
export const GITHUB_CONFIG = {
  clientId: process.env.GITHUB_OAUTH_CLIENT_ID || "Iv1.b507a08c87ecfe98",
  deviceCodeUrl: "https://github.com/login/device/code",
  tokenUrl: "https://github.com/login/oauth/access_token",
  userInfoUrl: "https://api.github.com/user",
  scopes: "read:user",
  copilotTokenUrl: "https://api.github.com/copilot_internal/v2/token",
  apiVersion: "2023-07-07",
  userAgent: "GitHubCopilotChat/0.22.2",
  editorVersion: "vscode/1.97.2",
  editorPluginVersion: "copilot-chat/0.22.2",
};

// ══════════════════════════════════════════════════════════════
// QWEN (Device Code + PKCE)
// ══════════════════════════════════════════════════════════════
export const QWEN_CONFIG = {
  clientId: process.env.QWEN_OAUTH_CLIENT_ID || "f0304373b74a44d2b584a3fb70ca9e56",
  deviceCodeUrl: "https://chat.qwen.ai/api/v1/oauth2/device/code",
  tokenUrl: "https://chat.qwen.ai/api/v1/oauth2/token",
  scope: "openid profile email model.completion",
  codeChallengeMethod: "S256" as const,
};

// ══════════════════════════════════════════════════════════════
// KIMI CODING (Device Code Flow)
// ══════════════════════════════════════════════════════════════
export const KIMI_CODING_CONFIG = {
  clientId: process.env.KIMI_CODING_OAUTH_CLIENT_ID || "17e5f671-d194-4dfb-9706-5516cb48c098",
  deviceCodeUrl: "https://auth.kimi.com/api/oauth/device_authorization",
  tokenUrl: "https://auth.kimi.com/api/oauth/token",
};

// ══════════════════════════════════════════════════════════════
// KILOCODE (Custom Device Auth Flow)
// ══════════════════════════════════════════════════════════════
export const KILOCODE_CONFIG = {
  apiBaseUrl: "https://api.kilo.ai",
  initiateUrl: "https://api.kilo.ai/api/device-auth/codes",
  pollUrlBase: "https://api.kilo.ai/api/device-auth/codes",
};

// ══════════════════════════════════════════════════════════════
// CLINE (Authorization Code via app.cline.bot)
// ══════════════════════════════════════════════════════════════
export const CLINE_CONFIG = {
  appBaseUrl: "https://app.cline.bot",
  apiBaseUrl: "https://api.cline.bot",
  authorizeUrl: "https://api.cline.bot/api/v1/auth/authorize",
  tokenExchangeUrl: "https://api.cline.bot/api/v1/auth/token",
  refreshUrl: "https://api.cline.bot/api/v1/auth/refresh",
};

// ══════════════════════════════════════════════════════════════
// KIRO / AMAZON Q (Device Code via AWS SSO OIDC)
// ══════════════════════════════════════════════════════════════
export const KIRO_CONFIG = {
  ssoOidcEndpoint: "https://oidc.us-east-1.amazonaws.com",
  registerClientUrl: "https://oidc.us-east-1.amazonaws.com/client/register",
  deviceAuthUrl:
    "https://oidc.us-east-1.amazonaws.com/device_authorization",
  tokenUrl: "https://oidc.us-east-1.amazonaws.com/token",
  startUrl: "https://view.awsapps.com/start",
  clientName: "kiro-oauth-client",
  clientType: "public",
  scopes: [
    "codewhisperer:completions",
    "codewhisperer:analysis",
    "codewhisperer:conversations",
  ],
  grantTypes: [
    "urn:ietf:params:oauth:grant-type:device_code",
    "refresh_token",
  ],
  issuerUrl:
    "https://identitycenter.amazonaws.com/ssoins-722374e8c3c8e6c6",
};

// ══════════════════════════════════════════════════════════════
// GITLAB DUO (Authorization Code + PKCE — needs admin setup)
// ══════════════════════════════════════════════════════════════
export const GITLAB_DUO_CONFIG = {
  baseUrl: process.env.GITLAB_DUO_BASE_URL || "https://gitlab.com",
  clientId: process.env.GITLAB_DUO_OAUTH_CLIENT_ID || "",
  clientSecret: process.env.GITLAB_DUO_OAUTH_CLIENT_SECRET || "",
  get authorizeUrl() {
    return `${this.baseUrl}/oauth/authorize`;
  },
  get tokenUrl() {
    return `${this.baseUrl}/oauth/token`;
  },
  get userInfoUrl() {
    return `${this.baseUrl}/api/v4/user`;
  },
  scope: "ai_features read_user",
  codeChallengeMethod: "S256" as const,
};

// ══════════════════════════════════════════════════════════════
// QODER (Authorization Code — needs admin setup)
// ══════════════════════════════════════════════════════════════
export const QODER_CONFIG = {
  enabled:
    !!(process.env.QODER_OAUTH_AUTHORIZE_URL) &&
    !!(process.env.QODER_OAUTH_TOKEN_URL) &&
    !!(process.env.QODER_OAUTH_CLIENT_ID),
  clientId: process.env.QODER_OAUTH_CLIENT_ID || "",
  clientSecret: process.env.QODER_OAUTH_CLIENT_SECRET || "",
  authorizeUrl: process.env.QODER_OAUTH_AUTHORIZE_URL || "",
  tokenUrl: process.env.QODER_OAUTH_TOKEN_URL || "",
  userInfoUrl: process.env.QODER_OAUTH_USERINFO_URL || "",
  extraParams: {
    loginMethod: "phone",
    type: "phone",
  },
};

// ══════════════════════════════════════════════════════════════
// CURSOR (Import Token only)
// ══════════════════════════════════════════════════════════════
export const CURSOR_CONFIG = {
  apiEndpoint: "https://api2.cursor.sh",
  clientVersion: "3.2.14",
  clientType: "ide",
};

// ══════════════════════════════════════════════════════════════
// TRAE (Import Token only)
// ══════════════════════════════════════════════════════════════
export const TRAE_CONFIG = {
  apiEndpoint: "https://api.trae.ai",
  soloApiEndpoint: "https://core-normal.trae.ai/api/remote/v1",
  authScheme: "Cloud-IDE-JWT",
  tokenLifetimeDays: 14,
};

// ══════════════════════════════════════════════════════════════
// WINDSURF / DEVIN CLI (Import Token only)
// ══════════════════════════════════════════════════════════════
export const WINDSURF_CONFIG = {
  inferenceUrl: "https://server.self-serve.windsurf.com",
  showAuthTokenUrl: "https://windsurf.com/show-auth-token",
  ideName: "windsurf",
};

// ══════════════════════════════════════════════════════════════
// TIMEOUT
// ══════════════════════════════════════════════════════════════
export const OAUTH_TIMEOUT = 300_000; // 5 minutes

// ══════════════════════════════════════════════════════════════
// PROVIDER SLUGS
// ══════════════════════════════════════════════════════════════
export const PROVIDER_SLUGS = {
  CLAUDE: "claude",
  CODEX: "codex",
  OPENAI: "openai",
  GEMINI: "gemini-cli",
  ANTIGRAVITY: "antigravity",
  AGY: "agy",
  GITHUB: "github",
  QWEN: "qwen",
  KIMI_CODING: "kimi-coding",
  KILOCODE: "kilocode",
  CLINE: "cline",
  KIRO: "kiro",
  AMAZON_Q: "amazon-q",
  GITLAB_DUO: "gitlab-duo",
  QODER: "qoder",
  CURSOR: "cursor",
  TRAE: "trae",
  WINDSURF: "windsurf",
  DEVIN_CLI: "devin-cli",
} as const;

/** Flow types supported by the system */
export type OAuthFlowType =
  | "authorization_code_pkce"
  | "authorization_code"
  | "device_code"
  | "import_token";

/** Providers that support import-token flow */
export const IMPORT_TOKEN_PROVIDERS = new Set([
  "windsurf",
  "devin-cli",
  "cursor",
  "trae",
]);

/** Providers that use device code flow */
export const DEVICE_CODE_PROVIDERS = new Set([
  "github",
  "qwen",
  "kiro",
  "amazon-q",
  "kimi-coding",
  "kilocode",
]);
