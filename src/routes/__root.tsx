import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/AppShell";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RTI Canteen & Restaurant Management System" },
      { name: "description", content: "Order, reserve, and manage Railway Training Institute canteen operations." },
      { property: "og:title", content: "RTI Canteen & Restaurant Management System" },
      { name: "twitter:title", content: "RTI Canteen & Restaurant Management System" },
      { property: "og:description", content: "Order, reserve, and manage Railway Training Institute canteen operations." },
      { name: "twitter:description", content: "Order, reserve, and manage Railway Training Institute canteen operations." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/vyPSfwpXYyUuJogtAJaddlK9hkI3/social-images/social-1781051754997-Restaurant-logo.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/vyPSfwpXYyUuJogtAJaddlK9hkI3/social-images/social-1781051754997-Restaurant-logo.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname === "/auth";
  return (
    <QueryClientProvider client={queryClient}>
      {bare ? <Outlet /> : <AppShell><Outlet /></AppShell>}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
