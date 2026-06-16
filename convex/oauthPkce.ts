/**
 * PKCE Utilities for OAuth 2.0 Authorization Code Flow
 *
 * Implements RFC 7636 (Proof Key for Code Exchange) using Web Crypto API.
 * Used by provider OAuth flows that need PKCE security (Claude, Codex,
 * Antigravity, GitLab Duo, Qwen device-code+PKCE, etc.)
 *
 * Ported from OmniRoute: src/lib/oauth/utils/pkce.ts
 */

/** Generate a cryptographically random code verifier (43-128 chars, base64url) */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

/** Generate S256 code challenge from verifier */
export async function generateCodeChallenge(
  verifier: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(new Uint8Array(digest));
}

/** Generate a random state parameter for CSRF protection */
export function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

/** Generate full PKCE data (verifier + challenge + state) */
export async function generatePKCE() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();
  return { codeVerifier, codeChallenge, state };
}

/** Base64url encode (no padding, URL-safe) */
function base64urlEncode(bytes: Uint8Array): string {
  // Convert to base64
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  // Make URL-safe: replace + with -, / with _, remove =
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Base64url decode */
export function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding
  switch (base64.length % 4) {
    case 2:
      base64 += "==";
      break;
    case 3:
      base64 += "=";
      break;
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
