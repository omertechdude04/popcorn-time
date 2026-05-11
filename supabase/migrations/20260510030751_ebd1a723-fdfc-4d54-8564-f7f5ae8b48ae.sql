
-- profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  region text default 'US',
  favorite_genres int[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

-- generic media reference: tmdb_id + media_type ('movie' | 'tv')
-- watchlist
create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  title text,
  poster_path text,
  release_date text,
  vote_average numeric,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);
alter table public.watchlist enable row level security;
create policy "watchlist_own_all" on public.watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- favorites
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  title text,
  poster_path text,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);
alter table public.favorites enable row level security;
create policy "favorites_own_all" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- watched
create table public.watched (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  title text,
  poster_path text,
  watched_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);
alter table public.watched enable row level security;
create policy "watched_own_all" on public.watched for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ratings
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  rating numeric not null check (rating >= 0.5 and rating <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);
alter table public.ratings enable row level security;
create policy "ratings_select_all" on public.ratings for select using (true);
create policy "ratings_insert_own" on public.ratings for insert with check (auth.uid() = user_id);
create policy "ratings_update_own" on public.ratings for update using (auth.uid() = user_id);
create policy "ratings_delete_own" on public.ratings for delete using (auth.uid() = user_id);

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  title text,
  poster_path text,
  rating numeric check (rating >= 0.5 and rating <= 10),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie','tv')),
  title text,
  poster_path text,
  event_type text not null,
  event_date date,
  platform text,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type, event_type)
);
alter table public.reminders enable row level security;
create policy "reminders_own_all" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.update_updated_at_column();
create trigger trg_ratings_updated before update on public.ratings
for each row execute function public.update_updated_at_column();
create trigger trg_reviews_updated before update on public.reviews
for each row execute function public.update_updated_at_column();

-- profile auto-create on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
