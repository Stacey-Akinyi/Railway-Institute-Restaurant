import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — RTI Canteen" }] }),
  component: OrdersPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  preparing: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  ready: "bg-success/20 text-success border-success/30",
  served: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

function OrdersPage() {
  const { user, loading } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Sign in to see your orders.</p>
        <Link to="/auth"><Button>Sign in</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="My Orders" description="Track your meal orders and payment history." />

      {isLoading ? (
        <div className="text-muted-foreground">Loading orders…</div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <Card key={o.id} className="p-5">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-3">
                <div>
                  <div className="font-medium">Order #{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <Badge className={statusColor[o.status]}>{o.status}</Badge>
              </div>
              <div className="space-y-1 text-sm mb-3">
                {o.order_items.map((i: any) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.quantity} × {i.item_name}</span>
                    <span className="text-muted-foreground">KES {Number(i.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-muted-foreground capitalize">{o.order_type.replace("_", " ")}</span>
                <div className="text-right">
                  <div className="font-display text-lg text-accent">KES {Number(o.total_amount)}</div>
                  {!o.payments?.length && (
                    <Link to="/payment" search={{ orderId: o.id }}>
                      <Button size="sm" variant="outline" className="mt-2">Pay now</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No orders yet.</p>
          <Link to="/menu"><Button>Browse menu</Button></Link>
        </Card>
      )}
    </div>
  );
}
