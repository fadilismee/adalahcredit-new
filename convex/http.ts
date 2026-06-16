import { httpRouter } from "convex/server";
import { createViktorAuthRoutes } from "../src/lib/viktor-spaces-access/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { chatCompletions, listModels } from "./proxy";
import { embeddings } from "./proxyEmbeddings";
import { imageGenerations } from "./proxyImages";
import { audioTranscriptions, audioSpeech } from "./proxyAudio";
import { moderations } from "./proxyModerations";
import { testProvider } from "./testProvider";
import { testConnection } from "./testConnection";
import { oauthStart, oauthCallback, oauthComplete } from "./providerOAuth";
import { oauthGetHandler, oauthPostHandler } from "./oauthActions";

const http = httpRouter();
auth.addHttpRoutes(http);

declare const process: { env: Record<string, string | undefined> };

function viktorAuthRoutes() {
  const resourceId =
    process.env.VIKTOR_AUTH_RESOURCE_ID ||
    process.env.VITE_VIKTOR_SPACES_SPACE_ID ||
    "";
  return createViktorAuthRoutes({
    clientId: process.env.VIKTOR_AUTH_CLIENT_ID || `space-${resourceId}`,
    resourceId,
    viktorAuthBaseUrl:
      process.env.VIKTOR_AUTH_BASE_URL ||
      process.env.VIKTOR_SPACES_API_URL ||
      "",
    successRedirectPath: "/dashboard",
  });
}

http.route({
  path: "/__viktor_auth/callback",
  method: "GET",
  handler: httpAction(async (_ctx, request) =>
    viktorAuthRoutes().callback(request),
  ),
});

http.route({
  path: "/__viktor_auth/me",
  method: "GET",
  handler: httpAction(async (_ctx, request) => viktorAuthRoutes().me(request)),
});

http.route({
  path: "/__viktor_auth/logout",
  method: "POST",
  handler: httpAction(async (_ctx, request) =>
    viktorAuthRoutes().logout(request),
  ),
});

/* ═══════════════════════════════════════════════════════════════
   API PROXY ROUTES — OpenAI-compatible
   ═══════════════════════════════════════════════════════════════ */

// POST /v1/chat/completions
http.route({
  path: "/v1/chat/completions",
  method: "POST",
  handler: chatCompletions,
});

// OPTIONS /v1/chat/completions (CORS preflight)
http.route({
  path: "/v1/chat/completions",
  method: "OPTIONS",
  handler: chatCompletions,
});

// GET /v1/models
http.route({
  path: "/v1/models",
  method: "GET",
  handler: listModels,
});

// OPTIONS /v1/models (CORS preflight)
http.route({
  path: "/v1/models",
  method: "OPTIONS",
  handler: listModels,
});

/* ═══════════════════════════════════════════════════════════════
   EMBEDDINGS
   ═══════════════════════════════════════════════════════════════ */

// POST /v1/embeddings
http.route({
  path: "/v1/embeddings",
  method: "POST",
  handler: embeddings,
});
http.route({
  path: "/v1/embeddings",
  method: "OPTIONS",
  handler: embeddings,
});

/* ═══════════════════════════════════════════════════════════════
   IMAGE GENERATION
   ═══════════════════════════════════════════════════════════════ */

// POST /v1/images/generations
http.route({
  path: "/v1/images/generations",
  method: "POST",
  handler: imageGenerations,
});
http.route({
  path: "/v1/images/generations",
  method: "OPTIONS",
  handler: imageGenerations,
});

/* ═══════════════════════════════════════════════════════════════
   AUDIO
   ═══════════════════════════════════════════════════════════════ */

// POST /v1/audio/transcriptions
http.route({
  path: "/v1/audio/transcriptions",
  method: "POST",
  handler: audioTranscriptions,
});
http.route({
  path: "/v1/audio/transcriptions",
  method: "OPTIONS",
  handler: audioTranscriptions,
});

