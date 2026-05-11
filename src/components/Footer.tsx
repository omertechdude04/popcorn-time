export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-10 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-display font-semibold text-foreground">
          Popcorn Time
        </p>

        <p>Discover something worth watching tonight.</p>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs">
          <p>© {new Date().getFullYear()} Popcorn Time</p>

          <p>
            Made by{" "}
            <a
              href="https://www.omertechdude.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-accent transition-colors font-semibold"
            >
              omertechdude
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}