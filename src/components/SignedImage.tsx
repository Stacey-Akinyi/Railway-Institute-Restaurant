import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const cache = new Map<string, { url: string; expires: number }>();

export function useSignedUrl(path: string | null | undefined, bucket = "restaurant-images") {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    const key = `${bucket}/${path}`;
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) { setUrl(hit.url); return; }
    let cancelled = false;
    supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => {
      if (cancelled || !data) return;
      cache.set(key, { url: data.signedUrl, expires: Date.now() + 3500_000 });
      setUrl(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [path, bucket]);
  return url;
}

export function SignedImage({
  path,
  bucket = "restaurant-images",
  alt,
  className,
  fallback,
}: {
  path: string | null | undefined;
  bucket?: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const url = useSignedUrl(path, bucket);
  if (!path || !url) return <>{fallback ?? null}</>;
  return <img src={url} alt={alt} className={cn(className)} loading="lazy" />;
}
