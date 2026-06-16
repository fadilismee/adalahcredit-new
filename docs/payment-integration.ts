/**
 * Payment Gateway Infrastructure
 * 
 * Supports Duitku and Tripay — Indonesian payment gateways.
 * 
 * SETUP:
 * 1. Set environment variables in Convex Dashboard:
 *    - DUITKU_MERCHANT_CODE
 *    - DUITKU_API_KEY
 *    - DUITKU_CALLBACK_URL
 *    or
 *    - TRIPAY_API_KEY
 *    - TRIPAY_PRIVATE_KEY
 *    - TRIPAY_MERCHANT_CODE
 * 
 * 2. The payment flow:
 *    - User selects amount on /topup
 *    - Frontend calls createPaymentOrder mutation
 *    - Backend creates order via Duitku/Tripay API
 *    - User pays on external page
 *    - Gateway sends callback to our HTTP endpoint
 *    - We verify signature and credit the user
 */

// Uses Web Crypto API (available in Convex runtime)

interface PaymentConfig {
  provider: "duitku" | "tripay" | "none";
  merchantCode: string;
  apiKey: string;
  callbackUrl: string;
  sandbox: boolean;
}

export function getPaymentConfig(): PaymentConfig {
  const duitkuCode = process.env.DUITKU_MERCHANT_CODE;
  const duitkuKey = process.env.DUITKU_API_KEY;

  if (duitkuCode && duitkuKey) {
    return {
      provider: "duitku",
      merchantCode: duitkuCode,
      apiKey: duitkuKey,
      callbackUrl: process.env.DUITKU_CALLBACK_URL || "",
      sandbox: process.env.DUITKU_SANDBOX === "true",
    };
  }

  const tripayKey = process.env.TRIPAY_API_KEY;
  const tripayPrivate = process.env.TRIPAY_PRIVATE_KEY;

  if (tripayKey && tripayPrivate) {
    return {
      provider: "tripay",
      merchantCode: process.env.TRIPAY_MERCHANT_CODE || "",
      apiKey: tripayKey,
      callbackUrl: "",
      sandbox: process.env.TRIPAY_SANDBOX === "true",
    };
  }

  return { provider: "none", merchantCode: "", apiKey: "", callbackUrl: "", sandbox: true };
}

/** Verify Duitku callback signature (MD5 hash) */
export async function verifyDuitkuSignature(
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  apiKey: string,
  receivedSignature: string
): Promise<boolean> {
  const raw = merchantCode + amount + merchantOrderId + apiKey;
  const data = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const expected = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return expected === receivedSignature;
}

/** Verify Tripay callback signature (HMAC-SHA256) */
export async function verifyTripaySignature(
  privateKey: string,
  callbackJson: string,
  receivedSignature: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(privateKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(callbackJson));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return expected === receivedSignature;
}
