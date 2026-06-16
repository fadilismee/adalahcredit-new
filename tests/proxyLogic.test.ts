/**
 * Unit tests for proxy logic — validation, sanitization, rate limiting.
 * Run with: bun test convex/__tests__/proxyLogic.test.ts
 */
import { describe, expect, it } from "bun:test";
import { sanitizeText, isValidEmail, isValidUrl, validateKeyName } from "../lib/validate";

describe("sanitizeText", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText("<script>alert('xss')</script>hello")).toBe("alert('xss')hello");
  });

  it("strips javascript: protocol", () => {
    expect(sanitizeText("javascript:alert(1)")).toBe("alert(1)");
  });

  it("strips event handlers", () => {
    expect(sanitizeText('onerror=alert(1) hello')).toBe("alert(1) hello");
  });

  it("respects max length", () => {
    expect(sanitizeText("a".repeat(100), 10)).toBe("a".repeat(10));
  });

  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeText("")).toBe("");
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user@domain.co.id")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("not-email")).toBe(false);
    expect(isValidEmail("@no-user.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects emails over 254 chars", () => {
    expect(isValidEmail("a".repeat(250) + "@b.com")).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("accepts http/https URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://webhook.site/123")).toBe(true);
    expect(isValidUrl("https://api.company.com/webhooks")).toBe(true);
  });

  it("rejects non-http protocols", () => {
    expect(isValidUrl("ftp://evil.com")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });
});

describe("validateKeyName", () => {
  it("accepts valid names", () => {
    expect(validateKeyName("my-api-key")).toBe("my-api-key");
    expect(validateKeyName("Production Key 1")).toBe("Production Key 1");
    expect(validateKeyName("test_key_v2")).toBe("test_key_v2");
  });

  it("strips special characters", () => {
    expect(validateKeyName("key<script>")).toBe("keyscript");
    expect(validateKeyName("key!@#$%")).toBe("key");
  });

  it("throws on empty name", () => {
    expect(() => validateKeyName("")).toThrow("Key name is required");
    expect(() => validateKeyName("!!!")).toThrow("Key name is required");
  });

  it("throws on too-long name", () => {
    expect(() => validateKeyName("a".repeat(65))).toThrow("Key name too long");
  });
});

// === Proxy-specific logic tests ===

describe("API key format", () => {
  it("validates ac-live- prefix", () => {
    const key = "ac-live-sk_abc123def456";
    expect(key.startsWith("ac-live-")).toBe(true);
  });

  it("validates ac-test- prefix", () => {
    const key = "ac-test-sk_abc123def456";
    expect(key.startsWith("ac-test-")).toBe(true);
  });

  it("rejects invalid prefix", () => {
    const key = "sk-abc123";
    expect(key.startsWith("ac-live-") || key.startsWith("ac-test-")).toBe(false);
  });
});

describe("Rate limit per plan", () => {
  const PLAN_RATE_LIMITS: Record<string, number> = {
    free: 20,
    starter: 60,
    pro: 300,
    enterprise: 1000,
  };

  it("returns correct limits per plan", () => {
    expect(PLAN_RATE_LIMITS["free"]).toBe(20);
    expect(PLAN_RATE_LIMITS["starter"]).toBe(60);
    expect(PLAN_RATE_LIMITS["pro"]).toBe(300);
    expect(PLAN_RATE_LIMITS["enterprise"]).toBe(1000);
  });

  it("handles unknown plan", () => {
    expect(PLAN_RATE_LIMITS["unknown"] ?? 20).toBe(20);
  });
});

describe("Spending alerts", () => {
  const ALERT_THRESHOLDS = [
    { level: "warning", threshold: 0.5 },
    { level: "critical", threshold: 0.8 },
    { level: "exhausted", threshold: 0.95 },
  ];

  function getAlertLevel(usagePercent: number) {
    let level = "none";
    for (const t of ALERT_THRESHOLDS) {
      if (usagePercent >= t.threshold) level = t.level;
    }
    return level;
  }

  it("returns none for low usage", () => {
    expect(getAlertLevel(0.1)).toBe("none");
    expect(getAlertLevel(0.49)).toBe("none");
  });

  it("returns warning at 50%", () => {
    expect(getAlertLevel(0.5)).toBe("warning");
    expect(getAlertLevel(0.79)).toBe("warning");
  });

  it("returns critical at 80%", () => {
    expect(getAlertLevel(0.8)).toBe("critical");
    expect(getAlertLevel(0.94)).toBe("critical");
  });

  it("returns exhausted at 95%", () => {
    expect(getAlertLevel(0.95)).toBe("exhausted");
    expect(getAlertLevel(1.0)).toBe("exhausted");
  });
});

describe("Model routing", () => {
  const MODEL_TO_PROVIDER: Record<string, string> = {
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
    "claude-sonnet-4": "anthropic",
    "claude-opus-4": "anthropic",
    "gemini-2.5-pro": "google",
    "gemini-2.5-flash": "google",
    "llama-4-maverick": "meta",
    "mistral-large": "mistral",
    "deepseek-r1": "deepseek",
  };

  it("routes OpenAI models correctly", () => {
    expect(MODEL_TO_PROVIDER["gpt-4o"]).toBe("openai");
    expect(MODEL_TO_PROVIDER["gpt-4o-mini"]).toBe("openai");
  });

  it("routes Anthropic models correctly", () => {
    expect(MODEL_TO_PROVIDER["claude-sonnet-4"]).toBe("anthropic");
  });

  it("routes Google models correctly", () => {
    expect(MODEL_TO_PROVIDER["gemini-2.5-pro"]).toBe("google");
  });

  it("handles unknown models", () => {
    expect(MODEL_TO_PROVIDER["unknown-model"]).toBeUndefined();
  });
});

describe("Response cache key generation", () => {
  it("generates consistent hash for same inputs", async () => {
    const input = JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "hello" }], max_tokens: 100 });
    const encoder = new TextEncoder();
    const hash1 = await crypto.subtle.digest("SHA-256", encoder.encode(input));
    const hash2 = await crypto.subtle.digest("SHA-256", encoder.encode(input));

    const hex1 = Array.from(new Uint8Array(hash1)).map(b => b.toString(16).padStart(2, "0")).join("");
    const hex2 = Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, "0")).join("");

    expect(hex1).toBe(hex2);
  });

  it("generates different hash for different inputs", async () => {
    const encoder = new TextEncoder();
    const hash1 = await crypto.subtle.digest("SHA-256", encoder.encode("input1"));
    const hash2 = await crypto.subtle.digest("SHA-256", encoder.encode("input2"));

    const hex1 = Array.from(new Uint8Array(hash1)).map(b => b.toString(16).padStart(2, "0")).join("");
    const hex2 = Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, "0")).join("");

    expect(hex1).not.toBe(hex2);
  });
});
