import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, Phone } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

const SITE_URL = "https://railway-restaurant-management-system.lovable.app";

export const Route = createFileRoute("/reservations")({
  head: () => ({
    meta: [
      { title: "Reservations — RTI Canteen" },
      { name: "description", content: "Reserve a table at RTI Canteen. Book ahead for dine-in, groups, meetings, or special occasions." },
      { property: "og:title", content: "Reservations — RTI Canteen" },
      { property: "og:description", content: "Reserve a table at RTI Canteen. Book ahead for dine-in, groups, meetings, or special occasions." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/reservations` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/reservations` },
    ],
  }),
  component: ReservationsPage,
});

function ReservationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tableId, setTableId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: tables } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const { data } = await supabase.from("dining_tables").select("*").eq("is_active", true).order("table_number");
      return data || [];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ["my-reservations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("*, dining_tables(table_number, capacity)")
        .eq("user_id", user!.id)
        .order("reservation_date", { ascending: false });
      return data || [];
    },
  });

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to reserve.");
    setSaving(true);
    const { error } = await supabase.from("reservations").insert({
      user_id: user.id,
      table_id: tableId,
      reservation_date: date,
      reservation_time: time,
      party_size: Number(partySize),
      notes: notes || null,
      status: "booked",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Table reserved!");
    setNotes(""); setTableId(""); setDate(""); setTime("");
    qc.invalidateQueries({ queryKey: ["my-reservations"] });
  }

  async function cancel(id: string) {
    const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reservation cancelled");
    qc.invalidateQueries({ queryKey: ["my-reservations"] });
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <PageHeader title="Reservations" description="Book a table ahead of your visit." />

      <Card className="p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 bg-accent/5 border-accent/30">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium">Prefer to reserve by phone?</div>
            <div className="text-sm text-muted-foreground">Call us for reservations or any inquiries — we'll book it for you.</div>
          </div>
        </div>
        <Button asChild variant="outline" className="border-accent/40">
          <a href="tel:+254792973623"><Phone className="h-4 w-4 mr-2" />0792 973 623</a>
        </Button>
      </Card>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">

        <Card className="p-6 h-fit">
          <h3 className="font-display text-xl mb-4">New reservation</h3>
          {!user ? (
            <p className="text-sm text-muted-foreground">Sign in to make a reservation.</p>
          ) : (
            <form onSubmit={book} className="space-y-4">
              <div>
                <Label>Table</Label>
                <Select value={tableId} onValueChange={setTableId} required>
                  <SelectTrigger><SelectValue placeholder="Choose a table" /></SelectTrigger>
                  <SelectContent>
                    {tables?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>Table {t.table_number} · seats {t.capacity} · {t.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label>Party size</Label>
                <Input type="number" min="1" max="20" value={partySize} onChange={(e) => setPartySize(e.target.value)} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Reserving…" : "Reserve table"}
              </Button>
            </form>
          )}
        </Card>

        <div>
          <h3 className="font-display text-xl mb-4">My reservations</h3>
          {mine && mine.length > 0 ? (
            <div className="space-y-3">
              {mine.map((r: any) => (
                <Card key={r.id} className="p-4 flex items-center gap-4">
                  <CalendarCheck className="h-8 w-8 text-accent" />
                  <div className="flex-1">
                    <div className="font-medium">Table {r.dining_tables?.table_number} · party of {r.party_size}</div>
                    <div className="text-sm text-muted-foreground">{r.reservation_date} at {r.reservation_time}</div>
                  </div>
                  <Badge variant={r.status === "cancelled" ? "outline" : "default"}>{r.status}</Badge>
                  {r.status === "booked" && (
                    <Button size="sm" variant="outline" onClick={() => cancel(r.id)}>Cancel</Button>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">No reservations yet.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
