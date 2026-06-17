import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  ClipboardList,
  CalendarCheck,
  ChefHat,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Menu as MenuIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: AppRole[]; // undefined = any authenticated
  badge?: number;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, roles, loading, hasAnyRole } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("rti_logo_path") : null
  );

  useEffect(() => {
    function refresh() { setLogoPath(localStorage.getItem("rti_logo_path")); }
    window.addEventListener("rti-logo-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("rti-logo-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const items: NavItem[] = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/menu", label: "Menu", icon: UtensilsCrossed },
    { to: "/cart", label: "Cart", icon: ShoppingCart, badge: count },
    { to: "/orders", label: "My Orders", icon: ClipboardList, roles: ["customer"] },
    { to: "/reservations", label: "Reservations", icon: CalendarCheck },
    { to: "/kitchen", label: "Kitchen Queue", icon: ChefHat, roles: ["kitchen", "admin"] },
    { to: "/reception", label: "Reception", icon: Users, roles: ["receptionist", "admin"] },
    { to: "/admin/menu", label: "Manage Menu", icon: Settings, roles: ["admin"] },
    { to: "/admin/users", label: "Users & Roles", icon: Users, roles: ["admin"] },
    { to: "/admin/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
  ];

  const visible = items.filter((i) => !i.roles || (user && (hasAnyRole(i.roles))));

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0 lg:relative",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" onClick={() => setOpen(false)}>
            <Logo size="md" onDark showSubtext={false} textClassName="text-sidebar-foreground" />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visible.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors hover-green",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "text-sidebar-foreground/85"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {user ? (
          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3">
              <div className="text-sm font-medium truncate">{profile?.full_name || user.email}</div>
              <div className="text-xs text-sidebar-foreground/60 truncate">
                {roles.length ? roles.join(", ") : "customer"}
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        ) : (
          <div className="p-4 border-t border-sidebar-border">
            <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
              Sign in
            </Button>
          </div>
        )}
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 bg-gradient-header text-brand-orange shadow-elegant">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="text-brand-orange hover:bg-white/10">
            <MenuIcon className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex justify-center px-2">
            <Logo size="sm" onDark showSubtext={false} textClassName="text-brand-orange truncate" />
          </div>
          <div className="w-10" />
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
