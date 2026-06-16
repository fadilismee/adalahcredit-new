import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { ChevronRight, Loader2, Moon, Palette, Sun, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "../../convex/_generated/api";

export function SettingsPage() {
  const user = useQuery(api.auth.currentUser);
  const { theme, toggleTheme, switchable } = useTheme();
  const { signIn, signOut } = useAuthActions();
  const deleteAccount = useMutation(api.users.deleteAccount);
  const navigate = useNavigate();

  // FIX M9: Separate error/loading state per dialog
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [passwordStep, setPasswordStep] = useState<"request" | "verify">("request");

  const [delLoading, setDelLoading] = useState(false);
  const [delError, setDelError] = useState("");

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwLoading(true);

    const formData = new FormData();
    formData.append("email", user?.email || "");
    formData.append("flow", "reset");

    try {
      await signIn("password", formData);
      setPasswordStep("verify");
    } catch {
      setPwError("Gagal mengirim kode reset. Coba lagi.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError("");
    setPwLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("email", user?.email || "");
    formData.append("flow", "reset-verification");

    try {
      await signIn("password", formData);
      setPwSuccess("Password berhasil diubah!");
      setTimeout(() => {
        setChangePasswordOpen(false);
        // FIX M10: Reset passwordStep when closing dialog
        setPasswordStep("request");
        setPwSuccess("");
        setPwError("");
      }, 1500);
    } catch {
      setPwError("Kode salah atau password tidak valid. Coba lagi.");
    } finally {
      setPwLoading(false);
    }
  };

  // FIX M13: Delete account properly wired with confirmation
  const handleDeleteAccount = async () => {
    setDelLoading(true);
    setDelError("");

    try {
      await deleteAccount();
      await signOut();
      navigate("/");
    } catch {
      setDelError("Gagal menghapus akun. Coba lagi.");
      setDelLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Pengaturan
        </h1>
        {/* FIX M14: Consistent Indonesian language */}
        <p className="text-muted-foreground mt-1">Kelola preferensi akun dan pengaturan keamanan Anda.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="-mt-10 pb-6">
          <div className="flex items-end gap-4">
            <Avatar className="size-16 border-4 border-background shadow-lg">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {(user?.name || "U").charAt(0).toUpperCase() || (
                  <User className="size-6" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <p className="font-semibold">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-muted-foreground" />
            Tampilan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {switchable ? (
            <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
                  {theme === "light" ? (
                    <Moon className="size-5 text-foreground" />
                  ) : (
                    <Sun className="size-5 text-foreground" />
                  )}
                </div>
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">
                    Dark mode
                  </Label>
                  {/* FIX M11: Replace placeholder text with actual description */}
                  <p className="text-sm text-muted-foreground">
                    Ubah antara tema gelap dan terang
                  </p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground px-4 py-2">
              Tema mengikuti pengaturan sistem
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-muted-foreground" />
            Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <button
            onClick={() => { setChangePasswordOpen(true); setPwError(""); setPwSuccess(""); }}
            className="w-full flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 text-left"
          >
            <div>
              <p className="font-medium text-sm">Ubah Password</p>
              <p className="text-sm text-muted-foreground">
                Perbarui password akun Anda
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => { setDeleteAccountOpen(true); setDelError(""); }}
            className="w-full flex items-center justify-between rounded-lg border border-destructive/20 p-4 transition-colors hover:bg-destructive/5 text-left"
          >
            <div>
              <p className="font-medium text-sm text-destructive">
                Hapus Akun
              </p>
              <p className="text-sm text-muted-foreground">
                Hapus akun secara permanen
              </p>
            </div>
            <ChevronRight className="size-4 text-destructive" />
          </button>
        </CardContent>
      </Card>

      {/* Change password dialog — FIX M10: reset step on close */}
      <Dialog open={changePasswordOpen} onOpenChange={(open) => {
        setChangePasswordOpen(open);
        if (!open) { setPasswordStep("request"); setPwError(""); setPwSuccess(""); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>
              {passwordStep === "request"
                ? "Kami akan mengirim kode verifikasi ke email Anda."
                : "Masukkan kode dari email dan password baru Anda."}
            </DialogDescription>
          </DialogHeader>

          {passwordStep === "request" ? (
            <form onSubmit={handleRequestPasswordReset}>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Kode reset akan dikirim ke:{" "}
                  <span className="font-medium text-foreground">
                    {user?.email}
                  </span>
                </p>
              </div>
              {pwError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">
                  {pwError}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setChangePasswordOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={pwLoading}>
                  {pwLoading && <Loader2 className="size-4 animate-spin" />}
                  Kirim Kode
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Verifikasi</Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="Masukkan kode dari email"
                  autoComplete="one-time-code"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>
              {pwError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {pwError}
                </p>
              )}
              {/* FIX M12: Replace text-success with actual Tailwind class */}
              {pwSuccess && (
                <p className="text-sm text-emerald-500 bg-emerald-500/10 rounded-lg px-3 py-2">
                  {pwSuccess}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordStep("request");
                    setPwError("");
                  }}
                >
                  Kembali
                </Button>
                <Button type="submit" disabled={pwLoading}>
                  {pwLoading && <Loader2 className="size-4 animate-spin" />}
                  Ubah Password
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete account dialog — FIX M13: proper confirmation */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Akun</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus permanen termasuk API keys, usage logs, dan saldo credit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Yakin ingin menghapus akun Anda?
            </p>
          </div>
          {delError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {delError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAccountOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={delLoading}
            >
              {delLoading && <Loader2 className="size-4 animate-spin" />}
              Hapus Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
