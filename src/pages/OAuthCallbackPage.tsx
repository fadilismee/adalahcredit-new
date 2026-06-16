/**
 * OAuth Callback Page — /oauth/callback
 *
 * Receives OAuth redirect with ?code=...&state=...
 * Sends callback data back to opener via:
 *   1. postMessage (popup mode)
 *   2. BroadcastChannel (same-origin cross-tab)
 *   3. localStorage storage event (fallback)
 *
 * FIX C12: Added state validation (CSRF protection)
 * FIX H12: Clean up OAuth localStorage data after callback
 * FIX H15: Fallback when window.close() is blocked
 */

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Copy, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CallbackStatus = "processing" | "success" | "done" | "manual" | "error";

export function OAuthCallbackPage() {
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errMsg, setErrMsg] = useState("");
  const [currentUrl] = useState(() =>
    typeof window === "undefined" ? "" : window.location.href
  );
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    // FIX C12: Validate state parameter against stored value to prevent CSRF
    if (state) {
      try {
        const storedState = sessionStorage.getItem("oauth_state") || localStorage.getItem("oauth_state");
        if (storedState && storedState !== state) {
          setStatus("error");
          setErrMsg("State mismatch — kemungkinan serangan CSRF. Coba lagi.");
          return;
        }
        // FIX H12: Clean up OAuth storage after validation
        sessionStorage.removeItem("oauth_state");
        localStorage.removeItem("oauth_state");
        localStorage.removeItem("oauth_provider");
        localStorage.removeItem("oauth_code_verifier");
      } catch {
        // Storage access denied — continue without validation
      }
    }

    const callbackData = {
      code,
      state,
      error: error || errorDescription || null,
      fullUrl: window.location.href,
    };

    let sent = false;
    let openerSameOrigin = false;

    if (window.opener) {
      try {
        openerSameOrigin = window.opener.location.origin === window.location.origin;
      } catch {
        openerSameOrigin = false;
      }
    }

    // Method 1: postMessage to opener (popup mode)
    if (window.opener) {
      try {
        window.opener.postMessage(
          { type: "oauth_v2_callback", data: callbackData },
          window.location.origin,
        );
        sent = true;
      } catch { /* cross-origin blocked */ }

      if (!openerSameOrigin) {
        try {
          window.opener.postMessage(
            { type: "oauth_v2_callback", data: callbackData },
            "*",
          );
          sent = true;
        } catch { /* failed */ }
      }
    }

    // Method 2: BroadcastChannel
    try {
      const channel = new BroadcastChannel("oauth_v2_callback");
      channel.postMessage(callbackData);
      channel.close();
      sent = true;
    } catch { /* BroadcastChannel not supported */ }

    // Method 3: localStorage storage event
    try {
      localStorage.setItem(
        "oauth_v2_callback",
        JSON.stringify({ ...callbackData, timestamp: Date.now() }),
      );
      sent = true;
    } catch { /* localStorage blocked */ }

    if (error) {
      setStatus("error");
      setErrMsg(errorDescription || error || "Provider menolak permintaan autentikasi.");
    } else if (sent && code) {
      if (window.opener && openerSameOrigin) {
        setStatus("success");
        setTimeout(() => {
          // FIX H15: Fallback when window.close() is blocked by browser
          try {
            window.close();
          } catch { /* blocked */ }
          // If we're still here after 600ms, show manual close message
          setTimeout(() => setStatus("done"), 600);
        }, 1500);
      } else {
        setStatus("manual");
      }
    } else {
      setStatus("manual");
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        {status === "processing" && (
          <>
            <div className="size-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="size-8 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-foreground">Memproses...</h1>
            <p className="text-muted-foreground">Sedang memproses autentikasi, mohon tunggu.</p>
          </>
        )}

        {(status === "success" || status === "done") && (
          <>
            <div className="size-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="size-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-foreground">Autentikasi Berhasil!</h1>
            <p className="text-muted-foreground">
              {status === "success"
                ? "Window akan tertutup otomatis..."
                : "Kamu bisa tutup tab ini sekarang."}
            </p>
            {/* FIX H15: Show link back to dashboard if window.close was blocked */}
            {status === "done" && (
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Kembali ke Dashboard →
              </button>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <div className="size-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-foreground">Autentikasi Gagal</h1>
            <p className="text-muted-foreground mb-4">
              {errMsg || "Provider menolak permintaan autentikasi. Silakan coba lagi."}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </>
        )}

        {status === "manual" && (
          <>
            <div className="size-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Copy className="size-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-foreground">Copy URL Callback</h1>
            <p className="text-muted-foreground mb-4">
              Jika popup tidak otomatis tertutup, copy URL di bawah dan paste di halaman utama.
            </p>
            <div className="bg-muted/50 border border-border rounded-lg p-3 text-left mb-3">
              <code className="text-xs break-all text-foreground/70">{currentUrl}</code>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy URL"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallbackPage;
