import { Zap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: `We collect information that you provide directly and information generated through your use of the Service.\n\n**Account Information:**\n• Name, email address, and password\n• Organization name (if applicable)\n• Billing information (processed securely via Stripe)\n\n**Usage Data:**\n• API request metadata (timestamps, model used, token count, latency)\n• API key identifiers (hashed)\n• IP addresses and user agent strings\n• Dashboard activity logs\n\n**API Content (optional):**\n• Request prompts and model responses are processed transiently for routing\n• If caching is enabled: cached responses are stored encrypted (auto-expire after 24h)\n• If logging is enabled: request/response pairs are stored for your review in the dashboard\n• You may disable both caching and logging at any time in Settings`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use your information to:\n\n• Provide, maintain, and improve the Service\n• Route API requests to upstream AI model providers\n• Process billing and payments\n• Send service-related notifications (outages, billing, security)\n• Monitor for abuse, fraud, and Terms of Service violations\n• Generate aggregated, anonymized analytics (never sold to third parties)\n• Provide customer support\n• Comply with legal obligations\n\nWe do NOT:\n• Sell your personal data or API content to third parties\n• Use your API prompts/responses to train AI models\n• Share your data with advertisers\n• Profile you for targeted advertising`,
  },
  {
    title: "3. Data Sharing & Third Parties",
    content: `We share data only as necessary to provide the Service:\n\n**AI Model Providers:** Your API request content is forwarded to the selected model provider (OpenAI, Anthropic, Google, etc.) for processing. Each provider has its own privacy policy governing their handling of request data.\n\n**Payment Processor:** Billing data is processed by Stripe. AdalahCredit does not store full credit card numbers.\n\n**Infrastructure:** We use cloud infrastructure providers (AWS, Cloudflare) for hosting and CDN. Data is encrypted in transit and at rest.\n\n**Legal Requirements:** We may disclose information if required by law, court order, or government request.\n\nWe do not sell, rent, or trade your information to any third party for marketing purposes.`,
  },
  {
    title: "4. Data Retention",
    content: `We retain your data for the following periods:\n\n• Account information: Until account deletion + 30 days\n• Usage metadata: 90 days (configurable for Enterprise)\n• API logs (if enabled): 30 days by default (configurable)\n• Cached responses: 24 hours maximum\n• Billing records: 7 years (legal requirement)\n• Audit logs: 1 year\n\nYou may request data export or deletion at any time through the Dashboard or by contacting support@adalahcredit.com.`,
  },
  {
    title: "5. Data Security",
    content: `We implement industry-standard security measures:\n\n• TLS 1.3 encryption for all API traffic and dashboard access\n• AES-256 encryption for data at rest\n• API keys are stored as salted hashes (we never store plaintext keys after initial display)\n• SOC 2 Type II compliance (in progress)\n• Regular third-party security audits and penetration testing\n• Edge computing across 10 global regions for low-latency, localized processing\n• Automated vulnerability scanning and dependency updates\n• Role-based access control for internal systems\n\nDespite our efforts, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    title: "6. Your Rights (GDPR / CCPA)",
    content: `Depending on your jurisdiction, you may have the following rights:\n\n**GDPR (EU/EEA residents):**\n• Right to access your personal data\n• Right to rectification of inaccurate data\n• Right to erasure ("right to be forgotten")\n• Right to restrict processing\n• Right to data portability\n• Right to object to processing\n• Right to withdraw consent\n\n**CCPA (California residents):**\n• Right to know what personal information is collected\n• Right to delete personal information\n• Right to opt-out of sale (we do not sell data)\n• Right to non-discrimination for exercising rights\n\nTo exercise any of these rights, contact privacy@adalahcredit.com or use the Privacy settings in your Dashboard.`,
  },
  {
    title: "7. Cookies & Tracking",
    content: `Our dashboard uses minimal cookies:\n\n• **Essential cookies:** Session management, authentication (required)\n• **Analytics cookies:** Anonymous usage analytics to improve the dashboard (optional, via settings)\n\nWe do NOT use:\n• Third-party advertising cookies\n• Cross-site tracking pixels\n• Fingerprinting techniques\n\nThe API endpoints (api.adalahcredit.com) do not set any cookies.`,
  },
  {
    title: "8. International Data Transfers",
    content: `AdalahCredit processes data in multiple regions to provide low-latency service globally. API requests are processed in the edge region closest to you.\n\nFor EU/EEA users, data transfers outside the EEA are protected by:\n• Standard Contractual Clauses (SCCs)\n• Adequacy decisions where applicable\n• Encryption in transit and at rest\n\nYou may request that your data be processed in a specific region (available on Enterprise plan).`,
  },
  {
    title: "9. Children's Privacy",
    content: `The Service is not intended for children under 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us at privacy@adalahcredit.com and we will delete the information promptly.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes by:\n\n• Posting a notice on the Dashboard\n• Sending an email to your registered address\n• Updating the "Last updated" date above\n\nContinued use of the Service after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "11. Contact Us",
    content: `For privacy-related questions or requests:\n\n• Email: privacy@adalahcredit.com\n• Data Protection Officer: dpo@adalahcredit.com\n• Support: support.adalahcredit.com\n• Address: AdalahCredit AI, Inc.`,
  },
];

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold">AdalahCredit</span>
          </Link>
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Terms of Service →</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-2">Last updated: June 1, 2026</p>
        <p className="text-xs text-muted-foreground mb-10">
          AdalahCredit AI, Inc. ("AdalahCredit", "we", "us") is committed to protecting your privacy. This policy explains how we collect, use, and protect your information when you use our API gateway service.
        </p>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-sm font-semibold text-foreground/80 mb-3">{s.title}</h2>
              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</div>
            </section>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-6 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to AdalahCredit
          </Link>
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Terms of Service →</Link>
        </div>
      </main>
    </div>
  );
}
