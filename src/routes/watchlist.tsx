import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { MovieCard } from "@/components/MovieCard";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — Popcorn Time" }] }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("watchlist").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setItems(data || []));
  }, [user, reload]);

  if (loading) return <div className="pt-24 px-6">…</div>;
  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Your watchlist</h1>
          <p className="mt-2 text-muted-foreground">Sign in to save titles you want to watch later.</p>
          <Link to="/login" className="mt-4 inline-flex px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold">Sign in</Link>
        </div>
      </div>
    );
  }

  const filtered = items.filter((i) => filter === "all" || i.media_type === filter);

  const remove = async (i: any) => {
    await supabase.from("watchlist").delete().eq("id", i.id);
    setReload((r) => r + 1);
    toast.success("Removed");
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-10 pt-24">
      <h1 className="text-3xl sm:text-4xl font-bold">Your watchlist</h1>
      <p className="text-muted-foreground mt-1">Everything you want to watch, in one place.</p>

      <div className="mt-6 flex gap-2">
        {[{ v: "all", l: `All (${items.length})` }, { v: "movie", l: `Movies (${items.filter(i=>i.media_type==='movie').length})` }, { v: "tv", l: `TV (${items.filter(i=>i.media_type==='tv').length})` }].map((t) => (
          <button key={t.v} onClick={() => setFilter(t.v as any)} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${filter === t.v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/30"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg font-medium">Nothing here yet.</p>
          <p className="mt-1 text-muted-foreground">Find titles to add from the home page or search.</p>
          <Link to="/" className="mt-5 inline-flex px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold">Browse</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
          {filtered.map((i, idx) => (
            <div key={i.id} className="relative w-full group">
              <MovieCard
                item={{ id: i.tmdb_id, title: i.title, poster_path: i.poster_path, vote_average: i.vote_average, release_date: i.release_date, media_type: i.media_type }}
                className="!w-full"
                index={idx}
              />
              <button onClick={() => remove(i)} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur grid place-items-center opacity-0 group-hover:opacity-100 transition" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
