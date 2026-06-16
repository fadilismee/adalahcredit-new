import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { detectRateLimitCooldown, buildConnectionHeaders } from "./proxyConnections";
// Connection tracking type from dataModel

/**
 * OpenAI-compatible API Proxy
 *
 * Endpoints:
 *   POST /v1/chat/completions  (supports stream: true)
 *   GET  /v1/models
 *
 * Auth: Bearer token using AdalahCredit API key (sk-ac-...)
 */

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function jsonResp(data: unknown, statusOrHeaders: number | Record<string, string> = 200) {
  const status = typeof statusOrHeaders === "number" ? statusOrHeaders : 200;
  const extraHeaders = typeof statusOrHeaders === "object" ? statusOrHeaders : {};
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}

function errorResp(message: string, status: number, type = "invalid_request_error") {
  return jsonResp({ error: { message, type, code: status } }, status);
}

function corsResp() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/* Map model ID → provider info */
const MODEL_PROVIDER_MAP: Record<string, { provider: string; realModel: string }> = {
  // OpenAI
  "gpt-4o": { provider: "openai", realModel: "gpt-4o" },
  "gpt-4o-mini": { provider: "openai", realModel: "gpt-4o-mini" },
  "gpt-4.1": { provider: "openai", realModel: "gpt-4.1" },
  "gpt-4.1-mini": { provider: "openai", realModel: "gpt-4.1-mini" },
  "gpt-4.1-nano": { provider: "openai", realModel: "gpt-4.1-nano" },
  "o3": { provider: "openai", realModel: "o3" },
  "o3-mini": { provider: "openai", realModel: "o3-mini" },
  "o4-mini": { provider: "openai", realModel: "o4-mini" },
  // Anthropic
  "claude-opus-4": { provider: "anthropic", realModel: "claude-opus-4-20250514" },
  "claude-sonnet-4": { provider: "anthropic", realModel: "claude-sonnet-4-20250514" },
  "claude-3.5-haiku": { provider: "anthropic", realModel: "claude-3-5-haiku-20241022" },
  // Google
  "gemini-2.5-pro": { provider: "google", realModel: "gemini-2.5-pro-preview-06-05" },
  "gemini-2.5-flash": { provider: "google", realModel: "gemini-2.5-flash-preview-05-20" },
  "gemini-2.0-flash": { provider: "google", realModel: "gemini-2.0-flash" },
  // Meta (via Together/Groq)
  "llama-4-maverick": { provider: "meta", realModel: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8" },
  "llama-4-scout": { provider: "meta", realModel: "meta-llama/Llama-4-Scout-17B-16E-Instruct" },
  // Mistral
  "mistral-large": { provider: "mistral", realModel: "mistral-large-latest" },
  "codestral": { provider: "mistral", realModel: "codestral-latest" },
  // xAI
  "grok-3": { provider: "xai", realModel: "grok-3" },
  "grok-3-mini": { provider: "xai", realModel: "grok-3-mini" },
  // DeepSeek
  "deepseek-r1": { provider: "deepseek", realModel: "deepseek-reasoner" },
  "deepseek-v3": { provider: "deepseek", realModel: "deepseek-chat" },
  // Cohere
  "command-r-plus": { provider: "cohere", realModel: "command-r-plus" },
  "command-r": { provider: "cohere", realModel: "command-r" },
};

/** Fallback providers — if primary provider fails (500/502/503), try alternatives */
const PROVIDER_FALLBACKS: Record<string, { provider: string; realModel: string }[]> = {
  "gpt-4o": [{ provider: "openai", realModel: "gpt-4o" }],
  "gpt-4o-mini": [{ provider: "openai", realModel: "gpt-4o-mini" }],
  "deepseek-v3": [{ provider: "deepseek", realModel: "deepseek-chat" }],
  // Cross-provider fallbacks for similar capability models
  "claude-sonnet-4": [{ provider: "openai", realModel: "gpt-4o" }],
  "gemini-2.5-pro": [{ provider: "openai", realModel: "gpt-4o" }],
  "grok-3": [{ provider: "openai", realModel: "gpt-4o" }],
};

const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  mistral: "https://api.mistral.ai/v1",
  xai: "https://api.x.ai/v1",
  deepseek: "https://api.deepseek.com/v1",
  cohere: "https://api.cohere.com/v2",
};

