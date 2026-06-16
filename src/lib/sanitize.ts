/**
 * Input sanitization utilities for XSS prevention.
 * Use on all user-submitted text before storing or displaying.
 */

/** Strip HTML tags and script injections */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/javascript:/gi, "") // Strip javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Strip event handlers
    .replace(/&lt;script/gi, "") // Strip encoded script tags
    .trim();
}

/** Sanitize email format */
export function sanitizeEmail(input: string): string {
  return input.toLowerCase().trim().slice(0, 254);
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Sanitize URL — only allow http/https */
export function sanitizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "";
}

/** Limit string length with optional truncation */
export function limitLength(input: string, max: number): string {
  return input.slice(0, max);
}

/** Sanitize API key label/name — alphanumeric, spaces, dashes, underscores */
export function sanitizeKeyName(input: string): string {
  return input.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim().slice(0, 64);
}

/** Validate and sanitize integer within range */
export function sanitizeInt(input: unknown, min: number, max: number, fallback: number): number {
  const num = typeof input === "string" ? parseInt(input, 10) : Number(input);
  if (isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(num)));
}
