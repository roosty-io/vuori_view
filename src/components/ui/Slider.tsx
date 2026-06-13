import { cn } from "@/lib/utils";

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  hint?: string;
  className?: string;
  tone?: "sage" | "ocean" | "clay";
  /** Show a leading + for positive values (use for signed deltas). */
  signed?: boolean;
}

const accent: Record<NonNullable<SliderProps["tone"]>, string> = {
  sage: "accent-sage",
  ocean: "accent-ocean",
  clay: "accent-clay",
};

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  prefix = "",
  hint,
  className,
  tone = "sage",
  signed = false,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = `${prefix}${signed && value > 0 ? "+" : ""}${value}${suffix}`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span
          className={cn(
            "tabular rounded-md px-1.5 py-0.5 text-[12px] font-semibold",
            value === 0 ? "text-ink-muted" : "bg-sage-soft text-sage-deep",
          )}
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("h-1.5 w-full cursor-pointer appearance-none rounded-full", accent[tone])}
        style={{
          background: `linear-gradient(to right, var(--${tone}) 0%, var(--${tone}) ${pct}%, var(--surface-2) ${pct}%, var(--surface-2) 100%)`,
        }}
      />
      {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
    </div>
  );
}
