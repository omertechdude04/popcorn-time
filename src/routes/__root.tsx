import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LoadingScreen } from "@/components/LoadingScreen";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-20">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn't find that title.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-20">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Please try again."}
        </p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Popcorn Time — Movies & TV worth watching" },
      {
        name: "description",
        content:
          "Discover trending movies and TV shows, build your watchlist, and find your next favorite story.",
      },
      { name: "theme-color", content: "#1a1a1f" },
      {
        property: "og:title",
        content: "Popcorn Time — Movies & TV worth watching",
      },
      {
        property: "og:description",
        content:
          "Discover trending movies and TV shows, build your watchlist, and find your next favorite story.",
      },
      { property: "og:type", content: "website" },
      {
        name: "twitter:title",
        content: "Popcorn Time — Movies & TV worth watching",
      },
      {
        name: "twitter:description",
        content:
          "Discover trending movies and TV shows, build your watchlist, and find your next favorite story.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8f97e243-8e97-4b2a-b020-5ccc8478ecc1/id-preview-a904c907--014e1b45-5ce6-4e31-8303-f14c4b5ae751.lovable.app-1778382974522.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8f97e243-8e97-4b2a-b020-5ccc8478ecc1/id-preview-a904c907--014e1b45-5ce6-4e31-8303-f14c4b5ae751.lovable.app-1778382974522.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://image.tmdb.org" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInitialLoading(false);
    }, 1300);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          {initialLoading && <LoadingScreen />}

          <Navbar />

          <main className="pt-20">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>

          <Footer />
        </div>

        <Toaster theme="dark" position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    setRouteLoading(true);

    const timer = window.setTimeout(() => {
      setRouteLoading(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [path]);

  return (
    <>
      {routeLoading && <LoadingScreen />}

      <div key={path} className="page-in">
        {children}
      </div>
    </>
  );
}