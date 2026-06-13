import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "./Card";
import { Sparkline } from "./Sparkline";
import { InfoHint } from "./Tooltip";
import { Badge, type BadgeTone } from "./Badge";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string;
  delta?: number; // signed percent
  deltaLabel?: string;
  /** Direction of "good": when delta is negative but lower-is-better, set invert. */
  invert?: boolean;
  status?: { label: string; tone: BadgeTone };
  sparkline?: number[];
  sparklineTone?: string;
  tooltip?: string;
  className?: string;
  accent?: "sage" | "ocean" | "clay";
}

export function MetricCard({
  title,
  value,
  delta,
  deltaLabel,
  invert = false,
  status,
  sparkline,
  sparklineTone = "var(--sage)",
  tooltip,
  className,
  accent = "sage",
}: MetricCardProps) {
  const hasDelta = typeof delta === "number";
  const positive = hasDelta ? (invert ? delta! < 0 : delta! > 0) : false;
  const neutral = hasDelta && Math.abs(delta!) < 0.05;
  const deltaTone = neutral ? "text-ink-muted" : positive ? "text-positive" : "text-negative";
  const DeltaIcon = neutral ? Minus : delta! > 0 ? ArrowUpRight : ArrowDownRight;
  const accentBar =
    accent === "ocean" ? "before:bg-ocean" : accent === "clay" ? "before:bg-clay" : "before:bg-sage";

  return (
    <Card
      hover
      className={cn(
        "relative overflow-hidden p-4 before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:opacity-70 before:content-['']",
        accentBar,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">{title}</span>
          {tooltip && <InfoHint content={tooltip} />}
        </div>
        {status && (
          <Badge tone={status.tone} className="text-[10px]">
            {status.label}
          </Badge>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="tabular text-[26px] font-semibold leading-none text-ink animate-fade-in">{value}</div>
          {hasDelta && (
            <div className={cn("mt-1.5 flex items-center gap-1 text-[12px] font-medium", deltaTone)}>
              <DeltaIcon className="h-3.5 w-3.5" />
              <span className="tabular">
                {delta! > 0 ? "+" : ""}
                {delta!.toFixed(1)}%
              </span>
              {deltaLabel && <span className="font-normal text-ink-muted">{deltaLabel}</span>}
            </div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} tone={sparklineTone} className="mb-0.5 shrink-0" />
        )}
      </div>
    </Card>
  );
}
