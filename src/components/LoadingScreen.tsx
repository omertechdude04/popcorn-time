import logo from "@/assets/logo-new.png";

export function LoadingScreen({ fullScreen = true }: { fullScreen?: boolean }) {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-[9999] flex items-center justify-center bg-background"
          : "flex min-h-[50vh] items-center justify-center bg-background"
      }
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />

          <img
            src={logo}
            alt="Popcorn Time"
            className="relative h-24 w-auto object-contain drop-shadow-[0_0_24px_oklch(0.66_0.23_32/0.55)] animate-pulse"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>

        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Loading
        </p>
      </div>
    </div>
  );
}