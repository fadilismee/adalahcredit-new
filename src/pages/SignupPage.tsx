import { Link, Navigate, useLocation } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { SignUp } from "@/components/SignUp";
import { TestUserLoginSection } from "@/components/TestUserLoginSection";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Check, Loader2 } from "lucide-react";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

export function SignupPage() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useConvexAuth();
  // FIX H13: Preserve redirect destination from query params or state
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("redirect")
    || (location.state as { from?: string })?.from
    || "/dashboard";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const planFeatures = [
    t("signup.feature1"),
    t("signup.feature2"),
    t("signup.feature3"),
    t("signup.feature4"),
    t("signup.feature5"),
  ];

  return (
    <div className="flex-1 flex min-h-screen bg-background">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#09090b] via-[#0c0c10] to-[#09090b] border-r border-border flex-col justify-between p-10">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-emerald-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-20 -left-20 w-[200px] h-[200px] rounded-full bg-blue-500/[0.03] blur-[80px]" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-16">
            <div className="size-8 rounded-lg bg-foreground flex items-center justify-center">
              <Zap className="size-4 text-background" />
            </div>
            <span className="text-base font-semibold text-foreground">AdalahCredit</span>
          </Link>
          <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight whitespace-pre-line">
            {t("signup.heroTitle")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {t("signup.heroSubtitle")}
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-4">{t("signup.planIncludes")}</p>
          <div className="space-y-3">
            {planFeatures.map((f) => (
              <div key={f} className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="size-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="size-3 text-emerald-400" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — signup form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex justify-center mb-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-foreground flex items-center justify-center">
                <Zap className="size-4 text-background" />
              </div>
              <span className="text-base font-semibold text-foreground">AdalahCredit</span>
            </Link>
          </div>

          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{t("signup.title")}</h1>
            <p className="text-muted-foreground text-xs">{t("signup.subtitle")}</p>
          </div>

          <TestUserLoginSection />
          <SignUp />

          <p className="text-center text-xs text-muted-foreground">
            {t("signup.hasAccount")}{" "}
            <Button variant="link" className="p-0 h-auto font-medium text-xs text-foreground/70 hover:text-foreground" asChild>
              <Link to="/login">{t("signup.signIn")} <ArrowRight className="size-3 ml-0.5 inline" /></Link>
            </Button>
          </p>

          <p className="text-center text-[10px] text-muted-foreground">
            {t("signup.agreeTerms")}{" "}
            <Link to="/terms" className="text-muted-foreground hover:text-foreground/70 transition-colors">{t("footer.terms")}</Link>{" "}
            {t("login.and")}{" "}
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground/70 transition-colors">{t("footer.privacy")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
