/**
 * OAuth Provider Registry — Per-provider flow logic
 *
 * Each provider defines: config, flowType, buildAuthUrl, exchangeToken,
 * postExchange (optional), mapTokens.
 *
 * Ported from OmniRoute: src/lib/oauth/providers/*.ts
 */

import type { OAuthFlowType } from "./oauthConstants";
import {
  CLAUDE_CONFIG,
  CODEX_CONFIG,
  OPENAI_CONFIG,
  GEMINI_CONFIG,
  ANTIGRAVITY_CONFIG,
  AGY_CONFIG,
  GITHUB_CONFIG,
  QWEN_CONFIG,
  KIMI_CODING_CONFIG,
  KILOCODE_CONFIG,
  CLINE_CONFIG,
  KIRO_CONFIG,
  GITLAB_DUO_CONFIG,
  QODER_CONFIG,
  CURSOR_CONFIG,
  TRAE_CONFIG,
  WINDSURF_CONFIG,
} from "./oauthConstants";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

export interface MappedTokens {
  accessToken: string;
  refreshToken?: string | null;
  idToken?: string | null;
  expiresIn?: number | null;
  scope?: string | null;
  email?: string | null;
  name?: string | null;
  displayName?: string | null;
  projectId?: string | null;
  apiKey?: string | null;
  providerSpecificData?: Record<string, unknown> | null;
}

export interface OAuthProvider {
  config: Record<string, unknown>;
  flowType: OAuthFlowType;
  buildAuthUrl?: (
    config: any,
    redirectUri: string,
    state: string,
    codeChallenge?: string
  ) => string | null;
  exchangeToken?: (
    config: any,
    code: string,
    redirectUri: string,
    codeVerifier?: string,
    state?: string
  ) => Promise<any>;
  requestDeviceCode?: (config: any, codeChallenge?: string) => Promise<any>;
  pollToken?: (
    config: any,
    deviceCode: string,
    codeVerifier?: string,
    extraData?: any
  ) => Promise<{ ok: boolean; data: any }>;
  postExchange?: (tokens: any) => Promise<any>;
  mapTokens: (tokens: any, extra?: any) => MappedTokens;
  validateImportToken?: (token: string) => { valid: boolean; reason?: string };
}

// ══════════════════════════════════════════════════════════════
// HELPER: Base64url decode for JWT parsing
// ══════════════════════════════════════════════════════════════

function base64Decode(str: string): string {
  let base64 = str;
  switch (base64.length % 4) {
    case 2: base64 += "=="; break;
    case 3: base64 += "="; break;
  }
  base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function parseJwtPayload(jwt: string): any {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64Decode(parts[1]));
  } catch { return null; }
}

function generateRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

// ══════════════════════════════════════════════════════════════
// CLAUDE
// ══════════════════════════════════════════════════════════════

