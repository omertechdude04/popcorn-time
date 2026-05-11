import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { tmdb, IMG } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { Star, Play, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Section, ActionButtons, useDynamicShareMeta } from "./movie.$id";

export const Route = createFileRoute("/tv/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Show — Popcorn Time` },
      { property: "og:type", content: "video.tv_show" },
      { property: "og:url", content: `/tv/${params.id}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TvDetails,
});

function TvDetails() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [trailerOpen, setTrailerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tv", id],
    queryFn: () =>
      tmdb.call(`/tv/${id}`, {
        append_to_response: "credits,videos,watch/providers,recommendations,similar",
      }),
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", "tv", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("tmdb_id", Number(id))
        .eq("media_type", "tv")
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
    title: data?.name,
    description: data?.overview,
    image: shareImage || undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    type: "video.tv_show",
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
  const next = data.next_episode_to_air;
  const last = data.last_episode_to_air;

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
              alt={data.name}
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
              {data.name}
            </h1>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {data.first_air_date && <span>{data.first_air_date.slice(0, 4)}</span>}

              <span>
                {data.number_of_seasons} season{data.number_of_seasons !== 1 ? "s" : ""}
              </span>

              <span>
                {data.number_of_episodes} episode{data.number_of_episodes !== 1 ? "s" : ""}
              </span>

              {data.vote_average ? (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  {data.vote_average.toFixed(1)}
                </span>
              ) : null}

              <span className="px-2 py-0.5 rounded-full bg-surface-2 text-xs">
                {data.status}
              </span>

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
                mediaType="tv"
                id={Number(id)}
                title={data.name}
                poster={data.poster_path}
                backdrop={data.backdrop_path}
                overview={data.overview}
                releaseDate={next?.air_date || data.first_air_date}
                vote={data.vote_average}
              />
            </div>
          </div>
        </div>

        {(next || last) && (
          <Section title="Episodes">
            <div className="grid sm:grid-cols-2 gap-4">
              {next && (
                <div className="glass rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-wider text-primary mb-2">
                    Next episode
                  </p>
                  <p className="text-lg font-semibold">{next.name}</p>
                  <p className="text-sm text-muted-foreground">
                    S{next.season_number} · E{next.episode_number} · airs{" "}
                    {new Date(next.air_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {last && (
                <div className="glass rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Latest episode
                  </p>
                  <p className="text-lg font-semibold">{last.name}</p>
                  <p className="text-sm text-muted-foreground">
                    S{last.season_number} · E{last.episode_number} ·{" "}
                    {last.air_date && new Date(last.air_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {!next && data.status !== "Ended" && (
              <p className="mt-3 text-sm text-muted-foreground">
                No upcoming episode announced yet.
              </p>
            )}
          </Section>
        )}

        {data.seasons?.length > 0 && (
          <Section title="Seasons">
            <div className="row-scroll flex gap-4 overflow-x-auto pb-2">
              {data.seasons
                .filter((s: any) => s.season_number > 0)
                .map((s: any) => (
                  <div key={s.id} className="w-[160px] shrink-0">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface shadow-poster">
                      {s.poster_path ? (
                        <img
                          src={IMG(s.poster_path, "w300")!}
                          alt={s.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                          {s.name}
                        </div>
                      )}
                    </div>

                    <p className="mt-2 text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.episode_count} ep{s.episode_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
            </div>
          </Section>
        )}

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
                  key={c.credit_id}
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
            <Detail label="Network" value={data.networks?.map((n: any) => n.name).join(", ")} />
            <Detail
              label="Created by"
              value={data.created_by?.map((c: any) => c.name).join(", ")}
            />
            <Detail label="Status" value={data.status} />
            <Detail label="Original language" value={data.original_language?.toUpperCase()} />
            <Detail label="Country" value={data.origin_country?.join(", ")} />
            <Detail label="Type" value={data.type} />
          </div>
        </Section>

        <Section title="Reviews">
          {!user && (
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
              reviews.map((r: any) => (
                <div key={r.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center text-xs font-semibold text-primary">
                        {(r.user_id || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {r.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        {r.rating}/10
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed">{r.body}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No reviews yet. Be the first.</p>
            )}
          </div>
        </Section>

        {data.recommendations?.results?.length > 0 && (
          <Section title="More like this">
            <div className="row-scroll flex gap-4 overflow-x-auto pb-2">
              {data.recommendations.results.slice(0, 18).map((m: any, i: number) => (
                <MovieCard key={m.id} item={{ ...m, media_type: "tv" }} index={i} />
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

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}