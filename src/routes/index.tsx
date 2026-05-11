import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { tmdb, IMG, titleOf, yearOf } from "@/lib/tmdb";
import { MovieCard, PosterSkeleton } from "@/components/MovieCard";
import { Row } from "@/components/Row";
import { ReminderBanner } from "@/components/ReminderBanner";
import { Play, Plus, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Popcorn Time — Movies & TV worth watching" },
      {
        name: "description",
        content: "Trending movies, top TV shows, and your next favorite. All in one place.",
      },
    ],
  }),
  component: Home,
});

function useTmdb<T = any>(key: any[], path: string, params?: any) {
  return useQuery<T>({
    queryKey: ["tmdb", ...key],
    queryFn: () => tmdb.call<T>(path, params),
    staleTime: 5 * 60_000,
  });
}

function normalizeItems(items: any[], mediaType: "movie" | "tv" | "person" | "all") {
  return (items || []).map((item) => {
    if (item.media_type) return item;

    if (mediaType === "movie") {
      return { ...item, media_type: "movie" };
    }

    if (mediaType === "tv") {
      return { ...item, media_type: "tv" };
    }

    return item;
  });
}

function Hero() {
  const trending = useTmdb<any>(["hero-trending-week"], "/trending/all/week");
  const popularMovies = useTmdb<any>(["hero-popular-movies"], "/movie/popular");
  const nowPlaying = useTmdb<any>(["hero-now-playing"], "/movie/now_playing");
  const upcoming = useTmdb<any>(["hero-upcoming"], "/movie/upcoming");
  const popularTv = useTmdb<any>(["hero-popular-tv"], "/tv/popular");
  const onTheAir = useTmdb<any>(["hero-on-the-air"], "/tv/on_the_air");

  const heroItems = useMemo(() => {
    const combined = [
      ...normalizeItems(trending.data?.results || [], "all"),
      ...normalizeItems(popularMovies.data?.results || [], "movie"),
      ...normalizeItems(nowPlaying.data?.results || [], "movie"),
      ...normalizeItems(upcoming.data?.results || [], "movie"),
      ...normalizeItems(popularTv.data?.results || [], "tv"),
      ...normalizeItems(onTheAir.data?.results || [], "tv"),
    ];

    const unique = new Map<number, any>();

    combined.forEach((item) => {
      if (!item?.id || !item?.backdrop_path || !item?.overview) return;
      if (item.media_type === "person") return;
      if (!unique.has(item.id)) unique.set(item.id, item);
    });

    return Array.from(unique.values()).slice(0, 20);
  }, [
    trending.data,
    popularMovies.data,
    nowPlaying.data,
    upcoming.data,
    popularTv.data,
    onTheAir.data,
  ]);

  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (heroItems.length <= 1) return;

    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroItems.length);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [heroItems.length]);

  const hero = heroItems[heroIndex];

  if (!hero) {
    return <div className="h-[70vh] sm:h-[80vh] bg-surface animate-pulse" />;
  }

  const type = hero.media_type === "tv" || hero.name ? "tv" : "movie";

  return (
    <section className="relative h-[80vh] min-h-[520px] w-full overflow-hidden">
      <img
        key={hero.backdrop_path}
        src={IMG(hero.backdrop_path, "original")!}
        alt={titleOf(hero)}
        className="absolute inset-0 h-full w-full object-cover scale-105 animate-fade-in"
      />

      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />

      <div className="relative h-full mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 flex items-end pb-16 sm:pb-24">
        <div key={hero.id} className="max-w-2xl rise-in">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Featured now
          </span>

          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-balance">
            {titleOf(hero)}
          </h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {yearOf(hero) && <span>{yearOf(hero)}</span>}

            {hero.vote_average ? (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {hero.vote_average.toFixed(1)}
              </span>
            ) : null}

            <span className="uppercase text-xs tracking-wider">
              {type === "tv" ? "Series" : "Film"}
            </span>
          </div>

          <p className="mt-4 text-base sm:text-lg text-foreground/80 line-clamp-3 text-balance">
            {hero.overview}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={type === "movie" ? "/movie/$id" : "/tv/$id"}
              params={{ id: String(hero.id) }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 shadow-glow transition"
            >
              View details
            </Link>

            <Link
              to="/movies"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass font-semibold hover:bg-surface-2 transition"
            >
              <Plus className="h-4 w-4" />
              Browse all
            </Link>
          </div>

          <div className="mt-6 flex gap-2">
            {heroItems.slice(0, 8).map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                type="button"
                onClick={() => setHeroIndex(index)}
                aria-label={`Show featured title ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === heroIndex ? "w-8 bg-primary" : "w-3 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonRow() {
  const { data, isLoading } = useTmdb<any>(["popular-people"], "/person/popular");

  return (
    <Row title="Spotlight on talent">
      {isLoading
        ? Array.from({ length: 10 }).map((_, i) => <PosterSkeleton key={i} />)
        : (data?.results || []).slice(0, 18).map((p: any) => (
            <Link
              key={p.id}
              to="/person/$id"
              params={{ id: String(p.id) }}
              className="group w-[140px] sm:w-[160px] shrink-0"
            >
              <div className="aspect-square rounded-full overflow-hidden bg-surface shadow-poster">
                {p.profile_path ? (
                  <img
                    src={IMG(p.profile_path, "w300")!}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                    {p.name}
                  </div>
                )}
              </div>

              <p className="mt-2 text-center text-sm font-medium line-clamp-1 group-hover:text-primary">
                {p.name}
              </p>

              <p className="text-center text-xs text-muted-foreground line-clamp-1">
                {p.known_for_department}
              </p>
            </Link>
          ))}
    </Row>
  );
}

function TmdbRow({
  title,
  path,
  params,
  mediaType,
}: {
  title: string;
  path: string;
  params?: any;
  mediaType?: "movie" | "tv" | "all";
}) {
  const { data, isLoading } = useTmdb<any>([title, path, params], path, params);

  const items = useMemo(() => {
    const normalized = normalizeItems(data?.results || [], mediaType || "all");

    const unique = new Map<number, any>();

    normalized.forEach((item: any) => {
      if (!item?.id || !item?.poster_path) return;
      if (item.media_type === "person") return;
      if (!unique.has(item.id)) unique.set(item.id, item);
    });

    return Array.from(unique.values()).slice(0, 24);
  }, [data, mediaType]);

  return (
    <Row title={title}>
      {isLoading
        ? Array.from({ length: 10 }).map((_, i) => <PosterSkeleton key={i} />)
        : items.map((m: any, i: number) => (
            <MovieCard key={`${m.id}-${m.media_type || path}`} item={m} index={i} />
          ))}
    </Row>
  );
}

function Home() {
  return (
    <div className="space-y-14 pb-16 page-in">
      <Hero />

      <ReminderBanner />

      <TmdbRow title="Trending now" path="/trending/all/day" mediaType="all" />
      <TmdbRow title="Trending this week" path="/trending/all/week" mediaType="all" />

      <TmdbRow title="New movies in theaters" path="/movie/now_playing" mediaType="movie" />
      <TmdbRow title="Popular movies" path="/movie/popular" mediaType="movie" />
      <TmdbRow title="Top rated movies" path="/movie/top_rated" mediaType="movie" />
      <TmdbRow title="Coming soon" path="/movie/upcoming" mediaType="movie" />

      <TmdbRow title="Popular TV shows" path="/tv/popular" mediaType="tv" />
      <TmdbRow title="Top rated TV shows" path="/tv/top_rated" mediaType="tv" />
      <TmdbRow title="Airing today" path="/tv/airing_today" mediaType="tv" />
      <TmdbRow title="On TV this week" path="/tv/on_the_air" mediaType="tv" />

      <TmdbRow
        title="Action movies"
        path="/discover/movie"
        mediaType="movie"
        params={{
          sort_by: "popularity.desc",
          with_genres: 28,
          include_adult: false,
        }}
      />

      <TmdbRow
        title="Comedy movies"
        path="/discover/movie"
        mediaType="movie"
        params={{
          sort_by: "popularity.desc",
          with_genres: 35,
          include_adult: false,
        }}
      />

      <TmdbRow
        title="Drama TV shows"
        path="/discover/tv"
        mediaType="tv"
        params={{
          sort_by: "popularity.desc",
          with_genres: 18,
          include_adult: false,
        }}
      />

      <TmdbRow
        title="Sci-fi and fantasy"
        path="/discover/tv"
        mediaType="tv"
        params={{
          sort_by: "popularity.desc",
          with_genres: 10765,
          include_adult: false,
        }}
      />

      <PersonRow />
    </div>
  );
}