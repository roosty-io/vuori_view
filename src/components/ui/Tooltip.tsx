import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Lightweight CSS hover tooltip — no portal, no dependency. */
export function Tooltip({
  content,
  children,
  className,
  side = "top",
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-[260px] -translate-x-1/2 rounded-lg border border-border bg-ink px-2.5 py-1.5 text-[12px] font-normal leading-snug text-canvas opacity-0 shadow-float transition-opacity duration-150 group-hover/tip:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        )}
      >
        {content}
      </span>
    </span>
  );
}

/** Inline info dot that reveals a tooltip on hover. */
export function InfoHint({ content, className }: { content: ReactNode; className?: string }) {
  return (
    <Tooltip content={content}>
      <Info className={cn("h-3.5 w-3.5 cursor-help text-ink-muted hover:text-ink-secondary", className)} />
    </Tooltip>
  );
}
