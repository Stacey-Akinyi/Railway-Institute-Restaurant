import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Train } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — RTI Canteen" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places the recovery tokens in the URL hash and processes them
    // automatically — the auth client emits PASSWORD_RECOVERY when ready.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Fallback: if we already have a session from the recovery link
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You're signed in.");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Train className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="font-display text-lg">RTI Canteen</div>
        </div>
        <h2 className="font-display text-3xl mb-2">Set a new password</h2>
        <p className="text-muted-foreground mb-6">
          {ready
            ? "Choose a strong password you'll remember."
            : "Waiting for the recovery link… If you opened this page directly, please request a new reset link."}
        </p>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10" disabled={!ready} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw2">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className="pl-10" disabled={!ready} />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || !ready}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/auth" className="hover:text-accent">← Back to sign in</Link>
        </p>
      </Card>
    </div>
  );
}