const claude: OAuthProvider = {
  config: CLAUDE_CONFIG,
  flowType: "authorization_code_pkce",
  buildAuthUrl: (config, _redirectUri, state, codeChallenge) => {
    const params = new URLSearchParams({
      code: "true",
      client_id: config.clientId,
      response_type: "code",
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(" "),
      code_challenge: codeChallenge!,
      code_challenge_method: config.codeChallengeMethod,
      state,
      prompt: "login",
    });
    return `${config.authorizeUrl}?${params.toString()}`;
  },
  exchangeToken: async (config, code, _redirectUri, codeVerifier, state) => {
    let authCode = code;
    let codeState = "";
    if (authCode.includes("#")) {
      const parts = authCode.split("#");
      authCode = parts[0];
      codeState = parts[1] || "";
    }
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        code: authCode,
        state: codeState || state,
        grant_type: "authorization_code",
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude token exchange failed: ${error}`);
    }
    return response.json();
  },
  postExchange: async (tokens) => {
    if (!tokens?.access_token) return null;
    try {
      const res = await fetch("https://api.anthropic.com/api/claude_cli/bootstrap", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
          "anthropic-beta": "oauth-2025-04-20",
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.oauth_account || null;
    } catch { return null; }
  },
  mapTokens: (tokens, extra) => {
    const bs = extra || {};
    const providerSpecificData: Record<string, unknown> = {
      cliUserID: generateRandomHex(32),
    };
    if (bs.account_uuid) providerSpecificData.accountUUID = bs.account_uuid;
    if (bs.organization_uuid) providerSpecificData.organizationUUID = bs.organization_uuid;
    if (bs.organization_name) providerSpecificData.organizationName = bs.organization_name;
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
      email: bs.account_email || null,
      displayName: bs.account_email || null,
      providerSpecificData,
    };
  },
};

// ══════════════════════════════════════════════════════════════
// CODEX (OpenAI)
// ══════════════════════════════════════════════════════════════

const codex: OAuthProvider = {
  config: CODEX_CONFIG,
  flowType: "authorization_code_pkce",
  buildAuthUrl: (config, redirectUri, state, codeChallenge) => {
    const params: Record<string, string> = {
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scope,
      code_challenge: codeChallenge!,
      code_challenge_method: config.codeChallengeMethod,
      ...config.extraParams,
      state,
    };
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return `${config.authorizeUrl}?${qs}`;
  },
  exchangeToken: async (config, code, redirectUri, codeVerifier) => {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier!,
      }),
    });
    if (!response.ok) throw new Error(`Codex token exchange failed: ${await response.text()}`);
    return response.json();
  },
  postExchange: async (tokens) => {
    if (!tokens.id_token) return { authInfo: null };
    const payload = parseJwtPayload(tokens.id_token);
    return { authInfo: payload?.["https://api.openai.com/auth"] || null };
  },
  mapTokens: (tokens, extra) => {
    let email: string | null = null;
    let authInfo = extra?.authInfo || null;
    if (tokens.id_token) {
      const payload = parseJwtPayload(tokens.id_token);
      email = payload?.email || null;
      if (!authInfo) authInfo = payload?.["https://api.openai.com/auth"] || null;
    }
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
      email,
      providerSpecificData: {
        workspaceId: authInfo?.chatgpt_account_id || null,
        workspacePlanType: authInfo?.chatgpt_plan_type || null,
        chatgptUserId: authInfo?.chatgpt_user_id || null,
      },
    };
  },
};

// ══════════════════════════════════════════════════════════════
// GEMINI CLI
// ══════════════════════════════════════════════════════════════

const gemini: OAuthProvider = {
  config: GEMINI_CONFIG,
  flowType: "authorization_code",
  buildAuthUrl: (config, redirectUri, state) => {
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: config.scopes.join(" "),
      state,
      access_type: "offline",
      prompt: "consent",
    });
    return `${config.authorizeUrl}?${params.toString()}`;
  },
  exchangeToken: async (config, code, redirectUri) => {
    if (!config.clientSecret) {
      throw new Error("Gemini OAuth requires GEMINI_OAUTH_CLIENT_SECRET env var");
    }
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!response.ok) throw new Error(`Gemini token exchange failed: ${await response.text()}`);
    return response.json();
  },
  postExchange: async (tokens) => {
    const userInfoRes = await fetch(`${GEMINI_CONFIG.userInfoUrl}?alt=json`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = userInfoRes.ok ? await userInfoRes.json() : {};
    let projectId = "";
    try {
      const projectRes = await fetch(
        "https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ metadata: {} }),
        }
      );
      if (projectRes.ok) {
        const data = await projectRes.json();
        projectId = data.cloudaicompanionProject?.id || "";
      }
    } catch { /* best effort */ }
    return { userInfo, projectId };
  },
  mapTokens: (tokens, extra) => ({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token ?? null,
    expiresIn: tokens.expires_in,
    scope: tokens.scope,
    email: extra?.userInfo?.email || null,
    projectId: extra?.projectId || null,
  }),
};

// ══════════════════════════════════════════════════════════════
// ANTIGRAVITY (PKCE via Google OAuth)
// ══════════════════════════════════════════════════════════════

const antigravity: OAuthProvider = {
  config: ANTIGRAVITY_CONFIG,
  flowType: "authorization_code",
  buildAuthUrl: (config, redirectUri, state, codeChallenge) => {
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: config.scopes.join(" "),
      state,
      access_type: "offline",
      prompt: "consent",
    });
    if (codeChallenge) {
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }
    return `${config.authorizeUrl}?${params.toString()}`;
  },
  exchangeToken: async (config, code, redirectUri, codeVerifier) => {
    const bodyParams: Record<string, string> = {
      grant_type: "authorization_code",
      client_id: config.clientId,
      code,
      redirect_uri: redirectUri,
    };
    if (config.clientSecret) bodyParams.client_secret = config.clientSecret;
    if (codeVerifier) bodyParams.code_verifier = codeVerifier;
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(bodyParams),
    });
    if (!response.ok) throw new Error(`Antigravity token exchange failed: ${await response.text()}`);
    return response.json();
  },
  postExchange: async (tokens) => {
    const userInfoRes = await fetch(`${ANTIGRAVITY_CONFIG.userInfoUrl}?alt=json`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = userInfoRes.ok ? await userInfoRes.json() : {};
    let projectId = "";
    try {
      const loadRes = await fetch(ANTIGRAVITY_CONFIG.loadCodeAssistEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata: {} }),
      });
      if (loadRes.ok) {
        const data = await loadRes.json();
        projectId = data.cloudaicompanionProject?.id || "";
      }
    } catch { /* best effort */ }
    return { userInfo, projectId };
  },
  mapTokens: (tokens, extra) => ({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    scope: tokens.scope,
    email: extra?.userInfo?.email || null,
    providerSpecificData: {
      projectId: extra?.projectId || null,
    },
  }),
};

// ══════════════════════════════════════════════════════════════
// GITHUB COPILOT (Device Code)
// ══════════════════════════════════════════════════════════════

const github: OAuthProvider = {
  config: GITHUB_CONFIG,
  flowType: "device_code",
  requestDeviceCode: async (config) => {
    const response = await fetch(config.deviceCodeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ client_id: config.clientId, scope: config.scopes }),
    });
    if (!response.ok) throw new Error(`GitHub device code request failed: ${await response.text()}`);
    return response.json();
  },
  pollToken: async (config, deviceCode) => {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: config.clientId,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    let data;
    try { data = await response.json(); } catch { data = { error: "invalid_response" }; }
    return { ok: response.ok && !!data.access_token, data };
  },
  postExchange: async (tokens) => {
    const copilotRes = await fetch(GITHUB_CONFIG.copilotTokenUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
        "X-GitHub-Api-Version": GITHUB_CONFIG.apiVersion,
        "User-Agent": GITHUB_CONFIG.userAgent,
      },
    });
    const copilotToken = copilotRes.ok ? await copilotRes.json() : {};
    const userRes = await fetch(GITHUB_CONFIG.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
        "X-GitHub-Api-Version": GITHUB_CONFIG.apiVersion,
        "User-Agent": GITHUB_CONFIG.userAgent,
      },
    });
    const userInfo = userRes.ok ? await userRes.json() : {};
    return { copilotToken, userInfo };
  },
  mapTokens: (tokens, extra) => ({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    email: extra?.userInfo?.email || null,
    displayName: extra?.userInfo?.login || null,
    providerSpecificData: {
      copilotToken: extra?.copilotToken?.token,
      copilotTokenExpiresAt: extra?.copilotToken?.expires_at,
      githubUserId: extra?.userInfo?.id,
      githubLogin: extra?.userInfo?.login,
    },
  }),
};

// ══════════════════════════════════════════════════════════════
// QWEN (Device Code + PKCE)
// ══════════════════════════════════════════════════════════════

const qwen: OAuthProvider = {
  config: QWEN_CONFIG,
  flowType: "device_code",
  requestDeviceCode: async (config, codeChallenge) => {
    const body: Record<string, string> = {
      client_id: config.clientId,
      scope: config.scope,
    };
    if (codeChallenge) {
      body.code_challenge = codeChallenge;
      body.code_challenge_method = config.codeChallengeMethod;
    }
    const response = await fetch(config.deviceCodeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(body),
    });
    if (!response.ok) throw new Error(`Qwen device code failed: ${await response.text()}`);
    return response.json();
  },
  pollToken: async (config, deviceCode, codeVerifier) => {
    const body: Record<string, string> = {
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      client_id: config.clientId,
      device_code: deviceCode,
    };
    if (codeVerifier) body.code_verifier = codeVerifier;
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(body),
    });
    return { ok: response.ok, data: await response.json() };
  },
  mapTokens: (tokens) => {
    let email: string | null = null;
    let displayName: string | null = null;
    if (tokens.id_token) {
      const decoded = parseJwtPayload(tokens.id_token);
      email = decoded?.email || decoded?.preferred_username || null;
      displayName = decoded?.name || email;
    }
    if (!email && tokens.access_token) {
      const decoded = parseJwtPayload(tokens.access_token);
      email = decoded?.email || decoded?.preferred_username || decoded?.sub || null;
      displayName = decoded?.name || email;
    }
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      idToken: tokens.id_token,
      email,
      displayName,
      providerSpecificData: { resourceUrl: tokens.resource_url },
    };
  },
};

// ══════════════════════════════════════════════════════════════
// KIMI CODING (Device Code)
// ══════════════════════════════════════════════════════════════

const kimiCoding: OAuthProvider = {
  config: KIMI_CODING_CONFIG,
  flowType: "device_code",
  requestDeviceCode: async (config) => {
    const response = await fetch(config.deviceCodeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ client_id: config.clientId }),
    });
    if (!response.ok) throw new Error(`Kimi device code failed: ${await response.text()}`);
    const data = await response.json();
    return {
      device_code: data.device_code,
      user_code: data.user_code,
      verification_uri: data.verification_uri || "https://www.kimi.com/code/authorize_device",
      verification_uri_complete: data.verification_uri_complete || data.verification_uri,
      expires_in: data.expires_in,
      interval: data.interval || 5,
    };
  },
  pollToken: async (config, deviceCode) => {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: config.clientId,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    let data;
    try { data = await response.json(); } catch { data = { error: "invalid_response" }; }
    return { ok: response.ok && !!data.access_token, data };
  },
  mapTokens: (tokens) => ({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    scope: tokens.scope,
  }),
};

// ══════════════════════════════════════════════════════════════
// KILOCODE (Custom Device Auth)
// ══════════════════════════════════════════════════════════════

const kilocode: OAuthProvider = {
  config: KILOCODE_CONFIG,
  flowType: "device_code",
  requestDeviceCode: async (config) => {
    const response = await fetch(config.initiateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      if (response.status === 429) throw new Error("Too many pending requests. Try again later.");
      throw new Error(`KiloCode device auth failed: ${await response.text()}`);
    }
    const data = await response.json();
    return {
      device_code: data.code,
      user_code: data.code,
      verification_uri: data.verificationUrl,
      verification_uri_complete: data.verificationUrl,
      expires_in: data.expiresIn || 300,
      interval: 3,
    };
  },
  pollToken: async (config, deviceCode) => {
    const response = await fetch(`${config.pollUrlBase}/${deviceCode}`);
    if (response.status === 202) return { ok: false, data: { error: "authorization_pending" } };
    if (response.status === 403) return { ok: false, data: { error: "access_denied" } };
    if (response.status === 410) return { ok: false, data: { error: "expired_token" } };
    if (!response.ok) return { ok: false, data: { error: "poll_failed" } };
    const data = await response.json();
    if (data.status === "approved" && data.token) {
      return { ok: true, data: { access_token: data.token, _userEmail: data.userEmail } };
    }
    return { ok: false, data: { error: "authorization_pending" } };
  },
  mapTokens: (tokens) => ({
    accessToken: tokens.access_token,
    refreshToken: null,
    expiresIn: null,
    email: tokens._userEmail || null,
  }),
};

// ══════════════════════════════════════════════════════════════
// CLINE (Authorization Code via app.cline.bot)
// ══════════════════════════════════════════════════════════════

const cline: OAuthProvider = {
  config: CLINE_CONFIG,
  flowType: "authorization_code",
  buildAuthUrl: (config, redirectUri) => {
    const params = new URLSearchParams({
      client_type: "extension",
      callback_url: redirectUri,
      redirect_uri: redirectUri,
    });
    return `${config.authorizeUrl}?${params.toString()}`;
  },
  exchangeToken: async (config, code, redirectUri) => {
    // Cline may embed tokens as base64 JSON in the auth code
    try {
      let base64 = code;
      try { base64 = decodeURIComponent(base64); } catch { /* already decoded */ }
      const padding = 4 - (base64.length % 4);
      if (padding !== 4) base64 += "=".repeat(padding);
      const decoded = atob(base64);
      const lastBrace = decoded.lastIndexOf("}");
      if (lastBrace === -1) throw new Error("No JSON found");
      const tokenData = JSON.parse(decoded.substring(0, lastBrace + 1));
      return {
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        email: tokenData.email,
        firstName: tokenData.firstName,
        lastName: tokenData.lastName,
        expires_at: tokenData.expiresAt,
      };
    } catch {
      // Fallback: regular token exchange
      const response = await fetch(config.tokenExchangeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_type: "extension",
          redirect_uri: redirectUri,
        }),
      });
      if (!response.ok) throw new Error(`Cline token exchange failed: ${await response.text()}`);
      const data = await response.json();
      return {
        access_token: data.data?.accessToken || data.accessToken,
        refresh_token: data.data?.refreshToken || data.refreshToken,
        email: data.data?.userInfo?.email || "",
        expires_at: data.data?.expiresAt || data.expiresAt,
      };
    }
  },
  mapTokens: (tokens) => {
    const firstName = tokens.firstName || "";
    const lastName = tokens.lastName || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_at
        ? Math.floor((new Date(tokens.expires_at).getTime() - Date.now()) / 1000)
        : 3600,
      name: fullName || tokens.email || null,
      email: tokens.email || null,
    };
  },
};

// ══════════════════════════════════════════════════════════════
// KIRO / AMAZON Q (Device Code via AWS SSO OIDC)
// ══════════════════════════════════════════════════════════════

const kiro: OAuthProvider = {
  config: KIRO_CONFIG,
  flowType: "device_code",
  requestDeviceCode: async (config) => {
    // Step 1: Register client
    const registerRes = await fetch(config.registerClientUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        clientName: config.clientName,
        clientType: config.clientType,
        scopes: config.scopes,
        grantTypes: config.grantTypes,
        issuerUrl: config.issuerUrl,
      }),
    });
    if (!registerRes.ok) throw new Error(`Kiro client registration failed: ${await registerRes.text()}`);
    const clientInfo = await registerRes.json();

    // Step 2: Request device authorization
    const deviceRes = await fetch(config.deviceAuthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        clientId: clientInfo.clientId,
        clientSecret: clientInfo.clientSecret,
        startUrl: config.startUrl,
      }),
    });
    if (!deviceRes.ok) throw new Error(`Kiro device auth failed: ${await deviceRes.text()}`);
    const deviceData = await deviceRes.json();
    return {
      device_code: deviceData.deviceCode,
      user_code: deviceData.userCode,
      verification_uri: deviceData.verificationUri,
      verification_uri_complete: deviceData.verificationUriComplete,
      expires_in: deviceData.expiresIn,
      interval: deviceData.interval || 5,
      _clientId: clientInfo.clientId,
      _clientSecret: clientInfo.clientSecret,
      _region: "us-east-1",
    };
  },
  pollToken: async (_config, deviceCode, _codeVerifier, extraData) => {
    const tokenRegion = String(extraData?._region || "us-east-1");
    const tokenUrl = `https://oidc.${tokenRegion}.amazonaws.com/token`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        clientId: extraData?._clientId,
        clientSecret: extraData?._clientSecret,
        deviceCode,
        grantType: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    let data;
    try { data = await response.json(); } catch { data = { error: "invalid_response" }; }
    if (data.accessToken) {
      return {
        ok: true,
        data: {
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
          expires_in: data.expiresIn,
          _clientId: extraData?._clientId,
          _clientSecret: extraData?._clientSecret,
          _region: tokenRegion,
        },
      };
    }
    return { ok: false, data: { error: data.error || "authorization_pending" } };
  },
  postExchange: async (tokenData) => {
    const accessToken = tokenData?.access_token;
    if (!accessToken) return null;
    const region = String(tokenData?._region || "us-east-1");
    const runtimeHost = region === "us-east-1"
      ? "https://codewhisperer.us-east-1.amazonaws.com"
      : `https://q.${region}.amazonaws.com`;
    try {
      const profRes = await fetch(`${runtimeHost}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.0",
          Accept: "application/json",
          "x-amz-target": "AmazonCodeWhispererService.ListAvailableProfiles",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ maxResults: 10 }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!profRes.ok) return null;
      const profData = await profRes.json();
      const profiles = Array.isArray(profData?.profiles) ? profData.profiles : [];
      const arn = profiles[0]?.arn;
      return arn ? { profileArn: arn } : null;
    } catch { return null; }
  },
  mapTokens: (tokens, extra) => ({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    providerSpecificData: {
      clientId: tokens._clientId,
      clientSecret: tokens._clientSecret,
      region: tokens._region,
      ...(extra?.profileArn ? { profileArn: extra.profileArn } : {}),
    },
  }),
};

// ══════════════════════════════════════════════════════════════
// GITLAB DUO (PKCE — needs admin-configured client ID)
// ══════════════════════════════════════════════════════════════

const gitlabDuo: OAuthProvider = {
  config: GITLAB_DUO_CONFIG,
  flowType: "authorization_code_pkce",
  buildAuthUrl: (config, redirectUri, state, codeChallenge) => {
    if (!config.clientId) throw new Error("GitLab Duo OAuth requires GITLAB_DUO_OAUTH_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      scope: config.scope,
      code_challenge: codeChallenge!,
      code_challenge_method: config.codeChallengeMethod,
    });
    return `${config.authorizeUrl}?${params.toString()}`;
  },
  exchangeToken: async (config, code, redirectUri, codeVerifier) => {
    const body = new URLSearchParams({
      client_id: config.clientId,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier!,
    });
    if (config.clientSecret) body.set("client_secret", config.clientSecret);
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
    if (!response.ok) throw new Error(`GitLab Duo token exchange failed: ${await response.text()}`);
    return response.json();
  },
  postExchange: async (tokens) => {
    const userRes = await fetch(GITLAB_DUO_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" },
    });
    const userInfo = userRes.ok ? await userRes.json() : {};
    return { userInfo };
  },
  mapTokens: (tokens, extra) => {
    const userInfo = extra?.userInfo || {};
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      email: userInfo.email || userInfo.public_email || null,
      name: userInfo.name || userInfo.username || null,
      providerSpecificData: {
        baseUrl: GITLAB_DUO_CONFIG.baseUrl,
        gitlabUserId: userInfo.id,
        gitlabUsername: userInfo.username,
      },
    };
  },
};

// ══════════════════════════════════════════════════════════════
// QODER (Authorization Code — needs admin setup)
// ══════════════════════════════════════════════════════════════

const qoder: OAuthProvider = {
  config: QODER_CONFIG,
  flowType: "authorization_code",
  buildAuthUrl: (config, redirectUri, state) => {
    if (!config?.enabled || !config?.authorizeUrl) return null;
    const params = new URLSearchParams({
      loginMethod: config.extraParams.loginMethod,
      type: config.extraParams.type,
      redirect: redirectUri,
      state,
      client_id: config.clientId,
    });
    return `${config.authorizeUrl}?${params.toString()}`;
  },
  exchangeToken: async (config, code, redirectUri) => {
    if (!config?.enabled) throw new Error("Qoder OAuth not configured");
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };
    if (config.clientSecret) {
      headers.Authorization = `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`;
    }
    const bodyParams: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
    };
    if (config.clientSecret) bodyParams.client_secret = config.clientSecret;
    const response = await fetch(config.tokenUrl, { method: "POST", headers, body: new URLSearchParams(bodyParams) });
    if (!response.ok) throw new Error(`Qoder token exchange failed: ${await response.text()}`);
    return response.json();
  },
  postExchange: async (tokens) => {
    if (!QODER_CONFIG.enabled || !QODER_CONFIG.userInfoUrl) return {};
    const userInfoRes = await fetch(
      `${QODER_CONFIG.userInfoUrl}?accessToken=${encodeURIComponent(tokens.access_token)}`,
      { headers: { Accept: "application/json" } }
    );
    const result = userInfoRes.ok ? await userInfoRes.json() : {};
    return { userInfo: result.success ? result.data : {} };
  },
  mapTokens: (tokens, extra) => ({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    apiKey: extra?.userInfo?.apiKey || null,
    email: extra?.userInfo?.email || extra?.userInfo?.phone || null,
    displayName: extra?.userInfo?.nickname || extra?.userInfo?.name || null,
  }),
};

// ══════════════════════════════════════════════════════════════
// CURSOR (Import Token only)
// ══════════════════════════════════════════════════════════════

const cursor: OAuthProvider = {
  config: CURSOR_CONFIG,
  flowType: "import_token",
  mapTokens: (tokens) => ({
    accessToken: tokens.accessToken || tokens.access_token,
    refreshToken: null,
    expiresIn: tokens.expiresIn || 86400,
    providerSpecificData: { machineId: tokens.machineId, authMethod: "imported" },
  }),
};

// ══════════════════════════════════════════════════════════════
// TRAE (Import Token only)
// ══════════════════════════════════════════════════════════════

const trae: OAuthProvider = {
  config: TRAE_CONFIG,
  flowType: "import_token",
  mapTokens: (tokens) => ({
    accessToken: tokens.accessToken || tokens.access_token,
    refreshToken: tokens.refreshToken ?? null,
    expiresIn: tokens.expiresIn || TRAE_CONFIG.tokenLifetimeDays * 24 * 60 * 60,
    providerSpecificData: {
      scope: tokens.scope || "marscode-us",
      tenant: tokens.tenant || "marscode",
      region: tokens.region || "US-East",
      authMethod: "imported",
    },
  }),
};

// ══════════════════════════════════════════════════════════════
// WINDSURF / DEVIN CLI (Import Token only)
// ══════════════════════════════════════════════════════════════

const windsurf: OAuthProvider = {
  config: WINDSURF_CONFIG,
  flowType: "import_token",
  validateImportToken: (token: string) => {
    const trimmed = (token ?? "").trim();
    if (!trimmed) return { valid: false, reason: "Token is empty" };
    if (trimmed.length < 16) return { valid: false, reason: "Token is too short" };
    return { valid: true };
  },
  mapTokens: (tokens) => ({
    accessToken: tokens.accessToken || tokens.access_token,
    refreshToken: null,
    expiresIn: null,
  }),
};

// ══════════════════════════════════════════════════════════════
// PROVIDER REGISTRY
// ══════════════════════════════════════════════════════════════

export const PROVIDERS: Record<string, OAuthProvider> = {
  claude,
  codex,
  openai: { ...codex, config: OPENAI_CONFIG },
  "gemini-cli": gemini,
  antigravity,
  agy: { ...antigravity, config: AGY_CONFIG },
  github,
  qwen,
  "kimi-coding": kimiCoding,
  kilocode,
  cline,
  kiro,
  "amazon-q": kiro,
  "gitlab-duo": gitlabDuo,
  qoder,
  cursor,
  trae,
  windsurf,
  "devin-cli": windsurf,
};

// ══════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════

export function getProvider(name: string): OAuthProvider {
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown OAuth provider: ${name}`);
  return provider;
}

export function getProviderNames(): string[] {
  return Object.keys(PROVIDERS);
}

/** Get all providers that support a given flow type */
export function getProvidersByFlowType(flowType: OAuthFlowType): string[] {
  return Object.entries(PROVIDERS)
    .filter(([, p]) => p.flowType === flowType)
    .map(([name]) => name);
}
