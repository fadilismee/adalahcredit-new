/**
 * useProviderOAuthV2 — React hook for OmniRoute-style provider OAuth flows
 *
 * Handles all 3 flow types:
 * - authorization_code / authorization_code_pkce (popup browser flow)
 * - device_code (user code + polling)
 * - import_token (paste token directly)
 */

import { useState, useCallback, useRef, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────

export interface OAuthProviderInfo {
  name: string;
  flowType: "authorization_code" | "authorization_code_pkce" | "device_code" | "import_token";
  hasImportToken: boolean;
  isDeviceCode: boolean;
}

export interface DeviceCodeData {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval?: number;
  codeVerifier?: string;
  _clientId?: string;
  _clientSecret?: string;
  _region?: string;
}

export interface OAuthConnection {
  id: string;
  provider: string;
  email?: string;
  displayName?: string;
}

export type OAuthStep = "idle" | "authorizing" | "exchanging" | "polling" | "success" | "error";

// ── Helper: get Convex site URL ──────────────────────────

function getConvexSiteUrl(): string {
  const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
  if (siteUrl) return siteUrl;
  const cloudUrl = import.meta.env.VITE_CONVEX_URL || "";
  return cloudUrl.replace(".cloud", ".site");
}

// ── Main Hook ────────────────────────────────────────────

export function useProviderOAuthV2() {
  const [step, setStep] = useState<OAuthStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<OAuthConnection | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceCodeData | null>(null);
  const [providers, setProviders] = useState<OAuthProviderInfo[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupRef = useRef<Window | null>(null);

  const baseUrl = getConvexSiteUrl();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    };
  }, []);

  // ── List providers ──────────────────────────────────────

  const listProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const res = await fetch(`${baseUrl}/api/provider-oauth-v2/list-providers`);
      const data = await res.json();
      setProviders(data.providers || []);
      return data.providers as OAuthProviderInfo[];
    } catch (err: any) {
      console.error("Failed to list providers:", err);
      return [];
    } finally {
      setLoadingProviders(false);
    }
  }, [baseUrl]);

  // ── Authorization Code Flow (popup) ─────────────────────

  const startAuthCodeFlow = useCallback(async (
    provider: string,
    redirectUri?: string,
  ) => {
    setStep("authorizing");
    setError(null);
    setConnection(null);

    try {
      const callbackUrl = redirectUri || `${window.location.origin}/oauth/callback`;
      const params = new URLSearchParams({
        provider,
        redirect_uri: callbackUrl,
      });

      const res = await fetch(`${baseUrl}/api/provider-oauth-v2/authorize?${params}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to get authorization URL");
      }

      // Store PKCE data for callback
      sessionStorage.setItem("oauth_v2_state", JSON.stringify({
        provider,
        state: data.state,
        codeVerifier: data.codeVerifier,
        redirectUri: callbackUrl,
      }));

      // Open popup
      const width = 520;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        `oauth_v2_${provider}`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
      );
      popupRef.current = popup;

      // Listen for callback message from popup/broadcast
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "oauth_v2_callback") {
          window.removeEventListener("message", handleMessage);
          const { code, state: cbState, error: cbError } = event.data.data || {};
          if (cbError) {
            setError(cbError);
            setStep("error");
          } else if (code) {
            exchangeCode(provider, code, callbackUrl, data.codeVerifier, cbState);
          }
        }
      };
      window.addEventListener("message", handleMessage);

      // BroadcastChannel listener
      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel("oauth_v2_callback");
        bc.onmessage = (event) => {
          const { code, state: cbState, error: cbError } = event.data || {};
          if (cbError) {
            setError(cbError);
            setStep("error");
          } else if (code) {
            exchangeCode(provider, code, callbackUrl, data.codeVerifier, cbState);
          }
          bc?.close();
        };
      } catch { /* BroadcastChannel not supported */ }

      // localStorage fallback
      const storageHandler = (e: StorageEvent) => {
        if (e.key === "oauth_v2_callback" && e.newValue) {
          window.removeEventListener("storage", storageHandler);
          try {
            const cbData = JSON.parse(e.newValue);
            if (cbData.error) {
              setError(cbData.error);
              setStep("error");
            } else if (cbData.code) {
              exchangeCode(provider, cbData.code, callbackUrl, data.codeVerifier, cbData.state);
            }
          } catch { /* ignore parse errors */ }
        }
      };
      window.addEventListener("storage", storageHandler);

      // Poll for popup close
      const popupInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(popupInterval);
          // Only set error if not already resolved
          setTimeout(() => {
            setStep((current) => {
              if (current === "authorizing") return "idle";
              return current;
            });
          }, 1000);
        }
      }, 500);

    } catch (err: any) {
      setError(err.message || "Authorization failed");
      setStep("error");
    }
  }, [baseUrl]);

  // ── Exchange code for tokens ────────────────────────────

  const exchangeCode = useCallback(async (
    provider: string,
    code: string,
    redirectUri: string,
    codeVerifier?: string,
    state?: string,
  ) => {
    setStep("exchanging");
    try {
      const res = await fetch(`${baseUrl}/api/provider-oauth-v2/exchange?provider=${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri, codeVerifier, state }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Token exchange failed");
      }
      setConnection(data.connection);
      setStep("success");
      // Cleanup
      sessionStorage.removeItem("oauth_v2_state");
    } catch (err: any) {
      setError(err.message || "Exchange failed");
      setStep("error");
    }
  }, [baseUrl]);

  // ── Device Code Flow ────────────────────────────────────

  const startDeviceCodeFlow = useCallback(async (provider: string) => {
    setStep("authorizing");
    setError(null);
    setConnection(null);
    setDeviceData(null);

    try {
      const res = await fetch(`${baseUrl}/api/provider-oauth-v2/device-code?provider=${provider}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to get device code");
      }

      setDeviceData(data);
      setStep("polling");

      // Start polling
      const interval = (data.interval || 5) * 1000;
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${baseUrl}/api/provider-oauth-v2/poll?provider=${provider}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deviceCode: data.device_code,
              codeVerifier: data.codeVerifier,
              extraData: {
                _clientId: data._clientId,
                _clientSecret: data._clientSecret,
                _region: data._region,
              },
            }),
          });
          const pollData = await pollRes.json();

          if (pollData.success) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setConnection(pollData.connection);
            setStep("success");
          } else if (!pollData.pending) {
            // Non-recoverable error
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setError(pollData.error || "Authorization failed");
            setStep("error");
          }
          // pending → keep polling
        } catch {
          // Network error during poll — keep trying
        }
      }, interval);

    } catch (err: any) {
      setError(err.message || "Device code flow failed");
      setStep("error");
    }
  }, [baseUrl]);

  // ── Import Token Flow ───────────────────────────────────

  const importToken = useCallback(async (provider: string, token: string) => {
    setStep("exchanging");
    setError(null);
    setConnection(null);

    try {
      const res = await fetch(`${baseUrl}/api/provider-oauth-v2/import-token?provider=${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Import failed");
      }

      setConnection(data.connection);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Import token failed");
      setStep("error");
    }
  }, [baseUrl]);

  // ── Reset ───────────────────────────────────────────────

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setConnection(null);
    setDeviceData(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return {
    // State
    step,
    error,
    connection,
    deviceData,
    providers,
    loadingProviders,
    // Actions
    listProviders,
    startAuthCodeFlow,
    startDeviceCodeFlow,
    importToken,
    exchangeCode,
    reset,
  };
}
