import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, RotateCcw, CheckCircle } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — RTI Canteen" }] }),
  validateSearch: searchSchema,
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const search = useSearch({ from: "/verify-email" }) as { email?: string };
  const [email, setEmail] = useState(search.email ?? "");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return toast.error("Enter your email address first.");
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Verification email resent! Check your inbox.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        <div className="bg-card border rounded-2xl p-8 shadow-sm space-y-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl">Email sent!</h2>
              <p className="text-muted-foreground text-sm">
                A new verification link has been sent to <strong>{email}</strong>. Please check your inbox (and spam folder).
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Send again
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl">Verify your email</h2>
                <p className="text-muted-foreground text-sm">
                  We sent a verification link to your email address. Didn&apos;t receive it?
                </p>
              </div>

              <form onSubmit={handleResend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@rti.ac.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Resend verification email
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/auth" className="hover:text-accent">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
