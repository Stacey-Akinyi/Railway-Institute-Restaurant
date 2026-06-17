import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChefHat, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/kitchen")({
  head: () => ({ meta: [{ title: "Kitchen Queue — RTI Canteen" }] }),
  component: KitchenPage,
});

function KitchenPage() {
  const { hasAnyRole, loading } = useAuth();
  const qc = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .in("status", ["pending", "preparing", "ready"])
        .order("created_at", { ascending: true });
      return data || [];
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("orders-kitchen")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!hasAnyRole(["kitchen", "admin"])) {
    return <div className="p-8 text-center text-muted-foreground">You don't have access to the kitchen queue. <Link to="/" className="text-accent underline">Go home</Link></div>;
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order marked ${status}`);
    qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
  }

  const cols = [
    { key: "pending", label: "New", icon: Clock, next: "preparing", nextLabel: "Start preparing" },
    { key: "preparing", label: "Preparing", icon: ChefHat, next: "ready", nextLabel: "Mark ready" },
    { key: "ready", label: "Ready to serve", icon: CheckCircle, next: "served", nextLabel: "Mark served" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader title="Kitchen Queue" description="Live order pipeline — updates every 5 seconds." />

      <div className="grid lg:grid-cols-3 gap-4">
        {cols.map((col) => {
          const list = (orders || []).filter((o: any) => o.status === col.key);
          const Icon = col.icon;
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-accent" />
                <h3 className="font-medium">{col.label}</h3>
                <Badge variant="outline">{list.length}</Badge>
              </div>
              <div className="space-y-3">
                {list.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">No orders</Card>}
                {list.map((o: any) => (
                  <Card key={o.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">#{o.order_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {o.customer_name || "Customer"} · {new Date(o.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">{o.order_type.replace("_", " ")}</Badge>
                    </div>
                    <ul className="text-sm space-y-1 mb-3 pl-3 border-l-2 border-accent/30">
                      {o.order_items.map((i: any) => (
                        <li key={i.id}>{i.quantity} × {i.item_name}</li>
                      ))}
                    </ul>
                    {o.notes && <p className="text-xs italic text-muted-foreground mb-3">Note: {o.notes}</p>}
                    <Button size="sm" className="w-full" onClick={() => setStatus(o.id, col.next)}>
                      {col.nextLabel}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
