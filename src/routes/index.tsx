import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, ClipboardList, ShoppingCart, CalendarCheck, UtensilsCrossed, Users, BarChart3, TrendingUp, Clock, Phone, Smile } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import restaurantHero from "@/assets/restaurant-hero.jpg";

const SITE_URL = "https://railway-restaurant-management-system.lovable.app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — RTI Canteen" },
      { name: "description", content: "Order meals, reserve tables, and manage canteen operations at Railway Training Institute." },
      { property: "og:title", content: "Dashboard — RTI Canteen" },
      { property: "og:description", content: "Order meals, reserve tables, and manage canteen operations at Railway Training Institute." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FoodEstablishment",
          name: "RTI Canteen",
          url: SITE_URL,
          telephone: "+254792973623",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+254792973623",
            contactType: "Reservations",
            availableLanguage: "English",
          },
          acceptsReservations: true,
          hasMenu: `${SITE_URL}/menu`,
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, profile, roles, hasAnyRole, loading } = useAuth();
  const navigate = useNavigate();

  const isStaff = hasAnyRole(["admin", "kitchen", "receptionist"]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id, isStaff],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (isStaff) {
        const [orders, pending, revenue, menu] = await Promise.all([
          supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
          supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "preparing"]),
          supabase.from("orders").select("total_amount").gte("created_at", today.toISOString()),
          supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("is_available", true),
        ]);
        const rev = (revenue.data || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
        return { ordersToday: orders.count || 0, pending: pending.count || 0, revenueToday: rev, menuCount: menu.count || 0 };
      } else {
        const [myOrders, myReservations] = await Promise.all([
          supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
          supabase.from("reservations").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "booked"),
        ]);
        return { myOrders: myOrders.count || 0, myReservations: myReservations.count || 0 };
      }
    },
  });

  if (loading) return <div className="p-8">Loading…</div>;

  if (!user) {
    return (
      <div className="min-h-screen">
        <section className="relative overflow-hidden bg-gradient-brand text-white">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 30% 30%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
          <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
              <div className="order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] sm:text-xs font-semibold mb-4 sm:mb-6 uppercase tracking-wider">
                  Railway Training Institute
                </div>
                <h1 className="font-display text-2xl sm:text-4xl lg:text-6xl leading-tight mb-4 sm:mb-6 text-white">
                  Welcome To Railway Training Restaurant
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-6 sm:mb-8 leading-relaxed">
                  We offer you the best meal that will leave you salivating and feeling energetic
                  for your next assignment and feeling refreshed. Our daily meals are prepared by
                  the best chefs to ensure that you get the value for your money.
                  So come, let us grant you the best experience! <Smile className="inline h-5 w-5 text-accent" />
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" variant="default" className="bg-accent text-white hover:bg-accent/90" onClick={() => navigate({ to: "/auth" })}>
                    Get started
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => navigate({ to: "/menu" })}>
                    Browse menu
                  </Button>
                </div>
              </div>
              <div className="image-wrapper relative order-2">
                <div className="absolute -inset-4 bg-accent/20 rounded-3xl blur-2xl" />
                <img
                  src={restaurantHero}
                  alt="RTI Restaurant"
                  width={1024}
                  height={1024}
                  className="relative rounded-2xl shadow-elegant w-full h-auto object-cover aspect-square lg:aspect-[4/5]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: UtensilsCrossed, title: "Browse the menu", desc: "View today's breakfast, lunch, dinner, snacks and drinks with live pricing." },
              { icon: ShoppingCart, title: "Order & pay", desc: "Add to cart, choose dine-in or takeaway, and pay by cash, M-Pesa or card." },
              { icon: CalendarCheck, title: "Reserve a table", desc: "Book a table ahead of time for groups, meetings, or special occasions." },
            ].map((f) => (
              <Card key={f.title} className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-display text-xl mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <Card className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 bg-gradient-brand text-white">
            <Phone className="h-6 w-6 text-accent shrink-0" />
            <div>
              <p className="text-white/80 text-sm">For more information call</p>
              <a href="tel:+254792973623" className="text-xl font-display text-white hover:underline">
                0792 973 623
              </a>
            </div>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <p className="text-muted-foreground">Welcome back,</p>
        <h1 className="font-display text-4xl">Dashboard — RTI Canteen</h1>
        <p className="text-muted-foreground mt-1">
          {isStaff ? `Signed in as ${roles.join(", ")}` : "Hungry today? Browse the menu or check your orders."}
        </p>
      </div>

      {isStaff ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={ClipboardList} label="Orders today" value={stats?.ordersToday ?? 0} />
          <StatCard icon={Clock} label="In progress" value={stats?.pending ?? 0} />
          <StatCard icon={TrendingUp} label="Revenue today" value={`KES ${(stats?.revenueToday ?? 0).toLocaleString()}`} />
          <StatCard icon={UtensilsCrossed} label="Menu items" value={stats?.menuCount ?? 0} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-10">
          <StatCard icon={ClipboardList} label="My orders" value={stats?.myOrders ?? 0} />
          <StatCard icon={CalendarCheck} label="Active reservations" value={stats?.myReservations ?? 0} />
        </div>
      )}

      <h2 className="font-display text-2xl mb-4">Quick actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction to="/menu" icon={UtensilsCrossed} title="Browse menu" desc="Today's meals and prices" />
        <QuickAction to="/cart" icon={ShoppingCart} title="View cart" desc="Checkout your selections" />
        <QuickAction to="/reservations" icon={CalendarCheck} title="Reserve a table" desc="Book ahead for dine-in" />
        {hasAnyRole(["kitchen", "admin"]) && <QuickAction to="/kitchen" icon={ChefHat} title="Kitchen queue" desc="Pending and active orders" />}
        {hasAnyRole(["receptionist", "admin"]) && <QuickAction to="/reception" icon={Users} title="Reception" desc="Walk-ins and payments" />}
        {hasAnyRole(["admin"]) && <QuickAction to="/admin/reports" icon={BarChart3} title="Reports" desc="Sales and inventory" />}
      </div>

      <Card className="p-5 mt-8 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
        <span className="text-muted-foreground">Need help or want to reserve by phone?</span>
        <a href="tel:+254792973623" className="font-medium text-accent hover:underline">Call 0792 973 623</a>
      </Card>
    </div>
  );
}


function StatCard({ icon: Icon, label, value }: { icon: typeof ChefHat; label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-accent mb-3" />
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: typeof ChefHat; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="p-5 hover:shadow-elegant transition-shadow cursor-pointer h-full">
        <Icon className="h-6 w-6 text-accent mb-3" />
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </Card>
    </Link>
  );
}