/**
 * Maps our internal modelId → the real provider API model ID.
 * Only needed when our modelId differs from what the provider expects.
 */
const REAL_MODEL_ID_MAP: Record<string, string> = {
  // Groq
  "groq/llama-4-scout": "meta-llama/llama-4-scout-17b-16e-instruct",
  "groq/llama-4-maverick": "meta-llama/llama-4-maverick-17b-128e-instruct",
  "groq/llama-3.3-70b": "llama-3.3-70b-versatile",
  "groq/llama-3.1-8b": "llama-3.1-8b-instant",
  "groq/qwen3-32b": "qwen/qwen3-32b",
  "groq/gemma2-9b": "gemma2-9b-it",
  // NVIDIA NIM
  "nv/llama-3.3-70b": "meta/llama-3.3-70b-instruct",
  "nv/mistral-large": "mistralai/mistral-large-2-instruct",
  // Together
  "together/qwen-2.5-72b": "Qwen/Qwen2.5-72B-Instruct-Turbo",
  // Fireworks
  "fw/llama-4-maverick": "accounts/fireworks/models/llama4-maverick-instruct-basic",
  "fw/qwen-2.5-72b": "accounts/fireworks/models/qwen2p5-72b-instruct",
};

/* ═══════════════════════════════════════════════════════════════
   STREAMING HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Build an SSE line from data */
function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/** Create an OpenAI-format stream chunk */
function streamChunk(id: string, model: string, delta: { role?: string; content?: string }, finishReason: string | null = null) {
  return {
    id,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  };
}

/**
 * Wrap a provider SSE stream → OpenAI-format SSE stream.
 * For OpenAI-compatible providers this is mostly pass-through (just rewrite model name).
 * For Anthropic we translate event types.
 */
function createStreamTransform(
  provider: string,
  model: string,
  completionId: string,
): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          continue;
        }

        try {
          const parsed = JSON.parse(payload);

          if (provider === "anthropic") {
            // Anthropic SSE → OpenAI chunk format
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              controller.enqueue(encoder.encode(sseEvent(
                streamChunk(completionId, model, { content: parsed.delta.text })
              )));
            } else if (parsed.type === "message_stop") {
              controller.enqueue(encoder.encode(sseEvent(
                streamChunk(completionId, model, {}, "stop")
              )));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            }
          } else {
            // OpenAI-compatible: just rewrite model name
            if (parsed.choices) {
              parsed.model = model;
              parsed.id = completionId;
              controller.enqueue(encoder.encode(sseEvent(parsed)));
            }
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            }
          }
        } catch {
          // skip unparseable lines
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        // handle any remaining buffer
        if (buffer.includes("[DONE]")) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }
      }
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   PROVIDER REQUEST BUILDERS
   ═══════════════════════════════════════════════════════════════ */

function buildAnthropicRequest(body: any, realModel: string, apiKey: string, baseUrl: string, stream: boolean) {
  return {
    url: `${baseUrl}/messages`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: realModel,
        max_tokens: body.max_tokens || 4096,
        messages: body.messages,
        temperature: body.temperature,
        top_p: body.top_p,
        stream,
      }),
    },
  };
}

function buildGoogleRequest(body: any, realModel: string, apiKey: string, baseUrl: string, stream: boolean, useBearer = false) {
  const geminiMessages = body.messages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const endpoint = stream ? "streamGenerateContent" : "generateContent";
  // OAuth tokens use Bearer header; API keys use ?key= query param
  const urlParams = useBearer
    ? (stream ? "?alt=sse" : "")
    : `?key=${apiKey}${stream ? "&alt=sse" : ""}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (useBearer) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return {
    url: `${baseUrl}/models/${realModel}:${endpoint}${urlParams}`,
    init: {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: body.temperature,
          topP: body.top_p,
          maxOutputTokens: body.max_tokens || 4096,
        },
      }),
    },
  };
}

function buildCohereRequest(body: any, realModel: string, apiKey: string, baseUrl: string, stream: boolean) {
  return {
    url: `${baseUrl}/chat`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: realModel,
        messages: body.messages,
        temperature: body.temperature,
        max_tokens: body.max_tokens || 4096,
        stream,
      }),
    },
  };
}

function buildOpenAICompatRequest(body: any, realModel: string, apiKey: string, baseUrl: string, stream: boolean) {
  // Strip internal properties before forwarding to provider
  const { _reqHash, ...cleanBody } = body;
  return {
    url: `${baseUrl}/chat/completions`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...cleanBody, model: realModel, stream }),
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   NON-STREAMING RESPONSE CONVERTERS
   ═══════════════════════════════════════════════════════════════ */

function convertAnthropicResponse(data: any, model: string) {
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  return {
    responseData: {
      id: data.id || `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: { role: "assistant", content: data.content?.[0]?.text || "" },
        finish_reason: data.stop_reason === "end_turn" ? "stop" : data.stop_reason || "stop",
      }],
      usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
    },
    inputTokens,
    outputTokens,
  };
}

