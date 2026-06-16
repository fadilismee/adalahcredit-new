import { AuthStrategyRoutes } from "./auth/AuthStrategyRoutes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./lib/i18n";
import { CurrencyProvider } from "./lib/currency";
import { usePageTracking } from "./hooks/useAnalytics";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";

function AppInner() {
  usePageTracking();
  return (
    <>
      <Toaster />
      <AuthStrategyRoutes />
    </>
  );
}

function App() {
  // OAuth callback page must render OUTSIDE auth providers to avoid
  // corrupting the parent window's session when popup loads the SPA.
  if (window.location.pathname === "/oauth/callback") {
    return <OAuthCallbackPage />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" switchable>
        <I18nProvider>
          <CurrencyProvider>
            <AppInner />
          </CurrencyProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
