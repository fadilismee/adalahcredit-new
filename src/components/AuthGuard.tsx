import { useConvexAuth } from "convex/react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Protects routes that require authentication.
 * Redirects to /login if user is not authenticated.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-muted-foreground animate-spin" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // FIX M28: Preserve full path including query params and hash
    return <Navigate to="/login" state={{ from: location.pathname + location.search + location.hash }} replace />;
  }

  return <>{children}</>;
}
