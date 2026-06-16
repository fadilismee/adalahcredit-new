import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEnsureProfile } from "@/hooks/useEnsureProfile";

/**
 * Protects admin-only routes.
 * Must be used inside AuthGuard (assumes user is already authenticated).
 * Redirects non-admin users to /dashboard.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useEnsureProfile();

  if (isLoading || profile === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-muted-foreground animate-spin" />
          <p className="text-xs text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
