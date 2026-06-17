import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ClipboardList, DollarSign, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — RTI Canteen" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { hasRole, loading } = useAuth();

  const { data } = useQuery({
    queryKey: ["reports"],
    enabled: hasRole("admin"),
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

      const [ordersToday, ordersWeek, paymentsWeek, lowStock, items] = await Promise.all([
        supabase.from("orders").select("total_amount").gte("created_at", today.toISOString()),
        supabase.from("orders").select("id, total_amount, status, created_at").gte("created_at", weekAgo.toISOString()),
        supabase.from("payments").select("method, amount, status").gte("created_at", weekAgo.toISOString()).eq("status", "paid"),
        (supabase as any).rpc("get_low_stock_items", { _threshold: 10 }),
        supabase.from("order_items").select("item_name, quantity, subtotal").gte("created_at", weekAgo.toISOString()),
      ]);

      const popular: Record<string, { qty: number; rev: number }> = {};
      (items.data || []).forEach((i: any) => {
        popular[i.item_name] = popular[i.item_name] || { qty: 0, rev: 0 };
        popular[i.item_name].qty += i.quantity;
        popular[i.item_name].rev += Number(i.subtotal);
      });
      const top = Object.entries(popular).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);

      const methodTotals: Record<string, number> = {};
      (paymentsWeek.data || []).forEach((p: any) => {
        methodTotals[p.method] = (methodTotals[p.method] || 0) + Number(p.amount);
      });

      return {
        salesToday: (ordersToday.data || []).reduce((s, o) => s + Number(o.total_amount), 0),
        salesWeek: (ordersWeek.data || []).reduce((s, o) => s + Number(o.total_amount), 0),
        ordersTodayCount: (ordersToday.data || []).length,
        ordersWeekCount: (ordersWeek.data || []).length,
        lowStock: lowStock.data || [],
        top,
        methodTotals,
      };
    },
  });

  if (loading) return <div className="p-8">Loading…</div>;
  if (!hasRole("admin")) return <div className="p-8 text-center text-muted-foreground">Admin only. <Link to="/" className="text-accent underline">Go home</Link></div>;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <PageHeader title="Reports" description="Sales summary and inventory health over the last 7 days." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5"><DollarSign className="h-5 w-5 text-accent mb-3" />
          <div className="text-sm text-muted-foreground">Sales today</div>
          <div className="font-display text-2xl mt-1">KES {(data?.salesToday ?? 0).toLocaleString()}</div></Card>
        <Card className="p-5"><TrendingUp className="h-5 w-5 text-accent mb-3" />
          <div className="text-sm text-muted-foreground">Sales (7 days)</div>
          <div className="font-display text-2xl mt-1">KES {(data?.salesWeek ?? 0).toLocaleString()}</div></Card>
        <Card className="p-5"><ClipboardList className="h-5 w-5 text-accent mb-3" />
          <div className="text-sm text-muted-foreground">Orders today</div>
          <div className="font-display text-2xl mt-1">{data?.ordersTodayCount ?? 0}</div></Card>
        <Card className="p-5"><Package className="h-5 w-5 text-accent mb-3" />
          <div className="text-sm text-muted-foreground">Orders (7 days)</div>
          <div className="font-display text-2xl mt-1">{data?.ordersWeekCount ?? 0}</div></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="font-display text-xl mb-4">Top selling items (7 days)</h3>
          {data?.top.length ? (
            <div className="space-y-2">
              {data.top.map(([name, v]) => (
                <div key={name} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{v.qty} sold</div>
                  </div>
                  <div className="text-accent font-medium">KES {v.rev.toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No sales yet.</p>}
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-xl mb-4">Payment methods (7 days)</h3>
          {Object.keys(data?.methodTotals || {}).length ? (
            <div className="space-y-2">
              {Object.entries(data!.methodTotals).map(([m, t]) => (
                <div key={m} className="flex justify-between items-center py-2 border-b last:border-0 capitalize">
                  <span>{m}</span>
                  <span className="text-accent font-medium">KES {t.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No payments yet.</p>}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-display text-xl mb-4">Low stock alerts</h3>
        {data?.lowStock.length ? (
          <div className="space-y-2">
            {data.lowStock.map((s: any) => (
              <div key={s.name} className="flex justify-between items-center py-2 border-b last:border-0">
                <span>{s.name}</span>
                <span className={s.stock_quantity === 0 ? "text-destructive font-medium" : "text-warning font-medium"}>
                  {s.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">All items well stocked.</p>}
      </Card>
    </div>
  );
}
