import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo.png";

const LOGO_PATH = "logo.png";

let cachedUrl: string | null = null;
const listeners = new Set<(u: string) => void>();

export function refreshLogo() {
  const { data } = supabase.storage.from("branding").getPublicUrl(LOGO_PATH);
  // bust cache
  const url = `${data.publicUrl}?t=${Date.now()}`;
  // Probe to confirm the file actually exists; if not, fall back.
  fetch(url, { method: "HEAD" }).then((res) => {
    const final = res.ok ? url : defaultLogo;
    cachedUrl = final;
    listeners.forEach((l) => l(final));
  }).catch(() => {
    cachedUrl = defaultLogo;
    listeners.forEach((l) => l(defaultLogo));
  });
}

export function useLogoUrl() {
  const [url, setUrl] = useState<string>(cachedUrl ?? defaultLogo);
  useEffect(() => {
    listeners.add(setUrl);
    if (!cachedUrl) refreshLogo();
    return () => { listeners.delete(setUrl); };
  }, []);
  return url;
}

export async function uploadLogo(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `logo.${ext === "png" ? "png" : ext}`;
  // Always upload to logo.png so the navbar finds it
  const { error } = await supabase.storage
    .from("branding")
    .upload(LOGO_PATH, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  refreshLogo();
  return path;
}
