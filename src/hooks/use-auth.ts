import { useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "kitchen" | "receptionist" | "customer";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  user_type: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedFor = useRef<string | null>(null);

  useEffect(() => {
    async function fetchExtras(uid: string) {
      if (fetchedFor.current === uid) return;
      fetchedFor.current = uid;
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      if (p.data) setProfile(p.data as Profile);
      if (r.data) setRoles(r.data.map((x: { role: AppRole }) => x.role));
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // Only react to real identity transitions. Ignore TOKEN_REFRESHED / INITIAL_SESSION noise.
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;

      setSession(s);
      setUser(s?.user ?? null);

      if (event === "SIGNED_OUT" || !s?.user) {
        fetchedFor.current = null;
        setProfile(null);
        setRoles([]);
      } else {
        setTimeout(() => fetchExtras(s.user.id), 0);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchExtras(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = (rs: AppRole[]) => rs.some((r) => roles.includes(r));

  return { session, user, profile, roles, loading, hasRole, hasAnyRole };
}
