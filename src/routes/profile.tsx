import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { MovieCard } from "@/components/MovieCard";
import { Star, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Popcorn Time" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [region, setRegion] = useState("US");
  const [emailReminders, setEmailReminders] = useState(true);
  const [leadDays, setLeadDays] = useState(7);
  const [notifyEpisodes, setNotifyEpisodes] = useState(true);
  const [notifyReleases, setNotifyReleases] = useState(true);

  const [favorites, setFavorites] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.display_name || "");
          setBio(data.bio || "");
          setRegion(data.region || "US");
          setEmailReminders(data.email_reminders_enabled ?? true);
          setLeadDays(data.reminder_lead_days ?? 7);
          setNotifyEpisodes(data.notify_new_episodes ?? true);
          setNotifyReleases(data.notify_releases ?? true);
        }
      });

    supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => setFavorites(data || []));

    supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data || []));

    supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true })
      .then(({ data }) => setReminders(data || []));
  }, [user]);

  if (loading) return <div className="pt-24 px-6">…</div>;

  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to see your profile</h1>
          <Link
            to="/login"
            className="mt-4 inline-flex px-5 py-2.5 rounded-full gradient-ember text-primary-foreground font-semibold shadow-glow"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const save = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        bio,
        region,
        email_reminders_enabled: emailReminders,
        reminder_lead_days: leadDays,
        notify_new_episodes: notifyEpisodes,
        notify_releases: notifyReleases,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Settings saved");
    }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
    toast.success("Reminder removed");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-10 pt-24"
    >
      <div className="flex flex-wrap items-center gap-5">
        <div className="h-20 w-20 rounded-full gradient-ember grid place-items-center text-2xl font-bold text-primary-foreground shadow-glow">
          {(name || user.email || "?").slice(0, 1).toUpperCase()}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{name || user.email}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <button
          onClick={() => signOut()}
          className="px-4 py-2 rounded-full glass text-sm hover:bg-surface-2 transition"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 lg:col-span-1 h-fit space-y-6">
          <div className="space-y-3 text-sm">
            <h2 className="font-semibold">Profile</h2>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="mt-1.5 w-full bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none transition"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1.5 w-full bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {["US", "GB", "CA", "AU", "FR", "DE", "ES", "IT", "BR", "MX", "JP", "KR", "IN"].map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  )
                )}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Used for "Where to watch" availability.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Notifications</h2>
            </div>

            <Toggle
              label="Daily email reminders"
              hint={user.email || undefined}
              checked={emailReminders}
              onChange={setEmailReminders}
            />

            <Toggle
              label="New episode alerts"
              checked={notifyEpisodes}
              onChange={setNotifyEpisodes}
            />

            <Toggle
              label="Release date alerts"
              checked={notifyReleases}
              onChange={setNotifyReleases}
            />

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Remind me starting
              </label>
              <select
                value={leadDays}
                onChange={(e) => setLeadDays(Number(e.target.value))}
                className="mt-1.5 w-full bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[1, 3, 5, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>
                    {d} day{d === 1 ? "" : "s"} before
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={save}
            className="w-full py-2.5 rounded-lg gradient-ember text-primary-foreground text-sm font-semibold shadow-glow hover:opacity-95 transition"
          >
            Save changes
          </button>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Section title="Reminders" empty="No reminders yet. Set one from any movie or show.">
            {reminders.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 transition border border-border/40"
                  >
                    {r.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${r.poster_path}`}
                        alt={r.title || "Reminder poster"}
                        className="h-16 w-12 rounded object-cover"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.event_date
                          ? new Date(r.event_date).toLocaleDateString()
                          : "Date to be announced"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteReminder(r.id)}
                      className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
                      aria-label="Remove reminder"
                      title="Remove reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Your reviews" empty="You haven't written a review yet.">
            {reviews.length > 0 && (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="glass rounded-xl p-4 flex gap-3 border border-border/40"
                  >
                    {r.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${r.poster_path}`}
                        alt={r.title || "Review poster"}
                        className="h-20 w-14 rounded object-cover"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{r.title}</p>
                        {r.rating && (
                          <span className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            {r.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-3 mt-1">
                        {r.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Favorites" empty="No favorites yet.">
            {favorites.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6">
                {favorites.slice(0, 10).map((f, i) => (
                  <div key={f.id} className="w-full">
                    <MovieCard
                      item={{
                        id: f.tmdb_id,
                        title: f.title,
                        poster_path: f.poster_path,
                        media_type: f.media_type,
                      }}
                      className="!w-full"
                      index={i}
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </motion.div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 py-1.5 text-left"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-surface-2"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>

      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && (
          <span className="block text-[11px] text-muted-foreground truncate">
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren =
    children !== null &&
    children !== undefined &&
    children !== false;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {hasChildren ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}