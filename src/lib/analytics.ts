/**
 * Analytics integration — supports Umami (self-hosted) and Plausible.
 * 
 * Setup:
 * 1. Set VITE_ANALYTICS_PROVIDER="umami" or "plausible" in .env.local
 * 2. Set VITE_ANALYTICS_SITE_ID (Umami website ID or Plausible domain)
 * 3. Set VITE_ANALYTICS_URL (your Umami/Plausible instance URL)
 * 
 * Without config, analytics is disabled (no-op).
 */

const PROVIDER = import.meta.env.VITE_ANALYTICS_PROVIDER as string | undefined;
const SITE_ID = import.meta.env.VITE_ANALYTICS_SITE_ID as string | undefined;
const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL as string | undefined;

/** Track a custom event */
export function trackEvent(name: string, data?: Record<string, string | number>) {
  try {
    if (PROVIDER === "umami" && typeof window !== "undefined" && (window as any).umami) {
      (window as any).umami.track(name, data);
    } else if (PROVIDER === "plausible" && typeof window !== "undefined" && (window as any).plausible) {
      (window as any).plausible(name, { props: data });
    }
  } catch {
    // Analytics should never break the app
  }
}

/** Track page view (call on route change) */
export function trackPageView(path: string) {
  trackEvent("pageview", { path });
}

/** Get the analytics script tag HTML (inject in index.html or via component) */
export function getAnalyticsConfig() {
  if (!PROVIDER || !SITE_ID) return null;

  if (PROVIDER === "umami") {
    return {
      src: `${ANALYTICS_URL || "https://cloud.umami.is"}/script.js`,
      "data-website-id": SITE_ID,
      defer: true,
    };
  }

  if (PROVIDER === "plausible") {
    return {
      src: `${ANALYTICS_URL || "https://plausible.io"}/js/script.js`,
      "data-domain": SITE_ID,
      defer: true,
    };
  }

  return null;
}

/** Is analytics configured? */
export function isAnalyticsEnabled(): boolean {
  return Boolean(PROVIDER && SITE_ID);
}
