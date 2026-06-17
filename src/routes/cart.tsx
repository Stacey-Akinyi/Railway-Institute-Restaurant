import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — RTI Canteen" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, update, remove, clear, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  async function placeOrder() {
    if (!user) {
      toast.error("Please sign in to place an order.");
      navigate({ to: "/auth" });
      return;
    }
    if (items.length === 0) return;

    setPlacing(true);
    try {
      let tableId: string | null = null;
      if (orderType === "dine_in" && tableNumber) {
        const { data: t } = await supabase.from("dining_tables").select("id").eq("table_number", Number(tableNumber)).maybeSingle();
        tableId = t?.id ?? null;
      }

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_type: orderType,
          table_id: tableId,
          subtotal: total,
          total_amount: total,
          notes: notes || null,
          status: "pending",
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      const orderItems = items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.id,
        item_name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      }));
      const { error: e2 } = await supabase.from("order_items").insert(orderItems);
      if (e2) throw e2;

      clear();
      toast.success(`Order #${order.order_number} placed!`);
      navigate({ to: "/payment", search: { orderId: order.id } });
    } catch (e: any) {
      toast.error(e.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Your Cart" description={`${items.length} item(s) selected`} />

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <Button onClick={() => navigate({ to: "/menu" })}>Browse menu</Button>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">KES {item.price} each</div>
                </div>
                <div className="flex items-center gap-1 border rounded-md">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Decrease quantity" onClick={() => update(item.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Increase quantity" onClick={() => update(item.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-medium w-24 text-right">KES {item.price * item.quantity}</div>
                <Button variant="ghost" size="icon" aria-label="Remove item" onClick={() => remove(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>

          <Card className="p-6 h-fit sticky top-6">
            <h3 className="font-display text-xl mb-4">Order summary</h3>
            <div className="space-y-3 mb-6">
              <div className="space-y-2">
                <Label>Order type</Label>
                <Select value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine_in">Dine-in</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {orderType === "dine_in" && (
                <div className="space-y-2">
                  <Label>Table number (optional)</Label>
                  <Input type="number" min="1" max="8" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="e.g. 3" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Special instructions</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, preferences…" rows={2} />
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span>KES {total}</span>
              </div>
              <div className="flex justify-between font-display text-xl mt-2">
                <span>Total</span>
                <span className="text-accent">KES {total}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={placeOrder} disabled={placing}>
              {placing ? "Placing order…" : "Place order & pay"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