function convertGoogleResponse(data: any, model: string) {
  const inputTokens = data.usageMetadata?.promptTokenCount || 0;
  const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return {
    responseData: {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
      usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
    },
    inputTokens,
    outputTokens,
  };
}

function convertCohereResponse(data: any, model: string) {
  const inputTokens = data.usage?.tokens?.input_tokens || 0;
  const outputTokens = data.usage?.tokens?.output_tokens || 0;
  return {
    responseData: {
      id: data.id || `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{ index: 0, message: { role: "assistant", content: data.message?.content?.[0]?.text || "" }, finish_reason: "stop" }],
      usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
    },
    inputTokens,
    outputTokens,
  };
}

/* ═══════════════════════════════════════════════════════════════
   POST /v1/chat/completions
   ═══════════════════════════════════════════════════════════════ */

export const chatCompletions = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") return corsResp();

  // 1. Extract API key
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResp("Missing or invalid Authorization header. Use: Bearer sk-ac-...", 401, "authentication_error");
  }
  const apiKeyRaw = authHeader.slice(7).trim();

  // 2. Validate key
  const keyInfo = await ctx.runQuery(internal.proxyInternal.validateApiKey, { rawKey: apiKeyRaw });
  if (!keyInfo) return errorResp("Invalid API key", 401, "authentication_error");
  if (keyInfo.status !== "active") return errorResp("API key is revoked or expired", 403, "authentication_error");

  // 3. Parse body first (need model for access check)
  let body: any;
  try { body = await request.json(); } catch { return errorResp("Invalid JSON body", 400); }

  const model = body.model as string;
  if (!model) return errorResp("Missing 'model' field", 400);

  // 3b. Check allowed models per key
  if (keyInfo.allowedModels && keyInfo.allowedModels.length > 0 && !keyInfo.allowedModels.includes(model)) {
    return errorResp(`Model '${model}' is not allowed for this API key. Allowed: ${keyInfo.allowedModels.join(", ")}`, 403, "permission_error");
  }

  // 3c. IP allowlist check
  if (keyInfo.allowedIPs && keyInfo.allowedIPs.length > 0) {
    const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    if (!keyInfo.allowedIPs.includes(clientIP)) {
      return errorResp(`IP '${clientIP}' is not allowed for this API key`, 403, "permission_error");
    }
  }

  // Dynamic model resolution — check DB first, fallback to static map
  const dynamicResolve = await ctx.runQuery(internal.providerAuth.resolveModel, { modelId: model });
  const rawInfo = dynamicResolve
    ? { provider: dynamicResolve.primary.provider, realModel: dynamicResolve.primary.realModel }
    : MODEL_PROVIDER_MAP[model];
  if (!rawInfo) return errorResp(`Model '${model}' not supported. Use GET /v1/models for available models.`, 400);
  // Map internal modelId to real provider API model ID
  const providerInfo = {
    ...rawInfo,
    realModel: REAL_MODEL_ID_MAP[rawInfo.realModel] || rawInfo.realModel,
  };

  // 4. Enterprise access check — plan tier + credits + balance
  const accessCheck = await ctx.runQuery(internal.subscriptionEngine.checkModelAccess, {
    userId: keyInfo.userId,
    modelId: model,
    provider: providerInfo.provider,
  });

  if (!accessCheck.allowed) {
    if (accessCheck.upgradeNeeded) {
      return errorResp(
        `Model '${model}' requires ${accessCheck.modelTier} tier. Your plan (${accessCheck.userPlan}) only allows: ${accessCheck.allowedTiers.join(", ")}. Upgrade at /topup`,
        403,
        "plan_limit_error"
      );
    }
    if (accessCheck.renewNeeded) {
      return errorResp("Subscription period expired. Please renew at /topup", 402, "billing_error");
    }
    if (accessCheck.topUpNeeded) {
      return errorResp("Insufficient credits. Please top up at /topup", 402, "billing_error");
    }
    return errorResp("Access denied", 403, "permission_error");
  }

  // 4b. Rate limiting (use plan-level rate limit)
  const effectiveRateLimit = Math.max(keyInfo.rateLimit, accessCheck.planRateLimit);
  const rlCheck = await ctx.runQuery(internal.proxyInternal.checkRateLimit, {
    apiKeyId: keyInfo.keyId,
    rateLimit: effectiveRateLimit,
  });
  if (!rlCheck.allowed) {
    return errorResp(
      `Rate limit exceeded: ${rlCheck.current}/${rlCheck.limit} requests per minute. Upgrade your plan for higher limits.`,
      429,
      "rate_limit_error"
    );
  }

  // 4d. Response cache check (non-streaming only, deterministic requests with temp=0)
  const wantStream = body.stream === true;
  if (!wantStream && (body.temperature === 0 || body.temperature === undefined)) {
    const cacheKey = JSON.stringify({ model, messages: body.messages, max_tokens: body.max_tokens });
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(cacheKey));
    const reqHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    const cached = await ctx.runQuery(internal.proxyInternal.getCachedResponse, { requestHash: reqHash });
    if (cached) {
      void ctx.runMutation(internal.proxyInternal.incrementCacheHit, { cacheId: cached.cacheId });
      const costInfo = await ctx.runQuery(internal.proxyInternal.getModelCost, { provider: providerInfo.provider, modelId: model });
      const costCents = costInfo
        ? Math.round(((cached.inputTokens / 1_000_000) * costInfo.inputPricePer1M + (cached.outputTokens / 1_000_000) * costInfo.outputPricePer1M) * 100)
        : 0;
      await ctx.runMutation(internal.proxyInternal.logRequest, {
        apiKeyId: keyInfo.keyId, model, provider: providerInfo.provider,
        inputTokens: cached.inputTokens, outputTokens: cached.outputTokens,
        latencyMs: 0, status: "success", cost: costCents,
      });
      const resp = JSON.parse(cached.responseJson);
      return jsonResp(resp, { "X-Cache": "HIT" });
    }
    // Store reqHash for later caching
    (body as any)._reqHash = reqHash;
  }

  // 5. Get provider credentials (supports api_key, oauth, cookie, free)
  const providerAuth = await ctx.runQuery(internal.providerAuth.getProviderAuth, { provider: providerInfo.provider });
  const providerConfig = await ctx.runQuery(internal.proxyInternal.getProviderKey, { provider: providerInfo.provider });

  // For free/oauth/cookie providers, we may not have a traditional apiKey
  const hasAuth = providerAuth && providerAuth.quotaAvailable && providerAuth.type !== "oauth_expired";
  const hasApiKey = providerConfig?.apiKey;
  if (!hasAuth && !hasApiKey) return errorResp(`Provider '${providerInfo.provider}' is not configured. Contact admin.`, 503, "server_error");

  // Determine effective credentials — prefer auth layer, fallback to providerConfig
  const effectiveApiKey = providerConfig?.apiKey || providerAuth?.headers?.["Authorization"]?.replace("Bearer ", "") || "";
  const effectiveBaseUrl = providerAuth?.baseUrl || providerConfig?.baseUrl || PROVIDER_BASE_URLS[providerInfo.provider] || "";
  const startTime = Date.now();

  // 6. Build provider request
  let reqConfig: { url: string; init: RequestInit };
  switch (providerInfo.provider) {
    case "anthropic": reqConfig = buildAnthropicRequest(body, providerInfo.realModel, effectiveApiKey, effectiveBaseUrl, wantStream); break;
    case "google":    reqConfig = buildGoogleRequest(body, providerInfo.realModel, effectiveApiKey, effectiveBaseUrl, wantStream, !!(providerAuth && providerAuth.type !== "api_key")); break;
    case "cohere":    reqConfig = buildCohereRequest(body, providerInfo.realModel, effectiveApiKey, effectiveBaseUrl, wantStream); break;
    default:          reqConfig = buildOpenAICompatRequest(body, providerInfo.realModel, effectiveApiKey, effectiveBaseUrl, wantStream); break;
  }

  // Overlay custom auth headers for OAuth/cookie/free providers
  if (providerAuth && providerAuth.type !== "api_key" && providerAuth.headers) {
    const existingHeaders = (reqConfig.init.headers as Record<string, string>) || {};
    reqConfig.init.headers = { ...existingHeaders, ...(providerAuth.headers as Record<string, string>) } as HeadersInit;
  }

  // 7. Fetch from provider (with 4-tier fallback: Subscription → API Key → Cheap → Free)
  let providerResponse: Response = undefined as unknown as Response;
  let activeProvider = providerInfo.provider;

  // Build dynamic + static fallback list
  const dynamicFallbacks = dynamicResolve?.fallbacks || [];
  const staticFallbacks = PROVIDER_FALLBACKS[model] || [];
  const allFallbacks = [
    ...dynamicFallbacks.map((f: { provider: string; realModel: string }) => ({ provider: f.provider, realModel: f.realModel })),
    ...staticFallbacks.filter((sf) => !dynamicFallbacks.some((df: { provider: string }) => df.provider === sf.provider)),
  ];

  async function tryFallbacks(): Promise<boolean> {
    for (const fb of allFallbacks) {
      if (fb.provider === activeProvider) continue;
      const fbAuth = await ctx.runQuery(internal.providerAuth.getProviderAuth, { provider: fb.provider });
      const fbConfig = await ctx.runQuery(internal.proxyInternal.getProviderKey, { provider: fb.provider });
      const fbKey = fbConfig?.apiKey || fbAuth?.headers?.["Authorization"]?.replace("Bearer ", "") || "";
      if (!fbKey && !fbAuth) continue;
      const fbBase = fbAuth?.baseUrl || fbConfig?.baseUrl || PROVIDER_BASE_URLS[fb.provider] || "";
      let fbReq: { url: string; init: RequestInit };
      switch (fb.provider) {
        case "anthropic": fbReq = buildAnthropicRequest(body, fb.realModel, fbKey, fbBase, wantStream); break;
        case "google":    fbReq = buildGoogleRequest(body, fb.realModel, fbKey, fbBase, wantStream); break;
        case "cohere":    fbReq = buildCohereRequest(body, fb.realModel, fbKey, fbBase, wantStream); break;
        default:          fbReq = buildOpenAICompatRequest(body, fb.realModel, fbKey, fbBase, wantStream); break;
      }
      if (fbAuth && fbAuth.type !== "api_key" && fbAuth.headers) {
        const h = (fbReq.init.headers as Record<string, string>) || {};
        fbReq.init.headers = { ...h, ...(fbAuth.headers as Record<string, string>) } as HeadersInit;
      }
      try {
        const fbResp = await fetch(fbReq.url, fbReq.init);
        if (fbResp.ok) {
          providerResponse = fbResp;
          activeProvider = fb.provider;
          return true;
        }
      } catch { continue; }
    }
    return false;
  }

  // ── Connection ID tracking (for multi-connection fallback) ──
  // Track which connection was used (for future per-connection analytics)
  void 0; // __usedConnectionId placeholder

  // Provider alias map: some OAuth providers (gemini-cli, antigravity, agy)
  // serve the same models as "google" — look up connections from all aliases
  const PROVIDER_ALIASES: Record<string, string[]> = {
    google: ["gemini-cli", "antigravity", "agy"],
    "gemini-cli": ["google", "antigravity", "agy"],
    antigravity: ["google", "gemini-cli", "agy"],
    agy: ["google", "gemini-cli", "antigravity"],
  };

  // ── Helper: try multi-connection fallback for a provider ──
  async function tryConnectionFallback(targetProvider: string, targetModel: string): Promise<boolean> {
    // Get connections for primary provider + aliases
    const providersToCheck = [targetProvider, ...(PROVIDER_ALIASES[targetProvider] || [])];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let connections: any[] = [];
    for (const p of providersToCheck) {
      const conns = await ctx.runQuery(
        internal.proxyConnections.getActiveConnections,
        { provider: p }
      );
      if (conns && conns.length > 0) connections.push(...conns);
    }
    if (connections.length === 0) return false;

    for (const conn of connections) {
      const connHeaders = buildConnectionHeaders(targetProvider, conn);
      if (!connHeaders.Authorization && !connHeaders["x-api-key"]) {
        // No usable credentials — check if token needs refresh
        if (conn.refreshToken && conn.expiresAt) {
          const expiryMs = new Date(conn.expiresAt).getTime();
          if (expiryMs < Date.now()) {
            // Try refresh
            const refreshed = await ctx.runMutation(
              internal.proxyConnections.refreshConnectionToken,
              { connectionId: conn._id }
            );
            if (refreshed) {
              // Retry with new token
              const newHeaders = buildConnectionHeaders(targetProvider, {
                accessToken: refreshed.accessToken,
                authType: conn.authType,
              });
              if (!newHeaders.Authorization && !newHeaders["x-api-key"]) continue;
              Object.assign(connHeaders, newHeaders);
            } else {
              continue; // Refresh failed, skip this connection
            }
          }
        } else {
          continue;
        }
      }

      // Build request using connection credentials
      const connKey = connHeaders["x-api-key"] || connHeaders.Authorization?.replace("Bearer ", "") || "";
      const connBase = PROVIDER_BASE_URLS[targetProvider] || "";
      let connReq: { url: string; init: RequestInit };
      switch (targetProvider) {
        case "anthropic": connReq = buildAnthropicRequest(body, targetModel, connKey, connBase, wantStream); break;
        case "google":    connReq = buildGoogleRequest(body, targetModel, connKey, connBase, wantStream, !!connHeaders.Authorization); break;
        case "cohere":    connReq = buildCohereRequest(body, targetModel, connKey, connBase, wantStream); break;
        default:          connReq = buildOpenAICompatRequest(body, targetModel, connKey, connBase, wantStream); break;
      }
      // Override headers with connection-specific auth
      const existingH = (connReq.init.headers as Record<string, string>) || {};
      connReq.init.headers = { ...existingH, ...connHeaders } as HeadersInit;

      try {
        const connResp = await fetch(connReq.url, connReq.init);

        if (connResp.ok) {
          providerResponse = connResp;
          activeProvider = targetProvider;
          // NoteSuccess — reset backoff, mark used (KeiRouter style)
          void ctx.runMutation(internal.proxyConnections.noteSuccess, {
            connectionId: conn._id,
          });
          return true;
        }

        // Failed — detect rate limit + classify error (KeiRouter dispatch.go)
        let respBodyText: string | undefined;
        try { respBodyText = await connResp.clone().text(); } catch {}
        const rlInfo = detectRateLimitCooldown(connResp.status, connResp.headers, respBodyText);

        if (rlInfo.isRateLimited || rlInfo.errorKind !== "none") {
          // NoteFailure — apply exponential backoff (KeiRouter dispatch.go)
          void ctx.runMutation(internal.proxyConnections.noteFailure, {
            connectionId: conn._id,
            errorKind: rlInfo.errorKind,
            cooldownMs: rlInfo.cooldownMs,
            reason: rlInfo.reason,
          });
        }

        if (connResp.status === 401) {
          // Auth failed — try token refresh first
          if (conn.refreshToken) {
            const refreshed = await ctx.runMutation(
              internal.proxyConnections.refreshConnectionToken,
              { connectionId: conn._id }
            );
            if (refreshed) {
              // Retry once with refreshed token
              const newKey = refreshed.accessToken;
              let retryReq: { url: string; init: RequestInit };
              switch (targetProvider) {
                case "anthropic": retryReq = buildAnthropicRequest(body, targetModel, newKey, connBase, wantStream); break;
                case "google":    retryReq = buildGoogleRequest(body, targetModel, newKey, connBase, wantStream, true); break;
                case "cohere":    retryReq = buildCohereRequest(body, targetModel, newKey, connBase, wantStream); break;
                default:          retryReq = buildOpenAICompatRequest(body, targetModel, newKey, connBase, wantStream); break;
              }
              try {
                const retryResp = await fetch(retryReq.url, retryReq.init);
                if (retryResp.ok) {
                  providerResponse = retryResp;
                  activeProvider = targetProvider;
                  // NoteSuccess after successful retry
                  void ctx.runMutation(internal.proxyConnections.noteSuccess, {
                    connectionId: conn._id,
                  });
                  return true;
                }
              } catch { /* retry failed, continue to next connection */ }
            } else {
              // Refresh failed — markNeedsReconnect (permanent) or just mark auth-failed
              void ctx.runMutation(internal.proxyConnections.markNeedsReconnect, {
                connectionId: conn._id,
                reason: "token_refresh_failed",
              });
            }
          } else {
            // No refresh token — mark needs reconnect
            void ctx.runMutation(internal.proxyConnections.markNeedsReconnect, {
              connectionId: conn._id,
              reason: "no_refresh_token",
            });
          }
        }
        // Continue to next connection
      } catch {
        // Network error with this connection, try next
        continue;
      }
    }
    return false;
  }

  try {
    providerResponse = await fetch(reqConfig.url, reqConfig.init);
  } catch (err: any) {
    // Network error — try 4-tier fallback, then connection pool
    const fallbackSuccess = await tryFallbacks();
    if (!fallbackSuccess) {
      // Try multi-connection fallback
      const connSuccess = await tryConnectionFallback(providerInfo.provider, providerInfo.realModel);
      if (!connSuccess) {
        const latencyMs = Date.now() - startTime;
        await ctx.runMutation(internal.proxyInternal.logRequest, {
          apiKeyId: keyInfo.keyId, model, provider: providerInfo.provider,
          inputTokens: 0, outputTokens: 0, latencyMs,
          status: "error", errorMessage: err.message || "Network error", cost: 0,
        });
        return errorResp("Failed to connect to provider: " + (err.message || "unknown error"), 502, "server_error");
      }
    }
  }

  if (!providerResponse!.ok) {
    const status = providerResponse!.status;

    // Retry with exponential backoff on 429 (rate limit)
    if (status === 429) {
      for (let retryAttempt = 0; retryAttempt < 2; retryAttempt++) {
        await new Promise((r) => setTimeout(r, Math.pow(2, retryAttempt + 1) * 500));
        try {
          providerResponse = await fetch(reqConfig.url, reqConfig.init);
          if (providerResponse.ok) break;
        } catch { /* retry */ }
      }
    }

    // Try 4-tier provider fallback on 500/502/503/429
    if (!providerResponse!.ok && (status >= 500 || status === 429)) {
      await tryFallbacks();
    }

    // ── NEW: Try multi-connection fallback ──
    if (!providerResponse!.ok) {
      const connSuccess = await tryConnectionFallback(providerInfo.provider, providerInfo.realModel);
      if (!connSuccess) {
        // Also try connections for fallback providers
        for (const fb of allFallbacks) {
          const fbConnSuccess = await tryConnectionFallback(fb.provider, fb.realModel);
          if (fbConnSuccess) break;
        }
      }
    }

    // Still not ok after all fallback attempts
    if (!providerResponse!.ok) {
      const latencyMs = Date.now() - startTime;
      let errMsg = "Provider error";
      try { const d = await providerResponse!.json(); errMsg = d?.error?.message || d?.message || errMsg; } catch {}
      await ctx.runMutation(internal.proxyInternal.logRequest, {
        apiKeyId: keyInfo.keyId, model, provider: activeProvider,
        inputTokens: 0, outputTokens: 0, latencyMs,
        status: "error", errorMessage: errMsg, cost: 0,
      });
      return errorResp(errMsg, providerResponse!.status, "provider_error");
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 8A. STREAMING RESPONSE
  // ──────────────────────────────────────────────────────────────
  if (wantStream) {
    const completionId = `chatcmpl-${Date.now()}`;

    if (!providerResponse.body) {
      return errorResp("Provider returned no stream body", 502, "server_error");
    }

    // Google streaming uses a different format — convert it
    let outputStream: ReadableStream<Uint8Array>;

    if (activeProvider === "google") {
      // Google SSE: each event has a full candidates array
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let buf = "";
      const transform = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          buf += decoder.decode(chunk, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const p = line.slice(6).trim();
            if (!p || p === "[DONE]") { controller.enqueue(encoder.encode("data: [DONE]\n\n")); continue; }
            try {
              const parsed = JSON.parse(p);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (text) {
                controller.enqueue(encoder.encode(sseEvent(streamChunk(completionId, model, { content: text }))));
              }
              // Check if done
              if (parsed.candidates?.[0]?.finishReason) {
                controller.enqueue(encoder.encode(sseEvent(streamChunk(completionId, model, {}, "stop"))));
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch {}
          }
        },
      });
      outputStream = providerResponse.body.pipeThrough(transform);
    } else {
      // Anthropic + OpenAI-compatible: use generic transform
      outputStream = providerResponse.body.pipeThrough(
        createStreamTransform(activeProvider, model, completionId)
      );
    }

    // Log streaming request (approximate — we don't have exact tokens for streams)
    // We'll log with 0 tokens; a separate usage endpoint can reconcile later
    const latencyMs = Date.now() - startTime;
    // Fire-and-forget log for streaming
    void ctx.runMutation(internal.proxyInternal.logRequest, {
      apiKeyId: keyInfo.keyId, model, provider: activeProvider,
      inputTokens: 0, outputTokens: 0, latencyMs,
      status: "success", cost: 0,
    });

    return new Response(outputStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...CORS_HEADERS,
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // 8B. NON-STREAMING RESPONSE
  // ──────────────────────────────────────────────────────────────
  const rawData = await providerResponse.json();
  let responseData: any;
  let inputTokens: number;
  let outputTokens: number;

  switch (activeProvider) {
    case "anthropic": {
      const c = convertAnthropicResponse(rawData, model);
      responseData = c.responseData; inputTokens = c.inputTokens; outputTokens = c.outputTokens;
      break;
    }
    case "google": {
      const c = convertGoogleResponse(rawData, model);
      responseData = c.responseData; inputTokens = c.inputTokens; outputTokens = c.outputTokens;
      break;
    }
    case "cohere": {
      const c = convertCohereResponse(rawData, model);
      responseData = c.responseData; inputTokens = c.inputTokens; outputTokens = c.outputTokens;
      break;
    }
    default: {
      responseData = rawData;
      responseData.model = model;
      inputTokens = responseData.usage?.prompt_tokens || 0;
      outputTokens = responseData.usage?.completion_tokens || 0;
      break;
    }
  }

  // 9. Calculate cost & log
  const latencyMs = Date.now() - startTime;
  const costInfo = await ctx.runQuery(internal.proxyInternal.getModelCost, {
    provider: activeProvider, modelId: model,
  });
  const costCents = costInfo
    ? Math.round(((inputTokens / 1_000_000) * costInfo.inputPricePer1M + (outputTokens / 1_000_000) * costInfo.outputPricePer1M) * 100)
    : 0;

  await ctx.runMutation(internal.proxyInternal.logRequest, {
    apiKeyId: keyInfo.keyId, model, provider: activeProvider,
    inputTokens, outputTokens, latencyMs,
    status: "success", cost: costCents,
  });

  // Track provider quota usage
  void ctx.runMutation(internal.providerAuth.incrementQuota, { provider: activeProvider });

  // Store in cache if eligible
  if ((body as any)._reqHash && !wantStream) {
    void ctx.runMutation(internal.proxyInternal.setCachedResponse, {
      requestHash: (body as any)._reqHash,
      model,
      responseJson: JSON.stringify(responseData),
      inputTokens,
      outputTokens,
      ttlMinutes: 5,
    });
  }

  return jsonResp(responseData);
});

/* ═══════════════════════════════════════════════════════════════
   GET /v1/models
   ═══════════════════════════════════════════════════════════════ */

export const listModels = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") return corsResp();

  const providers = await ctx.runQuery(internal.proxyInternal.getActiveModels, {});

  const models = providers.flatMap((p) =>
    p.models.map((m) => ({
      id: m.modelId,
      object: "model" as const,
      created: Math.floor(Date.now() / 1000),
      owned_by: p.provider,
    }))
  );

  return jsonResp({ object: "list", data: models });
});
