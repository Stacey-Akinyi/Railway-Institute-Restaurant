import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, Phone, RotateCcw } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — RTI Canteen" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("student");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed") || error.message.toLowerCase().includes("not confirmed")) {
        toast.error("Email not verified. Please check your inbox or resend the verification email.");
        return;
      }
      return toast.error(error.message);
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  }

  async function handleForgotPassword() {
    if (!email) return toast.error("Enter your email above first, then click 'Forgot password'.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Reset link sent! Check your email inbox.");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, phone, user_type: userType },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    // If email confirmation is required, Supabase returns a user with no session.
    if (!data.session) {
      toast.success("Account created! Check your email to verify your address before signing in.");
      // If accidentally signed in (auto-confirm), sign out to enforce verification.
      await supabase.auth.signOut();
      navigate({ to: "/verify-email", search: { email } });
      return;
    }
    toast.success("Account created. You're signed in.");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-brand text-primary-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        <div className="relative mb-12">
          <Logo size="lg" onDark showSubtext={false} />
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display text-5xl leading-tight mb-4">
            Streamlined dining for students, lecturers & staff.
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            Order meals, reserve tables, and skip the queue — all from a single, fast system.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-sm">
            <div><div className="font-display text-3xl text-accent">7am</div><div className="opacity-70">Breakfast opens</div></div>
            <div><div className="font-display text-3xl text-accent">15+</div><div className="opacity-70">Menu items daily</div></div>
            <div><div className="font-display text-3xl text-accent">8</div><div className="opacity-70">Dining tables</div></div>
          </div>
        </div>
        <div className="relative text-xs opacity-60">© {new Date().getFullYear()} RTI · All rights reserved</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="sm" />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <h2 className="font-display text-3xl mb-2">Welcome back</h2>
              <p className="text-muted-foreground mb-6">Sign in to place orders and manage reservations.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@rti.ac.ke" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex items-center gap-3">
                      <Link
                        to="/verify-email"
                        search={{ email }}
                        className="text-xs text-muted-foreground hover:text-accent hover:underline"
                      >
                        Resend verification
                      </Link>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-accent hover:underline"
                        disabled={loading}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10" />
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <h2 className="font-display text-3xl mb-2">Create your account</h2>
              <p className="text-muted-foreground mb-6">Join the RTI dining community in seconds.</p>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="pl-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email2">Email</Label>
                    <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="lecturer">Lecturer</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="guest">Walk-in / Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw2">Password</Label>
                  <Input id="pw2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By signing up you agree to our terms of service.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-8">
            <Link to="/" className="hover:text-accent">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
