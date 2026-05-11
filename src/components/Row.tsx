import { type ReactNode, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Row({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <section className={cn("relative", className)}>
      <div className="flex items-end justify-between mb-4 px-4 sm:px-6 lg:px-10">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          {action}
          <div className="hidden md:flex gap-1">
            <button
              onClick={() => scroll(-1)}
              className="h-9 w-9 rounded-full glass hover:bg-surface-2 transition flex items-center justify-center"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="h-9 w-9 rounded-full glass hover:bg-surface-2 transition flex items-center justify-center"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div ref={ref} className="row-scroll flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-10 pb-2 snap-x">
        {children}
      </div>
    </section>
  );
}