// POST /v1/audio/speech
http.route({
  path: "/v1/audio/speech",
  method: "POST",
  handler: audioSpeech,
});
http.route({
  path: "/v1/audio/speech",
  method: "OPTIONS",
  handler: audioSpeech,
});

/* ═══════════════════════════════════════════════════════════════
   MODERATIONS
   ═══════════════════════════════════════════════════════════════ */

// POST /v1/moderations
http.route({
  path: "/v1/moderations",
  method: "POST",
  handler: moderations,
});
http.route({
  path: "/v1/moderations",
  method: "OPTIONS",
  handler: moderations,
});

/* ═══════════════════════════════════════════════════════════════
   TEST PROVIDER KEY
   ═══════════════════════════════════════════════════════════════ */

// POST /api/test-provider
http.route({
  path: "/api/test-provider",
  method: "POST",
  handler: testProvider,
});

// OPTIONS /api/test-provider (CORS preflight)
http.route({
  path: "/api/test-provider",
  method: "OPTIONS",
  handler: testProvider,
});

// POST /api/test-connection — Test a saved connection (KeiRouter import)
http.route({
  path: "/api/test-connection",
  method: "POST",
  handler: testConnection,
});
// OPTIONS /api/test-connection (CORS preflight)
http.route({
  path: "/api/test-connection",
  method: "OPTIONS",
  handler: testConnection,
});

/* ═══════════════════════════════════════════════════════════════
   PROVIDER OAUTH ROUTES
   ═══════════════════════════════════════════════════════════════ */

// GET /api/provider-oauth/start?provider=xxx
http.route({
  path: "/api/provider-oauth/start",
  method: "GET",
  handler: oauthStart,
});

// GET /api/provider-oauth/callback (backward compat)
http.route({
  path: "/api/provider-oauth/callback",
  method: "GET",
  handler: oauthCallback,
});

// POST /api/provider-oauth/complete — popup calls this after login
http.route({
  path: "/api/provider-oauth/complete",
  method: "POST",
  handler: oauthComplete,
});

/* ═══════════════════════════════════════════════════════════════
   PROVIDER OAUTH V2 — OmniRoute-style full OAuth integration
   ═══════════════════════════════════════════════════════════════ */

// GET actions: authorize, device-code, list-providers
http.route({
  path: "/api/provider-oauth-v2/authorize",
  method: "GET",
  handler: oauthGetHandler,
});
http.route({
  path: "/api/provider-oauth-v2/authorize",
  method: "OPTIONS",
  handler: oauthGetHandler,
});

http.route({
  path: "/api/provider-oauth-v2/device-code",
  method: "GET",
  handler: oauthGetHandler,
});
http.route({
  path: "/api/provider-oauth-v2/device-code",
  method: "OPTIONS",
  handler: oauthGetHandler,
});

http.route({
  path: "/api/provider-oauth-v2/list-providers",
  method: "GET",
  handler: oauthGetHandler,
});
http.route({
  path: "/api/provider-oauth-v2/list-providers",
  method: "OPTIONS",
  handler: oauthGetHandler,
});

// POST actions: exchange, poll, import-token
http.route({
  path: "/api/provider-oauth-v2/exchange",
  method: "POST",
  handler: oauthPostHandler,
});
http.route({
  path: "/api/provider-oauth-v2/exchange",
  method: "OPTIONS",
  handler: oauthPostHandler,
});

http.route({
  path: "/api/provider-oauth-v2/poll",
  method: "POST",
  handler: oauthPostHandler,
});
http.route({
  path: "/api/provider-oauth-v2/poll",
  method: "OPTIONS",
  handler: oauthPostHandler,
});

http.route({
  path: "/api/provider-oauth-v2/import-token",
  method: "POST",
  handler: oauthPostHandler,
});
http.route({
  path: "/api/provider-oauth-v2/import-token",
  method: "OPTIONS",
  handler: oauthPostHandler,
});

export default http;
