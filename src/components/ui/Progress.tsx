import { cn } from "@/lib/utils";

type Tone = "sage" | "ocean" | "clay" | "positive" | "warning" | "negative" | "neutral";

const toneBg: Record<Tone, string> = {
  sage: "bg-sage",
  ocean: "bg-ocean",
  clay: "bg-clay",
  positive: "bg-positive",
  warning: "bg-warning",
  negative: "bg-negative",
  neutral: "bg-ink-muted",
};

export function Progress({
  value,
  max = 100,
  tone = "sage",
  className,
  size = "md",
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
  size?: "sm" | "md";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-2",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", toneBg[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Small score meter that auto-tones by value. */
export function ScoreMeter({ score, className }: { score: number; className?: string }) {
  const tone: Tone = score >= 80 ? "positive" : score >= 60 ? "sage" : score >= 40 ? "warning" : "negative";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress value={score} tone={tone} className="flex-1" />
      <span className="tabular w-9 text-right text-[13px] font-semibold text-ink">{Math.round(score)}</span>
    </div>
  );
}
