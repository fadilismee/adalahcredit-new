# AdalahCredit — Production Setup Guide

## 1. Provider API Keys

Set these in the Convex Dashboard → Settings → Environment Variables:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
MISTRAL_API_KEY=...
GROQ_API_KEY=gsk_...
DEEPSEEK_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
META_API_KEY=...
```

## 2. Payment Gateway (Duitku)

```
DUITKU_MERCHANT_CODE=D0xxx
DUITKU_API_KEY=xxx
DUITKU_CALLBACK_URL=https://blessed-sardine-879.convex.site/api/payment/callback
DUITKU_SANDBOX=false
```

Or Tripay:
```
TRIPAY_API_KEY=DEV-xxx
TRIPAY_PRIVATE_KEY=xxx
TRIPAY_MERCHANT_CODE=T0xxx
TRIPAY_SANDBOX=false
```

## 3. Email (Resend)

```
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@adalahcredit.com
```

## 4. Analytics (Umami/Plausible)

Set in `.env.local` (frontend):
```
VITE_ANALYTICS_PROVIDER=umami
VITE_ANALYTICS_SITE_ID=your-website-id
VITE_ANALYTICS_URL=https://your-umami-instance.com
```

## 5. Custom Domain

1. Buy domain (e.g., adalahcredit.com)
2. In Viktor Spaces dashboard, add custom domain to the deployed app
3. Set DNS CNAME: `adalahcredit.com → preview-api-gateway-landing-45bd0329.viktor.space`
4. Update `VITE_CONVEX_SITE_URL` in `.env.local` if API domain changes
5. Update canonical URLs in `index.html`, `sitemap.xml`, `robots.txt`

## 6. Going Live Checklist

- [ ] All provider API keys set
- [ ] Payment gateway configured & tested
- [ ] Email service verified
- [ ] Custom domain with SSL
- [ ] Analytics tracking confirmed
- [ ] Admin account created (first user = admin)
- [ ] Test a real API call through the proxy
- [ ] Verify webhook deliveries
- [ ] Check rate limits work correctly
- [ ] Review security settings (IP allowlists, key expiry)
