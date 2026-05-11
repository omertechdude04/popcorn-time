import { Link } from "@tanstack/react-router";
import { IMG, type MediaItem, titleOf, yearOf, mediaTypeOf } from "@/lib/tmdb";
import { Star, Bookmark, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { item: MediaItem; className?: string; index?: number };

export function MovieCard({ item, className, index = 0 }: Props) {
  const type = mediaTypeOf(item);
  const id = item.id;
  const title = titleOf(item);
  const year = yearOf(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const poster = IMG(item.poster_path, "w500");

  return (
    <Link
      to={type === "movie" ? "/movie/$id" : "/tv/$id"}
      params={{ id: String(id) }}
      className={cn(
        "group relative block w-[160px] sm:w-[180px] md:w-[200px] shrink-0 rise-in",
        className
      )}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl bg-surface aspect-[2/3] shadow-poster">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs p-4 text-center">
            {title}
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="glass rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {type === "tv" ? "TV" : "Movie"}
          </span>
        </div>
        {rating && (
          <div className="absolute top-2 right-2 glass rounded-md px-1.5 py-0.5 text-[11px] font-semibold flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {rating}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <p className="text-xs text-balance line-clamp-3 text-foreground/90">
            {item.overview}
          </p>
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-muted-foreground">{year || "—"}</p>
      </div>
    </Link>
  );
}

export function PosterSkeleton() {
  return (
    <div className="w-[160px] sm:w-[180px] md:w-[200px] shrink-0">
      <div className="aspect-[2/3] rounded-xl bg-surface animate-pulse" />
      <div className="mt-2.5 h-3 w-3/4 rounded bg-surface animate-pulse" />
      <div className="mt-1.5 h-2.5 w-1/3 rounded bg-surface animate-pulse" />
    </div>
  );
}
