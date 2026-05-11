import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { tmdb } from "@/lib/tmdb";
import { MovieCard, PosterSkeleton } from "@/components/MovieCard";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Search = {
  genre?: number;
  year?: number;
  sort?: string;
  status?: string;
  with_people?: string;
  person_name?: string;
};

export const Route = createFileRoute("/tv/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    genre: s.genre ? Number(s.genre) : undefined,
    year: s.year ? Number(s.year) : undefined,
    sort: (s.sort as string) || "popularity.desc",
    status: (s.status as string) || undefined,
    with_people: (s.with_people as string) || undefined,
    person_name: (s.person_name as string) || undefined,
  }),
  head: () => ({ meta: [{ title: "TV Shows — Popcorn Time" }] }),
  component: TvPage,
});

const SORTS = [
  { v: "popularity.desc", l: "Most popular" },
  { v: "vote_average.desc", l: "Highest rated" },
  { v: "first_air_date.desc", l: "Newest" },
  { v: "first_air_date.asc", l: "Oldest" },
];

function TvPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const [open, setOpen] = useState(false);
  const [personQ, setPersonQ] = useState(search.person_name || "");

  const { data: genres } = useQuery({
    queryKey: ["genres", "tv"],
    queryFn: () => tmdb.call("/genre/tv/list"),
    staleTime: Infinity,
  });
  const { data: people } = useQuery({
    queryKey: ["search-person", personQ],
    queryFn: () => tmdb.call("/search/person", { query: personQ }),
    enabled: personQ.trim().length > 1,
  });

  const params: Record<string, any> = {
    sort_by: search.sort || "popularity.desc",
    include_adult: false,
    page: 1,
    "vote_count.gte": 30,
  };
  if (search.genre) params.with_genres = search.genre;
  if (search.year) params.first_air_date_year = search.year;
  if (search.with_people) params.with_people = search.with_people;
  if (search.status === "returning") params.with_status = "0";
  if (search.status === "ended") params.with_status = "3";
  if (search.status === "airing") params.with_status = "0";

  const { data, isLoading } = useQuery({
    queryKey: ["discover", "tv", params],
    queryFn: () => tmdb.call("/discover/tv", params),
  });

  const setParam = (k: keyof Search, v: any) =>
    nav({ search: (prev: any) => ({ ...prev, [k]: v || undefined }) });

  const years = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() + 2 - i);

  const filtersBody = (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort by</label>
        <select
          value={search.sort || "popularity.desc"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="mt-2 w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[
            { v: undefined, l: "Any" },
            { v: "returning", l: "Airing" },
            { v: "ended", l: "Ended" },
          ].map((s) => (
            <button
              key={s.l}
              onClick={() => setParam("status", s.v)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition border",
                search.status === s.v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-foreground/30"
              )}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Genre</label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(genres?.genres || []).map((g: any) => (
            <button
              key={g.id}
              onClick={() => setParam("genre", search.genre === g.id ? undefined : g.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition border",
                search.genre === g.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-foreground/30"
              )}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First air year</label>
        <select
          value={search.year || ""}
          onChange={(e) => setParam("year", e.target.value ? Number(e.target.value) : undefined)}
          className="mt-2 w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Any year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actor / person</label>
        <input
          value={personQ}
          onChange={(e) => setPersonQ(e.target.value)}
          placeholder="e.g. Pedro Pascal"
          className="mt-2 w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {personQ.trim().length > 1 && people?.results && (
          <div className="mt-2 rounded-lg border border-border bg-surface max-h-56 overflow-auto">
            {people.results.slice(0, 6).map((p: any) => (
              <button
                key={p.id}
                onClick={() => {
                  nav({ search: (prev: any) => ({ ...prev, with_people: String(p.id), person_name: p.name }) });
                  setPersonQ(p.name);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface-2 text-left text-sm"
              >
                {p.profile_path ? (
                  <img src={`https://image.tmdb.org/t/p/w200${p.profile_path}`} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (<div className="h-8 w-8 rounded-full bg-surface-2" />)}
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const activeChips = [
    search.genre && genres?.genres?.find((g: any) => g.id === search.genre) && { label: genres.genres.find((g: any) => g.id === search.genre).name, key: "genre" },
    search.year && { label: String(search.year), key: "year" },
    search.person_name && { label: search.person_name, key: "with_people" },
    search.status && { label: search.status === "returning" ? "Airing" : "Ended", key: "status" },
  ].filter(Boolean) as { label: string; key: string }[];

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">TV Shows</h1>
          <p className="text-muted-foreground mt-1 text-sm">Currently airing, classics, and everything in between.</p>
        </div>
        <button onClick={() => setOpen(true)} className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block sticky top-24 self-start rounded-2xl glass p-5 h-fit">{filtersBody}</aside>
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur" onClick={() => setOpen(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-card p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-full glass grid place-items-center"><X className="h-4 w-4" /></button>
              </div>
              {filtersBody}
            </div>
          </div>
        )}

        <div>
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    if (c.key === "with_people") nav({ search: (p: any) => ({ ...p, with_people: undefined, person_name: undefined }) });
                    else setParam(c.key as any, undefined);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/30"
                >
                  {c.label} <X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={() => nav({ search: () => ({ sort: "popularity.desc" }) as Search })} className="px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground">
                Clear all
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
            {isLoading
              ? Array.from({ length: 15 }).map((_, i) => <PosterSkeleton key={i} />)
              : (data?.results || []).map((m: any, i: number) => (
                  <div key={m.id} className="w-full">
                    <MovieCard item={{ ...m, media_type: "tv" }} className="!w-full" index={i} />
                  </div>
                ))}
          </div>

          {!isLoading && (data?.results || []).length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg font-medium text-foreground">No shows match these filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
