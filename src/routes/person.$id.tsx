import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { tmdb, IMG } from "@/lib/tmdb";
import { MovieCard, PosterSkeleton } from "@/components/MovieCard";

export const Route = createFileRoute("/person/$id")({
  head: () => ({ meta: [{ title: "Person — Popcorn Time" }] }),
  component: PersonPage,
});

function PersonPage() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<"all" | "movie" | "tv">("all");
  const [sort, setSort] = useState<"popularity" | "date">("popularity");

  const { data, isLoading } = useQuery({
    queryKey: ["person", id],
    queryFn: () => tmdb.call(`/person/${id}`, { append_to_response: "combined_credits" }),
  });

  if (isLoading || !data) {
    return <div className="pt-32 mx-auto max-w-[1500px] px-6"><div className="h-96 rounded-2xl bg-surface animate-pulse" /></div>;
  }

  const credits = data.combined_credits?.cast || [];
  const filtered = tab === "all" ? credits : credits.filter((c: any) => c.media_type === tab);
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sort === "popularity") return (b.popularity || 0) - (a.popularity || 0);
    const aD = a.release_date || a.first_air_date || "";
    const bD = b.release_date || b.first_air_date || "";
    return bD.localeCompare(aD);
  });

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-12 pt-24">
      <div className="grid md:grid-cols-[260px_1fr] gap-8">
        <div>
          <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-surface shadow-poster">
            {data.profile_path ? (
              <img src={IMG(data.profile_path, "w500")!} alt={data.name} className="h-full w-full object-cover" />
            ) : (<div className="h-full w-full grid place-items-center text-muted-foreground">{data.name}</div>)}
          </div>
          <div className="mt-5 space-y-3 text-sm">
            {data.known_for_department && (<div><p className="text-xs uppercase tracking-wider text-muted-foreground">Known for</p><p>{data.known_for_department}</p></div>)}
            {data.birthday && (<div><p className="text-xs uppercase tracking-wider text-muted-foreground">Born</p><p>{new Date(data.birthday).toLocaleDateString()} {data.place_of_birth ? `· ${data.place_of_birth}` : ""}</p></div>)}
            {data.deathday && (<div><p className="text-xs uppercase tracking-wider text-muted-foreground">Died</p><p>{new Date(data.deathday).toLocaleDateString()}</p></div>)}
          </div>
        </div>

        <div>
          <h1 className="text-4xl sm:text-5xl font-bold">{data.name}</h1>
          {data.biography && <p className="mt-4 text-foreground/80 leading-relaxed text-balance whitespace-pre-line max-w-3xl">{data.biography}</p>}

          <div className="mt-10 flex flex-wrap items-center gap-2">
            {[
              { v: "all", l: "All" },
              { v: "movie", l: "Movies" },
              { v: "tv", l: "TV" },
            ].map((t) => (
              <button key={t.v} onClick={() => setTab(t.v as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${tab === t.v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/30"}`}>
                {t.l}
              </button>
            ))}
            <div className="ml-auto">
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="bg-surface border border-border rounded-full px-3 py-1.5 text-sm focus:outline-none">
                <option value="popularity">Most popular</option>
                <option value="date">Newest first</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-8">
            {sorted.slice(0, 60).map((c: any, i: number) => (
              <div key={`${c.media_type}-${c.id}-${c.credit_id}`} className="w-full">
                <MovieCard item={c} className="!w-full" index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
