import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, UserPlus, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/reception")({
  head: () => ({ meta: [{ title: "Reception — RTI Canteen" }] }),
  component: ReceptionPage,
});

function ReceptionPage() {
  const { user, hasAnyRole, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [placing, setPlacing] = useState(false);
  const [approving, setApproving] = useState<any | null>(null);
  const [tendered, setTendered] = useState("");
  const [approvingBusy, setApprovingBusy] = useState(false);

  const { data: tables } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => (await supabase.from("dining_tables").select("*").eq("is_active", true).order("table_number")).data || [],
  });
  const { data: items } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => (await supabase.from("menu_items").select("id,name,price,is_available,category_id,meal_time").eq("is_available", true).order("name")).data || [],
  });
  const { data: todayOrders } = useQuery({
    queryKey: ["reception-orders"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return (await supabase.from("orders").select("*, payments(*)").gte("created_at", today.toISOString()).order("created_at", { ascending: false })).data || [];
    },
    refetchInterval: 8000,
  });
  const { data: todayReservations } = useQuery({
    queryKey: ["reception-reservations"],
    queryFn: async () => {
      const t = new Date().toISOString().split("T")[0];
      return (await supabase.from("reservations").select("*, dining_tables(table_number), profiles(full_name)").eq("reservation_date", t).order("reservation_time")).data || [];
    },
  });
  const { data: pendingCash } = useQuery({
    queryKey: ["pending-cash-payments"],
    queryFn: async () =>
      (
        await supabase
          .from("payments")
          .select("*, orders(id, order_number, customer_name, total_amount, user_id, order_items(*))")
          .eq("method", "cash")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      ).data || [],
    refetchInterval: 5000,
  });

  if (loading) return <div className="p-8">Loading…</div>;
  if (!hasAnyRole(["receptionist", "admin"])) {
    return <div className="p-8 text-center text-muted-foreground">No access. <Link to="/" className="text-accent underline">Go home</Link></div>;
  }

  function addToCart(item: any) {
    setCart((c) => {
      const idx = c.findIndex((x) => x.id === item.id);
      if (idx >= 0) { const copy = [...c]; copy[idx].quantity++; return copy; }
      return [...c, { id: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  }
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  async function placeWalkIn() {
    if (cart.length === 0) return toast.error("Add items first");
    if (!customerName) return toast.error("Enter customer name");
    setPlacing(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        table_id: tableId || null,
        order_type: "walk_in",
        status: "pending",
        subtotal: total,
        total_amount: total,
        created_by: user!.id,
      })
      .select()
      .single();
    if (error || !order) { setPlacing(false); return toast.error(error?.message || "Failed"); }

    const oi = cart.map((i) => ({
      order_id: order.id, menu_item_id: i.id, item_name: i.name,
      unit_price: i.price, quantity: i.quantity, subtotal: i.price * i.quantity,
    }));
    const { error: e2 } = await supabase.from("order_items").insert(oi);
    setPlacing(false);
    if (e2) return toast.error(e2.message);
    toast.success(`Walk-in order #${order.order_number} created`);
    setCart([]); setCustomerName(""); setTableId("");
    qc.invalidateQueries({ queryKey: ["reception-orders"] });
    navigate({ to: "/payment", search: { orderId: order.id } });
  }

  async function seatReservation(id: string) {
    await supabase.from("reservations").update({ status: "seated" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["reception-reservations"] });
    toast.success("Guest seated");
  }

  function openApprove(p: any) {
    setApproving(p);
    setTendered(String(Number(p.amount)));
  }

  async function confirmApprove() {
    if (!approving) return;
    const total = Number(approving.amount);
    const tend = Number(tendered);
    if (tend < total) return toast.error("Tendered amount is less than total");
    setApprovingBusy(true);
    try {
      const { error } = await (supabase as any).rpc("approve_cash_payment", {
        _payment_id: approving.id,
        _tendered: tend,
      });
      if (error) throw error;
      toast.success(`Approved payment for order #${approving.orders?.order_number}`);
      setApproving(null);
      qc.invalidateQueries({ queryKey: ["pending-cash-payments"] });
      qc.invalidateQueries({ queryKey: ["reception-orders"] });
    } catch (e: any) {
      toast.error(e.message || "Approval failed");
    } finally {
      setApprovingBusy(false);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader title="Reception" description="Take walk-in orders, approve cash payments, manage tables and reservations." />

      <Tabs defaultValue="cash">
        <div className="-mx-6 sm:mx-0 overflow-x-auto px-6 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="cash">
              Cash approvals
              {pendingCash && pendingCash.length > 0 && (
                <Badge className="ml-2 bg-warning text-warning-foreground">{pendingCash.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="walkin">New walk-in</TabsTrigger>
            <TabsTrigger value="orders">Today's orders</TabsTrigger>
            <TabsTrigger value="reservations">Today's reservations</TabsTrigger>
          </TabsList>
        </div>


        <TabsContent value="cash" className="mt-6 space-y-3">
          {(pendingCash || []).map((p: any) => (
            <Card key={p.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-accent" />
                  Order #{p.orders?.order_number} — {p.orders?.customer_name || "Customer"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Requested {new Date(p.created_at).toLocaleTimeString()}
                </div>
              </div>
              <div className="font-display text-lg text-accent">KES {Number(p.amount)}</div>
              <Button size="sm" onClick={() => openApprove(p)}>
                <Banknote className="h-3 w-3 mr-1" /> Approve cash
              </Button>
            </Card>
          ))}
          {pendingCash?.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">No pending cash payments</Card>
          )}
        </TabsContent>

        <TabsContent value="walkin" className="mt-6">
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            <Card className="p-5">
              <h3 className="font-display text-xl mb-4">Menu</h3>
              <div className="grid sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto">
                {items?.map((it: any) => (
                  <button key={it.id} onClick={() => addToCart(it)} className="flex justify-between items-center p-3 border rounded-md hover:border-accent hover:bg-accent/5 text-left">
                    <span>
                      <span className="block font-medium text-sm">{it.name}</span>
                      <span className="text-xs text-muted-foreground">KES {Number(it.price)}</span>
                    </span>
                    <Plus className="h-4 w-4 text-accent" />
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5 h-fit">
              <h3 className="font-display text-xl mb-4">Walk-in order</h3>
              <div className="space-y-3 mb-4">
                <div>
                  <Label>Customer name</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Guest name" />
                </div>
                <div>
                  <Label>Table (optional)</Label>
                  <Select value={tableId} onValueChange={setTableId}>
                    <SelectTrigger><SelectValue placeholder="Walk-in / takeaway" /></SelectTrigger>
                    <SelectContent>
                      {tables?.map((t: any) => <SelectItem key={t.id} value={t.id}>Table {t.table_number}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1 mb-4 max-h-60 overflow-y-auto">
                {cart.length === 0 && <p className="text-sm text-muted-foreground">No items added</p>}
                {cart.map((i) => (
                  <div key={i.id} className="flex justify-between items-center text-sm py-1.5">
                    <span>{i.quantity} × {i.name}</span>
                    <span className="flex items-center gap-2">
                      KES {i.price * i.quantity}
                      <button aria-label="Remove item" onClick={() => setCart((c) => c.filter((x) => x.id !== i.id))}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-display text-lg border-t pt-3 mb-4">
                <span>Total</span><span className="text-accent">KES {total}</span>
              </div>
              <Button className="w-full" onClick={placeWalkIn} disabled={placing}>
                <UserPlus className="h-4 w-4 mr-2" /> Create order
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-3">
          {(todayOrders || []).map((o: any) => (
            <Card key={o.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-medium">#{o.order_number} — {o.customer_name || "Customer"}</div>
                <div className="text-xs text-muted-foreground capitalize">{o.order_type.replace("_", " ")} · {new Date(o.created_at).toLocaleTimeString()}</div>
              </div>
              <Badge variant="outline" className="capitalize">{o.status}</Badge>
              <div className="font-display text-lg text-accent">KES {Number(o.total_amount)}</div>
              {!o.payments?.length ? (
                <Link to="/payment" search={{ orderId: o.id }}><Button size="sm">Take payment</Button></Link>
              ) : <Badge>Paid</Badge>}
            </Card>
          ))}
          {todayOrders?.length === 0 && <Card className="p-8 text-center text-muted-foreground">No orders today</Card>}
        </TabsContent>

        <TabsContent value="reservations" className="mt-6 space-y-3">
          {(todayReservations || []).map((r: any) => (
            <Card key={r.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-medium">{r.profiles?.full_name || "Guest"} — Table {r.dining_tables?.table_number}</div>
                <div className="text-xs text-muted-foreground">{r.reservation_time} · party of {r.party_size}</div>
              </div>
              <Badge variant="outline" className="capitalize">{r.status}</Badge>
              {r.status === "booked" && <Button size="sm" onClick={() => seatReservation(r.id)}>Seat guest</Button>}
            </Card>
          ))}
          {todayReservations?.length === 0 && <Card className="p-8 text-center text-muted-foreground">No reservations today</Card>}
        </TabsContent>
      </Tabs>

      <Dialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve cash payment</DialogTitle>
          </DialogHeader>
          {approving && (
            <div className="space-y-4">
              <div className="text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span>#{approving.orders?.order_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{approving.orders?.customer_name || "—"}</span></div>
                <div className="flex justify-between font-medium"><span>Total</span><span className="text-accent">KES {Number(approving.amount)}</span></div>
              </div>
              <div>
                <Label>Amount tendered (KES)</Label>
                <Input type="number" value={tendered} onChange={(e) => setTendered(e.target.value)} min={Number(approving.amount)} />
              </div>
              <div className="flex justify-between text-sm">
                <span>Change due</span>
                <span className="font-medium text-accent">KES {Math.max(0, Number(tendered) - Number(approving.amount))}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>Cancel</Button>
            <Button onClick={confirmApprove} disabled={approvingBusy || Number(tendered) < Number(approving?.amount || 0)}>
              {approvingBusy ? "Approving…" : "Approve & confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
