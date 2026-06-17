import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { PageHeader } from "@/components/PageHeader";
import { SignedImage } from "@/components/SignedImage";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

const SITE_URL = "https://railway-restaurant-management-system.lovable.app";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — RTI Canteen" },
      { name: "description", content: "Browse today's menu at RTI Canteen. Breakfast, lunch, dinner, snacks and drinks with live pricing." },
      { property: "og:title", content: "Menu — RTI Canteen" },
      { property: "og:description", content: "Browse today's menu at RTI Canteen. Breakfast, lunch, dinner, snacks and drinks with live pricing." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/menu` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/menu` },
    ],
  }),
  component: MenuPage,
});

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meal_time: string | null;
  is_available: boolean;
  category_id: string | null;
  image_url: string | null;
}
interface Category { id: string; name: string; display_order: number }

function MenuPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const { add } = useCart();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("display_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id,name,description,price,meal_time,is_available,category_id,image_url")
        .eq("is_available", true)
        .order("name");
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const filtered = (items || []).filter((i) => {
    if (cat !== "all" && i.category_id !== cat) return false;
    if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, it) => {
    const key = categories?.find((c) => c.id === it.category_id)?.name || "Other";
    (acc[key] ||= []).push(it);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader title="Today's Menu" description="Tap any item to add it to your cart." />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search meals…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={cat === "all" ? "default" : "outline"} size="sm" onClick={() => setCat("all")}>All</Button>
          {categories?.map((c) => (
            <Button key={c.id} size="sm" variant={cat === c.id ? "default" : "outline"} onClick={() => setCat(c.id)}>{c.name}</Button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-muted-foreground">Loading menu…</div>}

      {Object.entries(grouped).map(([catName, list]) => (
        <section key={catName} className="mb-10">
          <h2 className="font-display text-2xl mb-4">{catName}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-elegant transition-shadow flex flex-col">
                <div className="h-40 w-full bg-muted flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <SignedImage path={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="font-medium text-lg">{item.name}</h3>
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-display text-2xl text-accent">KES {Number(item.price)}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        add({ id: item.id, name: item.name, price: Number(item.price) });
                        toast.success(`${item.name} added to cart`);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {!isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">No items match your search.</Card>
      )}

      {items && items.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Menu",
            name: "RTI Canteen Menu",
            url: "https://railway-restaurant-management-system.lovable.app/menu",
            hasMenuSection: Object.entries(grouped).map(([sectionName, sectionItems]) => ({
              "@type": "MenuSection",
              name: sectionName,
              hasMenuItem: sectionItems.map((item) => ({
                "@type": "MenuItem",
                name: item.name,
                description: item.description || undefined,
                offers: {
                  "@type": "Offer",
                  price: String(item.price),
                  priceCurrency: "KES",
                  availability: item.is_available
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              })),
            })),
          })}
        </script>
      )}
    </div>
  );
}
