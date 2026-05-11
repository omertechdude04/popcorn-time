import { createServerFn } from "@tanstack/react-start";

const BASE = "https://api.themoviedb.org/3";

export const tmdbFetch = createServerFn({ method: "POST" })
  .inputValidator((data: { path: string; params?: Record<string, string | number | boolean | undefined> }) => data)
  .handler(async ({ data }) => {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error("TMDB key not configured");

    const url = new URL(BASE + data.path);
    if (data.params) {
      for (const [k, v] of Object.entries(data.params)) {
        if (v === undefined || v === null || v === "") continue;
        url.searchParams.set(k, String(v));
      }
    }

    const looksLikeJWT = key.startsWith("ey") && key.length > 100;
    const headers: Record<string, string> = { accept: "application/json" };
    if (looksLikeJWT) {
      headers.authorization = `Bearer ${key}`;
    } else {
      url.searchParams.set("api_key", key);
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("TMDB error", res.status, text);
      throw new Error(`TMDB ${res.status}`);
    }
    return res.json();
  });
