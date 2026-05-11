import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Film } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Popcorn Time" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav({ to: "/" }); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name || email.split("@")[0] },
        },
      });
      if (error) toast.error(error.message);
      else toast.success("Account created — you're in!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-display font-bold text-xl mb-8">
          <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center"><Film className="h-4 w-4 text-primary-foreground" /></div>
          Popcorn Time
        </Link>
        <div className="glass rounded-3xl p-8 shadow-poster">
          <h1 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{mode === "signin" ? "Sign in to save titles, rate, and review." : "Build your watchlist and discover more."}</p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            )}
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" minLength={6} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition">
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-medium hover:underline">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
