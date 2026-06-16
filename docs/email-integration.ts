/**
 * Email Notification Infrastructure
 * 
 * Uses Resend (resend.com) for transactional emails.
 * 
 * SETUP:
 * 1. Create account at resend.com
 * 2. Verify your domain (adalahcredit.com)
 * 3. Set in Convex Dashboard environment variables:
 *    - RESEND_API_KEY=re_xxxxx
 *    - EMAIL_FROM=noreply@adalahcredit.com
 * 
 * Without RESEND_API_KEY, all sends are no-ops (logged but not sent).
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "AdalahCredit <noreply@adalahcredit.com>";

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log(`[email:noop] to=${payload.to} subject="${payload.subject}" — RESEND_API_KEY not set`);
    return { success: true, id: "noop" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── Email Templates ──────────────────────────────────────────

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to AdalahCredit! 🚀",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Welcome to AdalahCredit!</h1>
        <p>Hi ${name},</p>
        <p>Your account is ready. You have <strong>$5.00 in free credits</strong> to get started.</p>
        <p>Quick start:</p>
        <ol>
          <li>Generate your API key in the <a href="https://adalahcredit.com/dashboard">Dashboard</a></li>
          <li>Use any AI model with one API call</li>
          <li>Check the <a href="https://adalahcredit.com/docs">Documentation</a> for examples</li>
        </ol>
        <p>Happy coding! 🎉</p>
        <p>— The AdalahCredit Team</p>
      </div>
    `,
  };
}

export function creditAlertEmail(name: string, usagePercent: number, remaining: number) {
  return {
    subject: `⚠️ Credit Alert: ${usagePercent}% used`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${usagePercent >= 95 ? '#ef4444' : usagePercent >= 80 ? '#f59e0b' : '#eab308'};">
          Credit Usage Alert
        </h2>
        <p>Hi ${name},</p>
        <p>You've used <strong>${usagePercent}%</strong> of your monthly credits. 
           Remaining: <strong>$${(remaining / 100).toFixed(2)}</strong></p>
        <p><a href="https://adalahcredit.com/topup" style="background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Top Up Now →</a></p>
        <p>— AdalahCredit</p>
      </div>
    `,
  };
}

export function paymentReceiptEmail(name: string, amount: number, orderId: string) {
  return {
    subject: `Payment Receipt — $${(amount / 100).toFixed(2)}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Payment Received ✅</h2>
        <p>Hi ${name},</p>
        <p>We've received your payment of <strong>$${(amount / 100).toFixed(2)}</strong>.</p>
        <p>Order ID: <code>${orderId}</code></p>
        <p>Credits have been added to your account.</p>
        <p><a href="https://adalahcredit.com/receipt?order=${orderId}">View Receipt →</a></p>
        <p>— AdalahCredit</p>
      </div>
    `,
  };
}
