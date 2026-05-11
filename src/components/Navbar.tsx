import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Menu, X, User as UserIcon, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-new.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/tv", label: "TV Shows" },
  { to: "/search", label: "Search" },
  { to: "/watchlist", label: "Watchlist" },
] as const;

export function Navbar() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) nav({ to: "/search", search: { q: q.trim() } });
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled || path !== "/" ? "glass border-b border-border/50" : "bg-transparent"
      )}
    >
      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 h-20 flex items-center gap-6">
        {/* Center logo */}
        <Link
          to="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shrink-0 group z-20"
          aria-label="Popcorn Time Home"
        >
          <motion.img
            src={logo}
            alt="Popcorn Time"
            width={160}
            height={70}
            className="h-16 w-auto object-contain drop-shadow-[0_0_12px_oklch(0.66_0.23_32/0.5)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ rotate: -4, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          />
        </Link>

        {/* Left nav */}
        <nav className="hidden md:flex items-center gap-1 relative z-10">
          {links.map((l) => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);

            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "relative px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent"
                    transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right search */}
        <form
          onSubmit={submit}
          className="ml-auto hidden sm:flex items-center max-w-xs flex-1 z-10"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search movies, shows, people…"
              className="w-full bg-surface/70 border border-border/60 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/70 transition-all focus:bg-surface"
            />
          </div>
        </form>

        {/* Right account buttons */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0 z-10">
          {user ? (
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/profile"
                className="h-9 w-9 rounded-full glass hover:bg-surface-2 flex items-center justify-center transition-transform hover:scale-105"
                aria-label="Profile"
              >
                <UserIcon className="h-4 w-4" />
              </Link>

              <button
                onClick={() => signOut()}
                className="h-9 w-9 rounded-full glass hover:bg-surface-2 flex items-center justify-center transition-transform hover:scale-105"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full gradient-ember text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-glow"
            >
              Sign in
            </Link>
          )}

          <button
            className="md:hidden h-9 w-9 rounded-full glass flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden glass border-t border-border/50 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              <form onSubmit={submit} className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-surface border border-border rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </form>

              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="block px-3 py-2 rounded-lg text-sm hover:bg-surface"
                >
                  {l.label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-lg text-sm hover:bg-surface"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-primary"
                >
                  Sign in
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}