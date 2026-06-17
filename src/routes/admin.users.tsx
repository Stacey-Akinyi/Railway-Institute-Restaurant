import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users & Roles — RTI Canteen" }] }),
  component: AdminUsers,
});

const ALL_ROLES = ["admin", "kitchen", "receptionist", "customer"] as const;

function AdminUsers() {
  const { hasRole, loading } = useAuth();
  const qc = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles || []).map((p: any) => ({
        ...p,
        roles: (roles || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      }));
    },
  });

  if (loading) return <div className="p-8">Loading…</div>;
  if (!hasRole("admin")) {
    return <div className="p-8 text-center text-muted-foreground">Admin only. <Link to="/" className="text-accent underline">Go home</Link></div>;
  }

  async function toggle(userId: string, role: typeof ALL_ROLES[number], has: boolean) {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Roles updated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <PageHeader title="Users & Roles" description="Grant staff roles to existing user accounts." />

      <div className="space-y-3">
        {users?.map((u: any) => (
          <Card key={u.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="font-medium">{u.full_name}</div>
                <div className="text-xs text-muted-foreground">{u.email} · {u.user_type}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {u.roles.map((r: string) => <Badge key={r} variant="default" className="capitalize">{r}</Badge>)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((r) => {
                const has = u.roles.includes(r);
                return (
                  <Button key={r} size="sm" variant={has ? "default" : "outline"} onClick={() => toggle(u.id, r, has)} className="capitalize">
                    {has ? "✓ " : "+ "}{r}
                  </Button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
