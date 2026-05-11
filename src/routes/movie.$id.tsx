import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { tmdb, IMG } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import {
  Star,
  Play,
  Plus,
  Heart,
  Bell,
  X,
  Check,
  Share2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/movie/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Movie — Popcorn Time` },
      { property: "og:type", content: "video.movie" },
      { property: "og:url", content: `/movie/${params.id}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MovieDetails,
});

function upsertMeta(selector: string, attr: "property" | "name", key: string, content: string) {
  if (!content) return;

  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export function useDynamicShareMeta({
  title,
  description,
  image,
  url,
  type = "website",
}: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  useEffect(() => {
    if (!title) return;

    document.title = `${title} — Popcorn Time`;

    upsertMeta('meta[property="og:title"]', "property", "og:title", `${title} — Popcorn Time`);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description || "");
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url || window.location.href);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", `${title} — Popcorn Time`);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description || "");
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");

    if (image) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", image);
      upsertMeta('meta[property="og:image:secure_url"]', "property", "og:image:secure_url", image);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }
  }, [title, description, image, url, type]);
}

function MovieDetails() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [trailerOpen, setTrailerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: () =>
      tmdb.call(`/movie/${id}`, {
        append_to_response:
          "credits,videos,watch/providers,recommendations,similar,release_dates",
      }),
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", "movie", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("tmdb_id", Number(id))
        .eq("media_type", "movie")
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const shareImage = data?.poster_path
    ? IMG(data.poster_path, "w780")
    : data?.backdrop_path
      ? IMG(data.backdrop_path, "original")
      : undefined;

  useDynamicShareMeta({
    title: data?.title,
    description: data?.overview,
    image: shareImage || undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    type: "video.movie",
  });

  if (isLoading || !data) {
    return (
      <div className="pt-32 mx-auto max-w-[1500px] px-6">
        <div className="h-[60vh] rounded-2xl bg-surface animate-pulse" />
      </div>
    );
  }

  const trailer =
    data.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
    data.videos?.results?.[0];

  const providers = data["watch/providers"]?.results?.US;
  const cast = data.credits?.cast || [];
  const crew = data.credits?.crew || [];
  const director = crew.find((c: any) => c.job === "Director");
  const writers = crew.filter((c: any) => c.department === "Writing").slice(0, 3);

  return (
    <article className="pb-20">
      <div className="relative h-[70vh] min-h-[480px] w-full">
        {data.backdrop_path && (
          <img
            src={IMG(data.backdrop_path, "original")!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </div>

      <div className="relative -mt-72 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="grid md:grid-cols-[280px_1fr] gap-8 items-end">
          <div className="hidden md:block">
            <img
              src={IMG(data.poster_path, "w500") || ""}
              alt={data.title}
              className="rounded-2xl shadow-poster w-full"
            />
          </div>

          <div className="rise-in">
            {data.tagline && (
              <p className="text-primary text-sm font-medium tracking-wider uppercase mb-2">
                {data.tagline}
              </p>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance">
              {data.title}
            </h1>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {data.release_date && <span>{data.release_date.slice(0, 4)}</span>}

              {data.runtime ? (
                <span>
                  {Math.floor(data.runtime / 60)}h {data.runtime % 60}m
                </span>
              ) : null}

              {data.vote_average ? (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  {data.vote_average.toFixed(1)}
                </span>
              ) : null}

              <div className="flex gap-1.5 flex-wrap">
                {data.genres?.map((g: any) => (
                  <span key={g.id} className="px-2.5 py-0.5 rounded-full bg-surface-2 text-xs">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-foreground/80 text-balance">
              {data.overview}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {trailer && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 shadow-glow"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Watch trailer
                </button>
              )}

              <ActionButtons
                mediaType="movie"
                id={Number(id)}
                title={data.title}
                poster={data.poster_path}
                backdrop={data.backdrop_path}
                overview={data.overview}
                releaseDate={data.release_date}
                vote={data.vote_average}
              />
            </div>
          </div>
        </div>

        {providers && (
          <Section title="Where to watch">
            <div className="space-y-4">
              {(["flatrate", "rent", "buy"] as const).map((k) =>
                providers[k]?.length ? (
                  <div key={k}>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      {k === "flatrate" ? "Stream" : k === "rent" ? "Rent" : "Buy"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {providers[k].map((p: any) => (
                        <div
                          key={p.provider_id}
                          className="flex items-center gap-2 glass rounded-xl px-3 py-2"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w200${p.logo_path}`}
                            alt=""
                            className="h-8 w-8 rounded-md"
                          />
                          <span className="text-sm">{p.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </Section>
        )}

        {cast.length > 0 && (
          <Section title="Cast">
            <div className="row-scroll flex gap-4 overflow-x-auto pb-2">
              {cast.slice(0, 18).map((c: any) => (
                <Link
                  key={c.cast_id || c.credit_id}
                  to="/person/$id"
                  params={{ id: String(c.id) }}
                  className="group w-[120px] sm:w-[140px] shrink-0"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface shadow-poster">
                    {c.profile_path ? (
                      <img
                        src={IMG(c.profile_path, "w300")!}
                        alt={c.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs text-muted-foreground p-2 text-center">
                        {c.name}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium line-clamp-1 group-hover:text-primary">
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{c.character}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}

        <Section title="Details">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {director && <Detail label="Director" value={director.name} />}
            {writers.length > 0 && (
              <Detail label="Writers" value={writers.map((w: any) => w.name).join(", ")} />
            )}
            <Detail label="Status" value={data.status} />
            <Detail label="Original language" value={data.original_language?.toUpperCase()} />
            <Detail
              label="Budget"
              value={data.budget ? `$${(data.budget / 1_000_000).toFixed(1)}M` : "—"}
            />
            <Detail
              label="Revenue"
              value={data.revenue ? `$${(data.revenue / 1_000_000).toFixed(1)}M` : "—"}
            />
            <Detail
              label="Production"
              value={data.production_companies?.map((p: any) => p.name).join(", ")}
            />
            <Detail
              label="Country"
              value={data.production_countries?.map((p: any) => p.name).join(", ")}
            />
          </div>
        </Section>

        <Section title="Reviews">
          {user ? (
            <ReviewForm
              tmdbId={Number(id)}
              mediaType="movie"
              title={data.title}
              poster={data.poster_path}
            />
          ) : (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-muted-foreground">Sign in to leave a review.</p>
              <Link
                to="/login"
                className="mt-3 inline-flex px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
              >
                Sign in
              </Link>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {reviews && reviews.length > 0 ? (
              reviews.map((r: any) => <ReviewCard key={r.id} review={r} />)
            ) : (
              <p className="text-muted-foreground">No reviews yet. Be the first.</p>
            )}
          </div>
        </Section>

        {data.recommendations?.results?.length > 0 && (
          <Section title="More like this">
            <div className="row-scroll flex gap-4 overflow-x-auto pb-2">
              {data.recommendations.results.slice(0, 18).map((m: any, i: number) => (
                <MovieCard key={m.id} item={{ ...m, media_type: "movie" }} index={i} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {trailerOpen && trailer && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur grid place-items-center p-4"
          onClick={() => setTrailerOpen(false)}
        >
          <button
            onClick={() => setTrailerOpen(false)}
            className="absolute top-6 right-6 h-10 w-10 rounded-full glass grid place-items-center"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-poster">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Trailer"
            />
          </div>
        </div>
      )}
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold mb-5">{title}</h2>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

export function ShareButton({
  title,
  overview,
  mediaType,
}: {
  title: string;
  overview?: string;
  mediaType: "movie" | "tv";
}) {
  const shareTitle = `${title} — Popcorn Time`;
  const shareText =
    overview ||
    `Check out this ${mediaType === "movie" ? "movie" : "show"} on Popcorn Time.`;

  const getUrl = () => window.location.href;

  const share = async () => {
    const url = getUrl();

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch (error) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      } catch {
        toast.error("Could not share this link");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass font-semibold hover:bg-surface-2"
    >
      <Share2 className="h-4 w-4" />
      Share
    </button>
  );
}

export function ActionButtons({
  mediaType,
  id,
  title,
  poster,
  backdrop,
  overview,
  releaseDate,
  vote,
}: {
  mediaType: "movie" | "tv";
  id: number;
  title: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  releaseDate?: string;
  vote?: number;
}) {
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!user) {
      setInWatchlist(false);
      setFavorited(false);
      return;
    }

    supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("tmdb_id", id)
      .eq("media_type", mediaType)
      .maybeSingle()
      .then(({ data }: any) => setInWatchlist(!!data));

    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("tmdb_id", id)
      .eq("media_type", mediaType)
      .maybeSingle()
      .then(({ data }: any) => setFavorited(!!data));
  }, [user, id, mediaType]);

  const requireAuth = () => {
    if (!user) {
      toast.error("Sign in to save titles");
      return false;
    }
    return true;
  };

  const toggleWatchlist = async () => {
    if (!requireAuth()) return;

    if (inWatchlist) {
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user!.id)
        .eq("tmdb_id", id)
        .eq("media_type", mediaType);

      setInWatchlist(false);
      toast.success("Removed from watchlist");
    } else {
      await supabase.from("watchlist").insert({
        user_id: user!.id,
        tmdb_id: id,
        media_type: mediaType,
        title,
        poster_path: poster,
        release_date: releaseDate,
        vote_average: vote,
      });

      setInWatchlist(true);
      toast.success("Added to watchlist");
    }
  };

  const toggleFavorite = async () => {
    if (!requireAuth()) return;

    if (favorited) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user!.id)
        .eq("tmdb_id", id)
        .eq("media_type", mediaType);

      setFavorited(false);
      toast.success("Removed from favorites");
    } else {
      await supabase.from("favorites").insert({
        user_id: user!.id,
        tmdb_id: id,
        media_type: mediaType,
        title,
        poster_path: poster,
      });

      setFavorited(true);
      toast.success("Added to favorites");
    }
  };

  const setReminder = async () => {
    if (!requireAuth()) return;

    await supabase.from("reminders").upsert(
      {
        user_id: user!.id,
        tmdb_id: id,
        media_type: mediaType,
        title,
        poster_path: poster,
        event_type: mediaType === "movie" ? "release" : "next_episode",
        event_date: releaseDate || null,
      },
      { onConflict: "user_id,tmdb_id,media_type,event_type" }
    );

    toast.success("Reminder set");
  };

  return (
    <>
      <button
        onClick={toggleWatchlist}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass font-semibold hover:bg-surface-2"
      >
        {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {inWatchlist ? "On watchlist" : "Watchlist"}
      </button>

      <button
        onClick={toggleFavorite}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass font-semibold hover:bg-surface-2"
      >
        <Heart className={`h-4 w-4 ${favorited ? "fill-accent text-accent" : ""}`} />
        {favorited ? "Liked" : "Like"}
      </button>

      <button
        onClick={setReminder}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass font-semibold hover:bg-surface-2"
      >
        <Bell className="h-4 w-4" />
        Remind me
      </button>

      <ShareButton title={title} overview={overview} mediaType={mediaType} />
    </>
  );
}

function ReviewForm({
  tmdbId,
  mediaType,
  title,
  poster,
}: {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  poster?: string;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(8);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!body.trim() || !user) return;

    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      tmdb_id: tmdbId,
      media_type: mediaType,
      title,
      poster_path: poster,
      rating,
      body: body.trim(),
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Review posted");
      setBody("");
    }
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <button key={i} onClick={() => setRating(i + 1)}>
            <Star
              className={`h-5 w-5 ${
                i < rating ? "fill-primary text-primary" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}

        <span className="ml-2 text-sm text-muted-foreground">{rating}/10</span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think?"
        rows={3}
        className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />

      <div className="mt-3 flex justify-end">
        <button
          disabled={submitting || !body.trim()}
          onClick={submit}
          className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post review"}
        </button>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center text-xs font-semibold text-primary">
            {(review.user_id || "?").slice(0, 2).toUpperCase()}
          </div>

          <span className="text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString()}
          </span>
        </div>

        {review.rating && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            {review.rating}/10
          </div>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{review.body}</p>
    </div>
  );
}