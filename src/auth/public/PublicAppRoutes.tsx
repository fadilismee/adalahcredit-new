import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { lazy, Suspense } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { convex } from "../convexClient";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminGuard } from "@/components/AdminGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

/* ── Eagerly loaded (above-the-fold) ── */
import { PublicLandingPage } from "@/pages/PublicLandingPage";

/* ── Lazily loaded pages ── */
const DocsPage = lazy(() => import("@/pages/DocsPage").then(m => ({ default: m.DocsPage })));
const UserDashboard = lazy(() => import("@/pages/UserDashboard").then(m => ({ default: m.UserDashboard })));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const StatusPage = lazy(() => import("@/pages/StatusPage").then(m => ({ default: m.StatusPage })));
const PlaygroundPage = lazy(() => import("@/pages/PlaygroundPage").then(m => ({ default: m.PlaygroundPage })));
const ChangelogPage = lazy(() => import("@/pages/ChangelogPage").then(m => ({ default: m.ChangelogPage })));
const TermsPage = lazy(() => import("@/pages/TermsPage").then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const SupportPage = lazy(() => import("@/pages/SupportPage").then(m => ({ default: m.SupportPage })));
const SDKsPage = lazy(() => import("@/pages/SDKsPage").then(m => ({ default: m.SDKsPage })));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage").then(m => ({ default: m.OnboardingPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const BlogPage = lazy(() => import("@/pages/BlogPage").then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage").then(m => ({ default: m.BlogPostPage })));
const ComparePage = lazy(() => import("@/pages/ComparePage").then(m => ({ default: m.ComparePage })));
const ModelsPage = lazy(() => import("@/pages/ModelsPage").then(m => ({ default: m.ModelsPage })));
const ReferralPage = lazy(() => import("@/pages/ReferralPage").then(m => ({ default: m.ReferralPage })));
const TopUpPage = lazy(() => import("@/pages/TopUpPage").then(m => ({ default: m.TopUpPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("@/pages/SignupPage").then(m => ({ default: m.SignupPage })));
const ReceiptPage = lazy(() => import("@/pages/ReceiptPage"));
const OAuthCallbackPage = lazy(() => import("@/pages/OAuthCallbackPage"));

/* ── Loading fallback ── */
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="size-6 text-muted-foreground animate-spin" />
    </div>
  );
}

/** Wrap page element in per-page ErrorBoundary */
function EB({ name, children }: { name: string; children: React.ReactNode }) {
  return <ErrorBoundary pageName={name}>{children}</ErrorBoundary>;
}

function PublicShell() {
  return (
    <main className="flex-1 flex flex-col">
      <Outlet />
    </main>
  );
}

export function PublicAppRoutes() {
  return (
    <ConvexAuthProvider client={convex}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicShell />}>
            {/* Public routes */}
            <Route path="/" element={<EB name="Landing"><PublicLandingPage /></EB>} />
            <Route path="/docs" element={<EB name="Docs"><DocsPage /></EB>} />
            <Route path="/status" element={<EB name="Status"><StatusPage /></EB>} />
            <Route path="/changelog" element={<EB name="Changelog"><ChangelogPage /></EB>} />
            <Route path="/terms" element={<EB name="Terms"><TermsPage /></EB>} />
            <Route path="/privacy" element={<EB name="Privacy"><PrivacyPage /></EB>} />
            <Route path="/support" element={<EB name="Support"><SupportPage /></EB>} />
            <Route path="/sdks" element={<EB name="SDKs"><SDKsPage /></EB>} />
            <Route path="/blog" element={<EB name="Blog"><BlogPage /></EB>} />
            <Route path="/blog/:slug" element={<EB name="Blog Post"><BlogPostPage /></EB>} />
            <Route path="/compare" element={<EB name="Compare"><ComparePage /></EB>} />
            <Route path="/models" element={<EB name="Models"><ModelsPage /></EB>} />
            <Route path="/login" element={<EB name="Login"><LoginPage /></EB>} />
            <Route path="/signup" element={<EB name="Signup"><SignupPage /></EB>} />
            <Route path="/oauth/callback" element={<EB name="OAuth Callback"><OAuthCallbackPage /></EB>} />

            {/* Protected routes — require authentication */}
            <Route path="/dashboard" element={<AuthGuard><EB name="Dashboard"><UserDashboard /></EB></AuthGuard>} />
            <Route path="/admin" element={<AuthGuard><AdminGuard><EB name="Admin"><AdminDashboard /></EB></AdminGuard></AuthGuard>} />
            <Route path="/topup" element={<AuthGuard><EB name="Top Up"><TopUpPage /></EB></AuthGuard>} />
            <Route path="/playground" element={<AuthGuard><EB name="Playground"><PlaygroundPage /></EB></AuthGuard>} />
            <Route path="/onboarding" element={<AuthGuard><EB name="Onboarding"><OnboardingPage /></EB></AuthGuard>} />
            <Route path="/referral" element={<AuthGuard><EB name="Referral"><ReferralPage /></EB></AuthGuard>} />
            <Route path="/receipt" element={<AuthGuard><EB name="Receipt"><ReceiptPage /></EB></AuthGuard>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ConvexAuthProvider>
  );
}
