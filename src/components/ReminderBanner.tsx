import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Tv, Film, Calendar, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { IMG } from "@/lib/tmdb";

type Reminder = {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string | null;
  poster_path: string | null;
  event_type: string;
  event_date: string | null;
  platform: string | null;
};

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function describe(r: Reminder): string {
  const days = daysUntil(r.event_date);
  const when =
    days === null ? "soon"
    : days === 0 ? "today"
    : days === 1 ? "tomorrow"
    : days < 0 ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
    : `in ${days} day${days === 1 ? "" : "s"}`;

  const where = r.platform ? ` on ${r.platform}` : "";
  switch (r.event_type) {
    case "episode":
      return `New episode of ${r.title} airs ${when}${where}.`;
    case "season":
      return `${r.title} returns with a new season ${when}${where}.`;
    case "theatrical":
      return `${r.title} releases in theaters ${when}.`;
    case "digital":
      return `${r.title} arrives on digital ${when}${where}.`;
    default:
      return `${r.title} — ${when}${where}.`;
  }
}

function iconFor(type: string) {
  if (type === "theatrical") return Film;
  if (type === "digital") return Calendar;
  return Tv;
}

export function ReminderBanner() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setReminders([]);
      setLoaded(true);
      return;
    }
    let active = true;
    supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true, nullsFirst: false })
      .limit(8)
      .then(({ data }) => {
        if (!active) return;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = (data || []).filter((r) => {
          if (!r.event_date) return true;
          const d = new Date(r.event_date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() >= now.getTime();
        });
        setReminders(upcoming as Reminder[]);
        setLoaded(true);
      });
    return () => { active = false; };
  }, [user]);

  if (!user || !loaded || reminders.length === 0) return null;

  return (
    <section className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 -mt-20 sm:-mt-28 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="glass rounded-2xl p-5 sm:p-6 border-primary/20"
        style={{ boxShadow: "0 0 80px -20px oklch(0.66 0.23 32 / 0.35), 0 0 60px -20px oklch(0.58 0.18 258 / 0.3)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-ember flex items-center justify-center shadow-glow">
              <Bell className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-base sm:text-lg">Your reminders</h2>
              <p className="text-xs text-muted-foreground">Coming up on your watchlist</p>
            </div>
          </div>
          <Link to="/profile" className="text-xs font-medium text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            Manage <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {reminders.slice(0, 6).map((r, i) => {
              const Icon = iconFor(r.event_type);
              const to = r.media_type === "movie" ? "/movie/$id" : "/tv/$id";
              const days = daysUntil(r.event_date);
              const urgent = days !== null && days <= 3;
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                >
                  <Link
                    to={to}
                    params={{ id: String(r.tmdb_id) }}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-surface/60 hover:bg-surface-2 border border-border/40 transition-all hover:border-primary/40 hover:-translate-y-0.5"
                  >
                    {r.poster_path ? (
                      <img
                        src={IMG(r.poster_path, "w200")!}
                        alt=""
                        className="h-16 w-12 rounded-md object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-12 rounded-md bg-surface-2 grid place-items-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug line-clamp-2 ${urgent ? "text-foreground" : "text-foreground/90"}`}>
                        {describe(r)}
                      </p>
                      {urgent && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Soon
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
