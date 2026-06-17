import { Train } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedImage } from "./SignedImage";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  direction?: "row" | "col";
  className?: string;
  textClassName?: string;
  subTextClassName?: string;
  showSubtext?: boolean;
  onDark?: boolean;
}

async function fetchLogoPath(): Promise<string | null> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "logo_path")
    .maybeSingle();
  const v: any = data?.value;
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.path === "string") return v.path;
  return null;
}

export function Logo({
  size = "md",
  direction = "row",
  className,
  textClassName,
  subTextClassName,
  showSubtext = true,
  onDark = false,
}: LogoProps) {
  const [logoPath, setLogoPath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    function refresh() {
      fetchLogoPath().then((p) => { if (!cancelled) setLogoPath(p); });
    }
    refresh();
    window.addEventListener("rti-logo-updated", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("rti-logo-updated", refresh);
    };
  }, []);

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-16 w-16",
  };

  const iconInnerSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
    xl: "h-8 w-8",
  };

  const headingSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const subSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center",
        direction === "col" && "flex-col gap-2",
        direction === "row" && "gap-3",
        className
      )}
    >
      <div
        className={cn(
          "shrink-0 rounded-lg bg-gradient-accent flex items-center justify-center overflow-hidden shadow-glow",
          iconSizes[size]
        )}
      >
        {logoPath ? (
          <SignedImage
            path={logoPath}
            alt="Logo"
            className="h-full w-full object-contain"
            fallback={<Train className={cn(iconInnerSizes[size], "text-accent-foreground")} />}
          />
        ) : (
          <Train className={cn(iconInnerSizes[size], "text-accent-foreground")} />
        )}
      </div>
      <div className={cn(direction === "col" && "text-center")}>
        <div
          className={cn(
            "font-display font-bold leading-tight",
            headingSizes[size],
            onDark ? "text-white" : "text-brand-navy",
            textClassName
          )}
        >
          Railway Institute Restaurant Management System
        </div>
        {showSubtext && (
          <div
            className={cn(
              "leading-tight",
              subSizes[size],
              onDark ? "text-white/70" : "text-muted-foreground",
              subTextClassName
            )}
          >
            RTI Canteen
          </div>
        )}
      </div>
    </div>
  );
}
