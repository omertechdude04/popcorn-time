import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { tmdb, IMG, titleOf, yearOf, mediaTypeOf } from "@/lib/tmdb";
import { MovieCard, PosterSkeleton } from "@/components/MovieCard";
import { Search as SearchIcon } from "lucide-react";

type S = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): S => ({ q: (s.q as string) || "" }),
  head: () => ({ meta: [{ title: "Search — Popcorn Time" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const nav = Route.useNavigate();
  const [input, setInput] = useState(q);
  const [tab, setTab] = useState<"all" | "movie" | "tv" | "person">("all");

  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) nav({ search: { q: input } });
    }, 250);
    return () => clearTimeout(t);
  }, [input]);

  const enabled = q.trim().length > 0;
  const { data, isLoading } = useQuery({
    queryKey: ["search-multi", q],
    queryFn: () => tmdb.call("/search/multi", { query: q, include_adult: false }),
    enabled,
  });

  const all = (data?.results || []).filter((r: any) => r.media_type !== "person" || r.profile_path);
  const movies = all.filter((r: any) => r.media_type === "movie");
  const shows = all.filter((r: any) => r.media_type === "tv");
  const people = all.filter((r: any) => r.media_type === "person");

  const visible = tab === "all" ? all : tab === "movie" ? movies : tab === "tv" ? shows : people;

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold">Search</h1>
      <div className="relative mt-5 max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try “new horror movies”, “Pedro Pascal”, “Demi Moore 2005”…"
          className="w-full bg-surface border border-border rounded-full pl-12 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {!enabled && (
        <p className="text-muted-foreground mt-6">Search across movies, TV shows, and people.</p>
      )}

      {enabled && (
        <>
          <div className="mt-6 flex gap-2 flex-wrap">
            {[
              { v: "all", l: `All (${all.length})` },
              { v: "movie", l: `Movies (${movies.length})` },
              { v: "tv", l: `TV (${shows.length})` },
              { v: "person", l: `People (${people.length})` },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setTab(t.v as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                  tab === t.v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/30"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="flex gap-4 flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => <PosterSkeleton key={i} />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <p className="text-lg font-medium text-foreground">No results for “{q}”</p>
                <p className="mt-1 text-sm">Try a different spelling or fewer words.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
                {visible.map((r: any, i: number) =>
                  r.media_type === "person" ? (
                    <Link key={r.id} to="/person/$id" params={{ id: String(r.id) }} className="group">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface shadow-poster">
                        {r.profile_path ? (
                          <img src={IMG(r.profile_path, "w500")!} alt={r.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (<div className="h-full w-full grid place-items-center text-muted-foreground text-xs">{r.name}</div>)}
                      </div>
                      <p className="mt-2.5 text-sm font-medium line-clamp-1 group-hover:text-primary">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.known_for_department || "Person"}</p>
                    </Link>
                  ) : (
                    <div key={`${r.media_type}-${r.id}`} className="w-full">
                      <MovieCard item={r} className="!w-full" index={i} />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
