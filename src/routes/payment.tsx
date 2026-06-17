import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Banknote, Smartphone, CreditCard, Printer, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/payment")({
  validateSearch: z.object({ orderId: z.string().optional() }),
  head: () => ({ meta: [{ title: "Payment — RTI Canteen" }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const { orderId } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<"cash" | "mpesa" | "card">("cash");
  const [submitting, setSubmitting] = useState(false);

  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*)")
        .eq("id", orderId!)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 4000,
  });

  if (!orderId) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No order specified.</p>
        <Button onClick={() => navigate({ to: "/orders" })}>View my orders</Button>
      </div>
    );
  }
  if (!order) return <div className="p-8">Loading…</div>;

  const total = Number(order.total_amount);
  const payments = (order.payments || []) as any[];
  const paidPayment = payments.find((p) => p.status === "paid");
  const pendingPayment = payments.find((p) => p.status === "pending");

  // === PAID receipt view ===
  if (paidPayment) {
    return (
      <div className="p-6 lg:p-10 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-display text-3xl mb-2">Payment confirmed</h2>
          <p className="text-muted-foreground mb-6">Receipt #{paidPayment.receipt_number}</p>

          <div className="text-left border rounded-lg p-6 bg-muted/30 mb-6">
            <div className="text-center mb-4">
              <div className="font-display text-lg">Railway Training Institute</div>
              <div className="text-xs text-muted-foreground">Canteen & Restaurant</div>
            </div>
            <div className="text-sm space-y-1 border-t border-b py-3 my-3">
              <div className="flex justify-between"><span>Order #</span><span>{order.order_number}</span></div>
              <div className="flex justify-between"><span>Date</span><span>{new Date(paidPayment.created_at).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Method</span><span className="capitalize">{paidPayment.method}</span></div>
            </div>
            <div className="space-y-1 text-sm mb-3">
              {(order.order_items as any[]).map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.quantity} × {i.item_name}</span>
                  <span>KES {Number(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-display text-lg border-t pt-3">
              <span>Total</span><span>KES {total}</span>
            </div>
            {paidPayment.method === "cash" && paidPayment.amount_tendered && (
              <>
                <div className="flex justify-between text-sm mt-2"><span>Tendered</span><span>KES {Number(paidPayment.amount_tendered)}</span></div>
                <div className="flex justify-between text-sm font-medium text-accent"><span>Change due</span><span>KES {Number(paidPayment.change_due || 0)}</span></div>
              </>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
            <Button onClick={() => navigate({ to: "/orders" })}>View my orders</Button>
          </div>
        </Card>
      </div>
    );
  }

  // === Pending cash payment — waiting on reception ===
  if (pendingPayment && pendingPayment.method === "cash") {
    return (
      <div className="p-6 lg:p-10 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <h2 className="font-display text-3xl mb-2">Proceed to Reception</h2>
          <p className="text-muted-foreground mb-6">
            Please present <strong>Order #{order.order_number}</strong> at the reception desk and pay <strong>KES {total}</strong> in cash.
            The receptionist will approve your payment and your receipt will appear here.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Waiting for receptionist approval…
          </div>
          <div className="mt-6">
            <Button variant="outline" onClick={() => navigate({ to: "/orders" })}>View my orders</Button>
          </div>
        </Card>
      </div>
    );
  }

  // === Method selection ===
  async function placeCash() {
    setSubmitting(true);
    const { error } = await supabase.from("payments").insert({
      order_id: orderId!,
      amount: total,
      method: "cash",
      status: "pending",
      processed_by: user?.id || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Order placed. Proceed to reception to pay.");
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader title="Complete payment" description={`Order #${order.order_number} · KES ${total}`} />

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {([
          { v: "cash", label: "Cash", icon: Banknote, available: true },
          { v: "mpesa", label: "M-Pesa", icon: Smartphone, available: false },
          { v: "card", label: "Card", icon: CreditCard, available: false },
        ] as const).map((m) => (
          <button
            key={m.v}
            onClick={() => m.available && setMethod(m.v)}
            disabled={!m.available}
            className={`p-4 border rounded-lg text-left transition-all relative ${
              method === m.v && m.available
                ? "border-accent bg-accent/5 shadow-elegant"
                : m.available
                ? "hover:border-accent/50"
                : "opacity-60 cursor-not-allowed"
            }`}
          >
            <m.icon className={`h-6 w-6 mb-2 ${method === m.v && m.available ? "text-accent" : "text-muted-foreground"}`} />
            <div className="font-medium">{m.label}</div>
            {!m.available && (
              <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Coming soon
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="p-6 mb-6">
        {method === "cash" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-accent/5 border border-accent/20">
              <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Pay cash at Reception</div>
                <div className="text-muted-foreground">
                  Clicking the button below will place your order. Please proceed to the reception desk with your order number
                  to pay <strong>KES {total}</strong> in cash. The receptionist will enter an approval code and your receipt
                  will be available on this page.
                </div>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={placeCash} disabled={submitting}>
              {submitting ? "Placing…" : "Place order — pay cash at Reception"}
            </Button>
          </div>
        )}

        {method !== "cash" && (
          <div className="text-center py-8">
            <p className="font-display text-xl mb-2">Coming soon</p>
            <p className="text-sm text-muted-foreground">
              {method === "mpesa" ? "M-Pesa" : "Card"} payments will be available in a future release.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
