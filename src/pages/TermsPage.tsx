import { Zap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using AdalahCredit's API gateway service ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.\n\nCredit reserves the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms. We will notify you of material changes via email or dashboard notification.`,
  },
  {
    title: "2. Description of Service",
    content: `AdalahCredit provides a unified API gateway that enables access to multiple AI model providers through a single API key and endpoint. The Service includes:\n\n• API access to third-party AI models (OpenAI, Anthropic, Google, Meta, Mistral, xAI, Cohere, DeepSeek, and others)\n• Dashboard for managing API keys, monitoring usage, and billing\n• Documentation, SDKs, and developer tools\n• Semantic caching, auto-failover, and request routing\n\nCredit acts as an intermediary and does not control the AI models themselves. Model availability, capabilities, and pricing may change based on upstream provider changes.`,
  },
  {
    title: "3. Account Registration",
    content: `To use the Service, you must create an account and provide accurate, complete information. You are responsible for:\n\n• Maintaining the confidentiality of your API keys and account credentials\n• All activities that occur under your account\n• Notifying AdalahCredit immediately of any unauthorized use\n• Ensuring your account information remains current and accurate\n\nYou must be at least 18 years old to create an account. Organizations must have authority to bind the entity to these Terms.`,
  },
  {
    title: "4. API Usage & Rate Limits",
    content: `Your use of the API is subject to the rate limits and quotas associated with your plan:\n\n• Starter: 1,000 requests/min, 200K tokens/min\n• Pro: 10,000 requests/min, 2M tokens/min\n• Enterprise: Custom limits\n\nExceeding rate limits will result in HTTP 429 responses. Sustained abuse of rate limits may result in temporary or permanent suspension. You agree not to circumvent rate limits through multiple accounts or other means.`,
  },
  {
    title: "5. Acceptable Use",
    content: `You agree not to use the Service to:\n\n• Generate content that violates applicable laws or regulations\n• Harass, abuse, or harm others\n• Generate spam, malware, or phishing content\n• Attempt to reverse-engineer, decompile, or extract model weights\n• Resell API access without a valid reseller agreement\n• Circumvent safety filters or content moderation\n• Process personal data without appropriate legal basis\n• Generate content that exploits minors\n\nCredit reserves the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: "6. Pricing & Billing",
    content: `Usage is billed based on token consumption at the rates displayed on the Pricing page and in the Dashboard. Prices are in USD.\n\n• Billing is calculated per-token for each model used\n• Monthly invoices are generated on the 1st of each month\n• Payment is due within 14 days of invoice date\n• AdalahCredit reserves the right to change pricing with 30 days notice\n• Unused credits or prepaid amounts are non-refundable\n• Disputed charges must be reported within 60 days\n\nEnterprise customers may negotiate custom pricing and payment terms.`,
  },
  {
    title: "7. Data & Privacy",
    content: `AdalahCredit processes API requests to route them to upstream providers. Please refer to our Privacy Policy for detailed information about data handling.\n\n• AdalahCredit does not store request/response content beyond what is needed for caching (if enabled) and logging (configurable)\n• Cached responses are encrypted at rest and automatically expire\n• You may disable caching and logging in your dashboard settings\n• AdalahCredit complies with GDPR, CCPA, and other applicable data protection regulations`,
  },
  {
    title: "8. Service Level Agreement",
    content: `AdalahCredit commits to the following uptime guarantees:\n\n• Starter: 99.9% monthly uptime\n• Pro: 99.95% monthly uptime\n• Enterprise: 99.99% monthly uptime (with custom SLA)\n\nIf AdalahCredit fails to meet the uptime commitment, eligible customers may request service credits as follows: <99.9% = 10% credit, <99.5% = 25% credit, <99.0% = 50% credit. Claims must be submitted within 30 days.`,
  },
  {
    title: "9. Intellectual Property",
    content: `You retain all rights to your input prompts and any original content in your outputs, subject to upstream provider terms. AdalahCredit retains all rights to the Service, including its software, documentation, branding, and infrastructure.\n\nYou grant AdalahCredit a limited license to process your requests for the purpose of providing the Service. This license terminates when you delete your account.`,
  },
  {
    title: "10. Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, CREDIT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.\n\nCredit's total liability shall not exceed the amount paid by you in the 12 months preceding the claim. AdalahCredit is not responsible for the accuracy, quality, or appropriateness of AI model outputs.`,
  },
  {
    title: "11. Termination",
    content: `Either party may terminate this agreement at any time. AdalahCredit may suspend or terminate your account immediately if you violate these Terms.\n\nUpon termination:\n• Your API keys will be immediately revoked\n• You remain responsible for outstanding charges\n• AdalahCredit will delete your data within 30 days, except as required by law\n• You may export your usage data before account deletion`,
  },
  {
    title: "12. Contact",
    content: `For questions about these Terms, contact us at:\n\n• Email: legal@adalahcredit.com\n• Support: support.adalahcredit.com\n• Address: AdalahCredit AI, Inc.`,
  },
];

export function TermsPage() {
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
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Privacy Policy →</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-2">Last updated: June 1, 2026</p>
        <p className="text-xs text-muted-foreground mb-10">These terms govern your use of the AdalahCredit API gateway service.</p>

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
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors">Privacy Policy →</Link>
        </div>
      </main>
    </div>
  );
}
