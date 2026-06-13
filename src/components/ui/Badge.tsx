import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/scoring";

export type BadgeTone =
  | "neutral"
  | "sage"
  | "ocean"
  | "clay"
  | "positive"
  | "warning"
  | "negative"
  | "info";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-secondary border-border-strong/60",
  sage: "bg-sage-soft text-sage-deep border-sage/30",
  ocean: "bg-ocean-soft text-[#3f5258] border-ocean/30",
  clay: "bg-clay-soft text-[#8a5236] border-clay/30",
  positive: "bg-[#e6efe4] text-[#3f5a3b] border-positive/30",
  warning: "bg-[#f6ecd5] text-[#8a6a23] border-warning/30",
  negative: "bg-[#f3e0db] text-[#8a463a] border-negative/30",
  info: "bg-ocean-soft text-[#3f5258] border-info/30",
};

export function Badge({
  tone = "neutral",
  className,
  dot,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none tracking-wide whitespace-nowrap",
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {props.children}
    </span>
  );
}

/** Maps a domain status string to a toned badge. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusTone(status) as BadgeTone;
  return (
    <Badge tone={tone} dot className={className}>
      {status}
    </Badge>
  );
}
