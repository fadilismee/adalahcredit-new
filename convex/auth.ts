import { Password } from "@convex-dev/auth/providers/Password";
import type { AuthProviderConfig } from "@convex-dev/auth/server";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { query } from "./_generated/server";
import { TestCredentials } from "./testAuth";
import {
  ViktorSpacesEmail,
  ViktorSpacesPasswordReset,
} from "./ViktorSpacesEmail";

declare const process: { env: Record<string, string | undefined> };

function decodePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  if (key.includes("\n")) return key;
  if (key.startsWith("-----BEGIN")) {
    return key
      .replace("-----BEGIN PRIVATE KEY----- ", "-----BEGIN PRIVATE KEY-----\n")
      .replace(" -----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----")
      .split(" ")
      .join("\n");
  }
  try {
    return atob(key);
  } catch {
    return key;
  }
}

const authPrivateKey = process.env.AUTH_PRIVATE_KEY;
if (authPrivateKey) {
  process.env.AUTH_PRIVATE_KEY = decodePrivateKey(authPrivateKey);
}

const jwtPrivateKey = process.env.JWT_PRIVATE_KEY;
if (jwtPrivateKey) {
  process.env.JWT_PRIVATE_KEY = decodePrivateKey(jwtPrivateKey);
}

function configuredSpaceAuthProviders(): AuthProviderConfig[] {
  const providers: AuthProviderConfig[] = [
    Password({
      verify: ViktorSpacesEmail,
      reset: ViktorSpacesPasswordReset,
    }),
  ];

  // OAuth providers — only register when credentials are configured
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }));
  }

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }));
  }

  // Test credentials on preview/dev
  if (process.env.VIKTOR_SPACES_IS_PREVIEW === "true") {
    providers.push(TestCredentials);
  }

  return providers;
}

function configuredAuthProviders(): AuthProviderConfig[] {
  // Always register auth providers — the app has its own login/signup pages
  // that need Password + TestCredentials (on preview/dev) to function.
  return configuredSpaceAuthProviders();
}

// Only register the @test.local credentials provider on preview/dev Convex
// deployments. `VIKTOR_SPACES_IS_PREVIEW` is set per-deployment by the Viktor
// Spaces backend (true on dev, false on prod). On production it is "false" or
// unset, so the test provider is omitted entirely and `signIn("test", ...)`
// fails with "Provider not configured".
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: configuredAuthProviders(),
});

export const currentUser = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});
