import { tmdbFetch } from "./tmdb.functions";

export const IMG = (path: string | null | undefined, size: "w200" | "w300" | "w500" | "w780" | "original" = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export type MediaItem = {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
  genre_ids?: number[];
  known_for_department?: string;
};

export const tmdb = {
  call: <T = any>(path: string, params?: Record<string, any>) =>
    tmdbFetch({ data: { path, params } }) as Promise<T>,
};

export const yearOf = (m: MediaItem) => {
  const d = m.release_date || m.first_air_date;
  return d ? d.slice(0, 4) : "";
};
export const titleOf = (m: MediaItem) => m.title || m.name || "";
export const mediaTypeOf = (m: MediaItem): "movie" | "tv" =>
  (m.media_type as any) || (m.first_air_date ? "tv" : "movie");
