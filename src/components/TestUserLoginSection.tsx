import { useAuthActions } from "@convex-dev/auth/react";
import { FlaskConical, Loader2, Shield, User } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const TEST_USER = {
  email: "user@test.local",
  password: "test123",
  name: "Test User",
} as const;

const TEST_ADMIN = {
  email: "admin@test.local",
  password: "admin123",
  name: "Admin",
} as const;

type LoginTarget = "user" | "admin" | null;

export function TestUserLoginSection() {
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState<LoginTarget>(null);
  const [error, setError] = useState("");

  const isPreview =
    import.meta.env.VITE_IS_PREVIEW === "true" ||
    import.meta.env.VITE_VIKTOR_SPACES_IS_PREVIEW === "true" ||
    import.meta.env.DEV;

  if (!isPreview) {
    return null;
  }

  const handleTestLogin = async (target: "user" | "admin") => {
    setError("");
    setLoading(target);

    const account = target === "admin" ? TEST_ADMIN : TEST_USER;
    const formData = new FormData();
    formData.set("email", account.email);
    formData.set("password", account.password);
    formData.set("flow", "signIn");

    try {
      await signIn("test", formData);
    } catch {
      formData.set("flow", "signUp");
      formData.set("name", account.name);
      try {
        await signIn("test", formData);
      } catch {
        setError("Login gagal. Coba lagi.");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border-2 border-dashed border-warning/30 bg-warning/5 p-4">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-warning flex items-center justify-center shrink-0">
            <FlaskConical className="size-4 text-warning-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Preview Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Login instan untuk test — pilih role
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            onClick={() => handleTestLogin("user")}
            disabled={loading !== null}
            variant="outline"
            className="h-auto flex-col gap-1 py-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
          >
            {loading === "user" ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <User className="size-5 text-primary" />
            )}
            <span className="text-xs font-medium">
              {loading === "user" ? "Signing in..." : "Test User"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              user@test.local
            </span>
          </Button>

          <Button
            onClick={() => handleTestLogin("admin")}
            disabled={loading !== null}
            variant="outline"
            className="h-auto flex-col gap-1 py-3 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/5"
          >
            {loading === "admin" ? (
              <Loader2 className="size-5 animate-spin text-amber-500" />
            ) : (
              <Shield className="size-5 text-amber-500" />
            )}
            <span className="text-xs font-medium">
              {loading === "admin" ? "Signing in..." : "Test Admin"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              admin@test.local
            </span>
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-3">
            {error}
          </p>
        )}
      </div>

      <div className="relative py-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
          atau login dengan email
        </span>
      </div>
    </>
  );
}
