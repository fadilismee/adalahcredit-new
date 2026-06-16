/**
 * Server-side input validation & sanitization.
 * Applied to all user-submitted data before storing.
 */

/** Strip HTML/script injection from text */
export function sanitizeText(input: string, maxLen = 2000): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, maxLen);
}

/** Validate email */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Validate URL (http/https only) */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Sanitize webhook URL */
export function sanitizeWebhookUrl(url: string): string {
  const trimmed = url.trim();
  if (!isValidUrl(trimmed)) throw new Error("Invalid webhook URL");
  return trimmed;
}

/** Validate API key name */
export function validateKeyName(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();
  if (sanitized.length === 0) throw new Error("Key name is required");
  if (sanitized.length > 64) throw new Error("Key name too long (max 64 chars)");
  return sanitized;
}
