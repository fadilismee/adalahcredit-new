import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Locale = "en" | "id";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navbar
    "nav.models": "Models",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.docs": "Docs",
    "nav.login": "Log in",
    "nav.getApiKey": "Get API Key",
    "nav.home": "Home",
    "nav.blog": "Blog",
    "nav.changelog": "Changelog",
    "nav.support": "Support",

    // Hero
    "hero.badge": "AdalahCredit v3.0 — Smarter routing",
    "hero.title1": "One API key for",
    "hero.title2": "every AI model",
    "hero.subtitle": "Access 370+ models from OpenAI, Anthropic, Google, Meta and more. One endpoint. No vendor lock-in.",
    "hero.cta": "Get Free API Key",
    "hero.docs": "Documentation",

    // Landing — Integration / Code section
    "landing.integration": "Integration",
    "landing.fiveLines1": "Five lines to",
    "landing.fiveLines2": "every AI model",
    "landing.integrationDesc": "OpenAI-compatible API. Change one line and unlock 370+ models with automatic fallbacks, caching, and load balancing.",

    // Landing — API log section
    "landing.apiLogTitle1": "Ship faster with",
    "landing.apiLogTitle2": "one integration",
    "landing.apiLogDesc": "OpenAI-compatible API. Change one line and unlock 370+ models from every major provider.",
    "landing.apiLogViewDocs": "View API Docs",
    "landing.apiLogLive": "Live API traffic",

    // Landing — Models section
    "landing.modelsTitle": "370+ models, one key",
    "landing.modelsDesc": "From GPT-4o to Claude, Gemini, Llama, Mistral and beyond. Switch models with a single parameter.",
    "landing.modelsViewAll": "View all models",
    "landing.modelsInput": "Input",
    "landing.modelsOutput": "Output",
    "landing.modelsPer1M": "per 1M tokens",

    // Landing — Features section
    "features.title": "Everything you need",
    "features.subtitle": "Built for developers who want simplicity without sacrificing power.",
    "features.smartRouting": "Smart Routing",
    "features.smartRoutingDesc": "Intelligent load balancing across providers with automatic failover. Your requests always go through.",
    "features.unifiedBilling": "Unified Billing",
    "features.unifiedBillingDesc": "One invoice, all providers. Track cost per model, per team, per project. No surprise bills.",
    "features.realTimeAnalytics": "Real-time Analytics",
    "features.realTimeAnalyticsDesc": "Monitor latency, cost, and token usage across all models in real time.",
    "features.semanticCache": "Semantic Caching",
    "features.semanticCacheDesc": "Reduce costs up to 90% with intelligent response caching. Same results, fraction of the cost.",
    "features.enterpriseSecurity": "Enterprise Security",
    "features.enterpriseSecurityDesc": "SOC 2 compliant. End-to-end encryption. Data never stored. Built for regulated industries.",
    "features.sdksAndPlugins": "SDKs & Plugins",
    "features.sdksAndPluginsDesc": "Drop-in SDKs for Python, Node.js, Go, and more. Works with LangChain, LlamaIndex, and Vercel AI.",

    // Landing — How it works
    "howItWorks.title": "Four steps to production",
    "howItWorks.step1": "Create account",
    "howItWorks.step1Desc": "Sign up in seconds. Free tier included with Rp 25.000 monthly credits.",
    "howItWorks.step2": "Get your API key",
    "howItWorks.step2Desc": "Generate a key from the dashboard. One key, all models.",
    "howItWorks.step3": "Access every model",
    "howItWorks.step3Desc": "Switch between 370+ models by changing a single parameter.",
    "howItWorks.step4": "Scale confidently",
    "howItWorks.step4Desc": "Built-in failover, caching, and analytics. Production ready from day one.",

    // Landing — Testimonials
    "testimonials.title": "What developers say",

    // Landing — Pricing
    "pricing.title": "Simple, transparent pricing",
    "pricing.subtitle": "Pay only for what you use. No hidden fees.",
    "pricing.transparentPricing": "Transparent Pricing",
    "pricing.payPerToken": "Pay per token, no markup",
    "pricing.perMillion": "Per 1M tokens. Pass-through provider rates.",
    "pricing.free": "Free",
    "pricing.starter": "Starter",
    "pricing.pro": "Pro",
    "pricing.enterprise": "Enterprise",
    "pricing.month": "/month",
    "pricing.getStarted": "Get started",
    "pricing.currentPlan": "Current plan",
    "pricing.contactSales": "Contact Sales",
    "pricing.custom": "Custom",

    // Landing — FAQ
    "faq.title": "Frequently asked questions",
    "faq.q1": "What is AdalahCredit?",
    "faq.a1": "A unified API gateway that gives you access to 370+ AI models from all major providers through a single API key and endpoint.",
    "faq.q2": "How does pricing work?",
    "faq.a2": "You pay per token, priced per 1 million tokens. Prices vary by model. The Free plan includes Rp 25.000/month in credits.",
    "faq.q3": "Is my data secure?",
    "faq.a3": "Yes. We don't log or store any prompt or completion data. All traffic is encrypted in transit. SOC 2 compliant.",
    "faq.q4": "Can I switch models easily?",
    "faq.a4": "Absolutely. Just change the model parameter in your API call. No code changes needed — same endpoint, same API key.",
    "faq.q5": "Do you support streaming?",
    "faq.a5": "Yes. We support streaming responses (SSE) for all chat completion models, matching the OpenAI streaming format.",

    // Landing — CTA bottom
    "cta.title": "Start building with every AI model",
    "cta.subtitle": "Free to start. No credit card required.",
    "cta.button": "Get Started Free",
    "cta.sales": "Talk to Sales",

    // Landing — Footer
    "footer.tagline": "One API for every AI model.\nBuilt for developers who ship fast.",
    "footer.product": "Product",
    "footer.resources": "Resources",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.copyright": "© 2026 AdalahCredit. All rights reserved.",
    "footer.status": "Status",
    "footer.referral": "Referral",
    "footer.compare": "Compare",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",

    // Login page
    "login.title": "Welcome back",
    "login.subtitle": "Sign in to your AdalahCredit account",
    "login.heroTitle": "One API key.\nEvery AI model.",
    "login.heroSubtitle": "Access GPT-4o, Claude, Gemini, Llama, and 370+ models through a single unified API with intelligent routing.",
    "login.feature1": "370+ models from 220+ providers",
    "login.feature2": "Enterprise-grade security & compliance",
    "login.feature3": "Real-time analytics & cost optimization",
    "login.noAccount": "Don't have an account?",
    "login.signUp": "Sign up",
    "login.agreeTerms": "By signing in, you agree to our",
    "login.and": "and",

    // Signup page
    "signup.title": "Create account",
    "signup.subtitle": "Free forever — start now",
    "signup.heroTitle": "Start building\nin minutes.",
    "signup.heroSubtitle": "Create a free account and instantly access all AI models through one API.",
    "signup.planIncludes": "Free plan includes",
    "signup.feature1": "Rp 25.000 free credits/month",
    "signup.feature2": "Access to 24+ AI models",
    "signup.feature3": "Real-time dashboard",
    "signup.feature4": "2 API keys",
    "signup.feature5": "Community support",
    "signup.hasAccount": "Already have an account?",
    "signup.signIn": "Sign in",
    "signup.agreeTerms": "By creating an account, you agree to our",

    // Models page
    "models.title": "All AI Models",
    "models.catalogTitle": "Model Catalog",
    "models.catalogDesc": "All AI models available through AdalahCredit. One API key, all providers. Prices per 1 million tokens.",
    "models.search": "Search model...",
    "models.allProviders": "All Providers",
    "models.allCategories": "All Categories",
    "models.allCapabilities": "All Capabilities",
    "models.cards": "Cards",
    "models.table": "Table",
    "models.found": "models found",
    "models.input": "Input",
    "models.output": "Output",
    "models.context": "Context",
    "models.speed": "Speed",
    "models.capabilities": "Capabilities",
    "models.maxOutput": "Max Output",
    "models.free": "Free",
    "models.backToHome": "Back to Home",

    // Docs page
    "docs.title": "Introduction",
    "docs.introText": "AdalahCredit is a unified API gateway that gives you access to 370+ AI models through a single endpoint. Use one API key to interact with OpenAI, Anthropic, Google, Meta, Mistral, and many more providers.",
    "docs.singleEndpoint": "Single Endpoint",
    "docs.singleEndpointDesc": "One URL, one key for every AI model",
    "docs.models300": "370+ Models",
    "docs.models300Desc": "All major providers always up to date",
    "docs.enterpriseReady": "Enterprise Ready",
    "docs.enterpriseReadyDesc": "SOC2, GDPR, HIPAA compliant",
    "docs.realTimeAnalytics": "Real-time Analytics",
    "docs.realTimeAnalyticsDesc": "Track usage, cost, and performance",
    "docs.baseUrl": "Base URL",
    "docs.baseUrlDesc": "All API requests should be made to this base URL. AdalahCredit is compatible with the OpenAI SDK format, so you can use existing OpenAI libraries by simply changing the base URL and API key.",
    "docs.searchDocs": "Search docs...",
    "docs.gettingStarted": "GETTING STARTED",
    "docs.introduction": "Introduction",
    "docs.quickstart": "Quickstart",
    "docs.authentication": "Authentication",
    "docs.apiReference": "API REFERENCE",
    "docs.chatCompletions": "Chat Completions",
    "docs.createChatCompletion": "Create Chat Completion",
    "docs.streaming": "Streaming",
    "docs.functionCalling": "Function Calling",
    "docs.embeddings": "Embeddings",
    "docs.createEmbedding": "Create Embedding",
    "docs.modelsApi": "Models",
    "docs.listModels": "List Models",
    "docs.retrieveModel": "Retrieve Model",
    "docs.guides": "GUIDES",
    "docs.smartRouting": "Smart Routing",
    "docs.rateLimits": "Rate Limits",
    "docs.errorHandling": "Error Handling",
    "docs.semanticCaching": "Semantic Caching",
    "docs.copyright": "© 2026 AdalahCredit. All rights reserved.",

    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.create": "Create",
    "common.search": "Search...",
    "common.export": "Export",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.topUp": "Top Up",
    "common.per1MTokens": "per 1M tokens",

    // Dashboard
    "dash.overview": "Overview",
    "dash.apiKeys": "API Keys",
    "dash.usage": "Usage",
    "dash.logs": "Logs",
    "dash.billing": "Billing",
    "dash.team": "Team",
    "dash.webhooks": "Webhooks",
    "dash.settings": "Settings",
    "dash.totalRequests": "Total Requests",
    "dash.totalSpend": "Total Spend",
    "dash.activeKeys": "Active Keys",
    "dash.avgLatency": "Avg Latency",

    // Spending alerts
    "alert.50": "You've used {pct}% of your monthly credits. ${remaining} remaining.",
    "alert.80": "You've used {pct}% of your monthly credits. ${remaining} remaining.",
    "alert.95": "You've used {pct}% of your credits. ${remaining} remaining. Top up now!",

    // Onboarding
    "onboarding.welcome": "Welcome to AdalahCredit",
    "onboarding.step1Title": "Choose your plan",
    "onboarding.step2Title": "Create your first API key",
    "onboarding.step3Title": "Start building",
    "onboarding.keyWarning": "This key gives you access to all 370+ models. Keep it secret!",
    "onboarding.ready": "Your account is ready. Start building with 370+ AI models through one simple API.",
    "onboarding.tryNow": "Try it now in the",
    "onboarding.goToDashboard": "Go to Dashboard",

    // Support
    "support.title": "Support Center",
    "support.subtitle": "We're here to help. Submit a ticket and our team will get back to you within 24 hours.",
    "support.newTicket": "New Ticket",
    "support.myTickets": "My Tickets",
    "support.faq": "FAQ",

    // Status
    "status.title": "System Status",
    "status.allSystems": "All Systems Operational",
    "status.operational": "Operational",
    "status.degraded": "Degraded",
    "status.down": "Down",

    // Changelog
    "changelog.title": "Changelog",
    "changelog.subtitle": "All the latest updates and improvements to AdalahCredit.",

    // Referral
    "referral.title": "Referral Program",
    "referral.subtitle": "Invite friends and earn free credits. Both of you get Rp 50.000 bonus credits!",

    // Blog
    "blog.title": "Blog",
    "blog.subtitle": "Insights, tutorials, and updates from the AdalahCredit team.",
    "blog.readMore": "Read more",

    // Compare
    "compare.title": "Compare AI Models",
    "compare.subtitle": "Side-by-side comparison of AI models. Find the best model for your use case.",

    // TopUp
    "topup.title": "Top Up Credits",
    "topup.subtitle": "Add credits to your account. Pay only for what you use.",
  },
  id: {
    // Navbar
    "nav.models": "Model",
    "nav.features": "Fitur",
    "nav.pricing": "Harga",
    "nav.docs": "Dokumentasi",
    "nav.login": "Masuk",
    "nav.getApiKey": "Dapatkan API Key",
    "nav.home": "Beranda",
    "nav.blog": "Blog",
    "nav.changelog": "Perubahan",
    "nav.support": "Bantuan",

    // Hero
    "hero.badge": "AdalahCredit v3.0 — Routing lebih cerdas",
    "hero.title1": "Satu API key untuk",
    "hero.title2": "semua model AI",
    "hero.subtitle": "Akses 370+ model dari OpenAI, Anthropic, Google, Meta dan lainnya. Satu endpoint. Tanpa vendor lock-in.",
    "hero.cta": "Dapatkan API Key Gratis",
    "hero.docs": "Dokumentasi",

    // Landing — Integration / Code section
    "landing.integration": "Integrasi",
    "landing.fiveLines1": "Lima baris untuk",
    "landing.fiveLines2": "semua model AI",
    "landing.integrationDesc": "API kompatibel OpenAI. Ubah satu baris dan akses 370+ model dengan fallback otomatis, caching, dan load balancing.",

    // Landing — API log section
    "landing.apiLogTitle1": "Kirim lebih cepat dengan",
    "landing.apiLogTitle2": "satu integrasi",
    "landing.apiLogDesc": "API kompatibel OpenAI. Ubah satu baris dan akses 370+ model dari semua provider besar.",
    "landing.apiLogViewDocs": "Lihat API Docs",
    "landing.apiLogLive": "Trafik API langsung",

    // Landing — Models section
    "landing.modelsTitle": "370+ model, satu key",
    "landing.modelsDesc": "Dari GPT-4o ke Claude, Gemini, Llama, Mistral dan lainnya. Ganti model dengan satu parameter.",
    "landing.modelsViewAll": "Lihat semua model",
    "landing.modelsInput": "Input",
    "landing.modelsOutput": "Output",
    "landing.modelsPer1M": "per 1 juta token",

    // Landing — Features section
    "features.title": "Semua yang kamu butuhkan",
    "features.subtitle": "Dibangun untuk developer yang ingin kemudahan tanpa mengorbankan kemampuan.",
    "features.smartRouting": "Routing Cerdas",
    "features.smartRoutingDesc": "Load balancing cerdas antar provider dengan failover otomatis. Request kamu selalu terkirim.",
    "features.unifiedBilling": "Billing Terpadu",
    "features.unifiedBillingDesc": "Satu invoice, semua provider. Lacak biaya per model, per tim, per proyek. Tanpa tagihan kejutan.",
    "features.realTimeAnalytics": "Analitik Real-time",
    "features.realTimeAnalyticsDesc": "Pantau latensi, biaya, dan penggunaan token di semua model secara real time.",
    "features.semanticCache": "Semantic Caching",
    "features.semanticCacheDesc": "Kurangi biaya hingga 90% dengan caching respons cerdas. Hasil sama, biaya jauh lebih kecil.",
    "features.enterpriseSecurity": "Keamanan Enterprise",
    "features.enterpriseSecurityDesc": "SOC 2 compliant. Enkripsi end-to-end. Data tidak pernah disimpan. Dibangun untuk industri teregulasi.",
    "features.sdksAndPlugins": "SDK & Plugin",
    "features.sdksAndPluginsDesc": "SDK siap pakai untuk Python, Node.js, Go, dan lainnya. Kompatibel dengan LangChain, LlamaIndex, dan Vercel AI.",

    // Landing — How it works
    "howItWorks.title": "Empat langkah ke produksi",
    "howItWorks.step1": "Buat akun",
    "howItWorks.step1Desc": "Daftar dalam hitungan detik. Tier gratis termasuk kredit Rp 25.000/bulan.",
    "howItWorks.step2": "Dapatkan API key",
    "howItWorks.step2Desc": "Generate key dari dashboard. Satu key, semua model.",
    "howItWorks.step3": "Akses semua model",
    "howItWorks.step3Desc": "Ganti antara 370+ model cukup ubah satu parameter.",
    "howItWorks.step4": "Scale dengan percaya diri",
    "howItWorks.step4Desc": "Failover, caching, dan analitik bawaan. Siap produksi sejak hari pertama.",

    // Landing — Testimonials
    "testimonials.title": "Kata para developer",

    // Landing — Pricing
    "pricing.title": "Harga simpel & transparan",
    "pricing.subtitle": "Bayar hanya untuk yang kamu pakai. Tanpa biaya tersembunyi.",
    "pricing.transparentPricing": "Harga Transparan",
    "pricing.payPerToken": "Bayar per token, tanpa markup",
    "pricing.perMillion": "Per 1 juta token. Harga langsung dari provider.",
    "pricing.free": "Gratis",
    "pricing.starter": "Starter",
    "pricing.pro": "Pro",
    "pricing.enterprise": "Enterprise",
    "pricing.month": "/bulan",
    "pricing.getStarted": "Mulai sekarang",
    "pricing.currentPlan": "Paket saat ini",
    "pricing.contactSales": "Hubungi Sales",
    "pricing.custom": "Custom",

    // Landing — FAQ
    "faq.title": "Pertanyaan yang sering diajukan",
    "faq.q1": "Apa itu AdalahCredit?",
    "faq.a1": "API gateway terpadu yang memberi akses ke 370+ model AI dari semua provider besar melalui satu API key dan endpoint.",
    "faq.q2": "Bagaimana sistem harganya?",
    "faq.a2": "Bayar per token, harga per 1 juta token. Harga bervariasi per model. Paket Gratis termasuk kredit Rp 25.000/bulan.",
    "faq.q3": "Apakah data saya aman?",
    "faq.a3": "Ya. Kami tidak menyimpan data prompt atau completion. Semua trafik dienkripsi saat transit. SOC 2 compliant.",
    "faq.q4": "Bisa ganti model dengan mudah?",
    "faq.a4": "Tentu. Cukup ubah parameter model di API call. Tidak perlu ubah kode — endpoint dan API key sama.",
    "faq.q5": "Apakah mendukung streaming?",
    "faq.a5": "Ya. Kami mendukung streaming response (SSE) untuk semua model chat completion, sesuai format streaming OpenAI.",

    // Landing — CTA bottom
    "cta.title": "Mulai bangun dengan semua model AI",
    "cta.subtitle": "Gratis untuk mulai. Tanpa kartu kredit.",
    "cta.button": "Mulai Gratis",
    "cta.sales": "Hubungi Sales",

    // Landing — Footer
    "footer.tagline": "Satu API untuk semua model AI.\nDibangun untuk developer yang kirim cepat.",
    "footer.product": "Produk",
    "footer.resources": "Sumber Daya",
    "footer.company": "Perusahaan",
    "footer.legal": "Legal",
    "footer.copyright": "© 2026 AdalahCredit. Hak cipta dilindungi.",
    "footer.status": "Status",
    "footer.referral": "Referral",
    "footer.compare": "Bandingkan",
    "footer.terms": "Ketentuan Layanan",
    "footer.privacy": "Kebijakan Privasi",

    // Login page
    "login.title": "Selamat datang kembali",
    "login.subtitle": "Masuk ke akun AdalahCredit Anda",
    "login.heroTitle": "Satu API key.\nSemua model AI.",
    "login.heroSubtitle": "Akses GPT-4o, Claude, Gemini, Llama, dan 370+ model melalui satu API terpadu dengan routing cerdas.",
    "login.feature1": "370+ model dari 220+ provider",
    "login.feature2": "Keamanan tingkat enterprise",
    "login.feature3": "Analitik real-time & optimisasi biaya",
    "login.noAccount": "Belum punya akun?",
    "login.signUp": "Daftar",
    "login.agreeTerms": "Dengan masuk, Anda setuju dengan",
    "login.and": "dan",

    // Signup page
    "signup.title": "Buat akun",
    "signup.subtitle": "Gratis selamanya — mulai sekarang",
    "signup.heroTitle": "Mulai bangun\ndalam hitungan menit.",
    "signup.heroSubtitle": "Buat akun gratis dan langsung akses semua model AI melalui satu API.",
    "signup.planIncludes": "Paket gratis termasuk",
    "signup.feature1": "Kredit Rp 25.000 gratis/bulan",
    "signup.feature2": "Akses 24+ model AI",
    "signup.feature3": "Dashboard real-time",
    "signup.feature4": "2 API keys",
    "signup.feature5": "Community support",
    "signup.hasAccount": "Sudah punya akun?",
    "signup.signIn": "Masuk",
    "signup.agreeTerms": "Dengan membuat akun, Anda setuju dengan",

    // Models page
    "models.title": "Semua Model AI",
    "models.catalogTitle": "Katalog Model",
    "models.catalogDesc": "Semua model AI yang tersedia melalui AdalahCredit. Satu API key, semua provider. Harga per 1 juta token.",
    "models.search": "Cari model...",
    "models.allProviders": "Semua Provider",
    "models.allCategories": "Semua Kategori",
    "models.allCapabilities": "Semua Capability",
    "models.cards": "Kartu",
    "models.table": "Tabel",
    "models.found": "model ditemukan",
    "models.input": "Input",
    "models.output": "Output",
    "models.context": "Konteks",
    "models.speed": "Kecepatan",
    "models.capabilities": "Kemampuan",
    "models.maxOutput": "Max Output",
    "models.free": "Gratis",
    "models.backToHome": "Kembali",

    // Docs page
    "docs.title": "Pengenalan",
    "docs.introText": "AdalahCredit adalah API gateway terpadu yang memberi akses ke 370+ model AI melalui satu endpoint. Gunakan satu API key untuk berinteraksi dengan OpenAI, Anthropic, Google, Meta, Mistral, dan banyak provider lainnya.",
    "docs.singleEndpoint": "Satu Endpoint",
    "docs.singleEndpointDesc": "Satu URL, satu key untuk semua model AI",
    "docs.models300": "370+ Model",
    "docs.models300Desc": "Semua provider besar selalu terbaru",
    "docs.enterpriseReady": "Siap Enterprise",
    "docs.enterpriseReadyDesc": "SOC2, GDPR, HIPAA compliant",
    "docs.realTimeAnalytics": "Analitik Real-time",
    "docs.realTimeAnalyticsDesc": "Lacak penggunaan, biaya, dan performa",
    "docs.baseUrl": "Base URL",
    "docs.baseUrlDesc": "Semua permintaan API harus dikirim ke base URL ini. AdalahCredit kompatibel dengan format SDK OpenAI, sehingga Anda bisa menggunakan library OpenAI yang ada cukup dengan mengganti base URL dan API key.",
    "docs.searchDocs": "Cari dokumentasi...",
    "docs.gettingStarted": "MEMULAI",
    "docs.introduction": "Pengenalan",
    "docs.quickstart": "Mulai Cepat",
    "docs.authentication": "Autentikasi",
    "docs.apiReference": "REFERENSI API",
    "docs.chatCompletions": "Chat Completions",
    "docs.createChatCompletion": "Buat Chat Completion",
    "docs.streaming": "Streaming",
    "docs.functionCalling": "Function Calling",
    "docs.embeddings": "Embeddings",
    "docs.createEmbedding": "Buat Embedding",
    "docs.modelsApi": "Model",
    "docs.listModels": "Daftar Model",
    "docs.retrieveModel": "Ambil Model",
    "docs.guides": "PANDUAN",
    "docs.smartRouting": "Routing Cerdas",
    "docs.rateLimits": "Rate Limits",
    "docs.errorHandling": "Penanganan Error",
    "docs.semanticCaching": "Semantic Caching",
    "docs.copyright": "© 2026 AdalahCredit. Hak cipta dilindungi.",

    // Common
    "common.loading": "Memuat...",
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.delete": "Hapus",
    "common.create": "Buat",
    "common.search": "Cari...",
    "common.export": "Ekspor",
    "common.back": "Kembali",
    "common.next": "Lanjut",
    "common.submit": "Kirim",
    "common.topUp": "Isi Ulang",
    "common.per1MTokens": "per 1 juta token",

    // Dashboard
    "dash.overview": "Ringkasan",
    "dash.apiKeys": "API Keys",
    "dash.usage": "Penggunaan",
    "dash.logs": "Log",
    "dash.billing": "Tagihan",
    "dash.team": "Tim",
    "dash.webhooks": "Webhooks",
    "dash.settings": "Pengaturan",
    "dash.totalRequests": "Total Request",
    "dash.totalSpend": "Total Pengeluaran",
    "dash.activeKeys": "Key Aktif",
    "dash.avgLatency": "Rata-rata Latensi",

    // Spending alerts
    "alert.50": "Kamu sudah pakai {pct}% kredit bulan ini. Sisa ${remaining}.",
    "alert.80": "Kamu sudah pakai {pct}% kredit bulan ini. Sisa ${remaining}.",
    "alert.95": "Kamu sudah pakai {pct}% kredit. Sisa ${remaining}. Segera isi ulang!",

    // Onboarding
    "onboarding.welcome": "Selamat datang di AdalahCredit",
    "onboarding.step1Title": "Pilih paket kamu",
    "onboarding.step2Title": "Buat API key pertamamu",
    "onboarding.step3Title": "Mulai membangun",
    "onboarding.keyWarning": "Key ini memberi akses ke semua 370+ model. Jaga kerahasiaannya!",
    "onboarding.ready": "Akun kamu siap. Mulai bangun dengan 370+ model AI melalui satu API sederhana.",
    "onboarding.tryNow": "Coba sekarang di",
    "onboarding.goToDashboard": "Ke Dashboard",

    // Support
    "support.title": "Pusat Bantuan",
    "support.subtitle": "Kami siap membantu. Kirim tiket dan tim kami akan merespons dalam 24 jam.",
    "support.newTicket": "Tiket Baru",
    "support.myTickets": "Tiket Saya",
    "support.faq": "FAQ",

    // Status
    "status.title": "Status Sistem",
    "status.allSystems": "Semua Sistem Operasional",
    "status.operational": "Operasional",
    "status.degraded": "Terdegradasi",
    "status.down": "Tidak Aktif",

    // Changelog
    "changelog.title": "Log Perubahan",
    "changelog.subtitle": "Semua pembaruan dan peningkatan terbaru untuk AdalahCredit.",

    // Referral
    "referral.title": "Program Referral",
    "referral.subtitle": "Undang teman dan dapatkan kredit gratis. Kalian berdua dapat bonus kredit Rp 50.000!",

    // Blog
    "blog.title": "Blog",
    "blog.subtitle": "Insight, tutorial, dan update dari tim AdalahCredit.",
    "blog.readMore": "Baca selengkapnya",

    // Compare
    "compare.title": "Bandingkan Model AI",
    "compare.subtitle": "Perbandingan model AI secara berdampingan. Temukan model terbaik untuk kebutuhanmu.",

    // TopUp
    "topup.title": "Isi Ulang Kredit",
    "topup.subtitle": "Tambah kredit ke akunmu. Bayar hanya untuk yang kamu pakai.",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem("locale");
    if (stored === "en" || stored === "id") return stored;
    // Auto-detect from browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("id")) return "id";
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let text = translations[locale]?.[key] ?? translations.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Language switcher component */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "id" : "en")}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent ${className}`}
      title={locale === "en" ? "Bahasa Indonesia" : "English"}
    >
      <span className="text-sm">{locale === "en" ? "🇺🇸" : "🇮🇩"}</span>
      <span className="uppercase">{locale}</span>
    </button>
  );
}
