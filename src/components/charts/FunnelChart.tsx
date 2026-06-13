import type { FunnelStage } from "@/data/types";
import { CHART } from "./chartUtils";
import { compactNumber, percentRaw } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/** Custom funnel: centered tapering bars with step-conversion callouts. */
export function FunnelChart({ stages, className }: { stages: FunnelStage[]; className?: string }) {
  const max = stages[0]?.value ?? 1;
  const palette = [CHART.sage, "#7b8a70", CHART.ocean, "#88989d", CHART.clay];

  return (
    <div className={cn("space-y-1.5", className)}>
      {stages.map((s, i) => {
        const width = Math.max(14, (s.value / max) * 100);
        const overall = (s.value / max) * 100;
        return (
          <div key={s.stage} className="group">
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-medium text-ink">{s.stage}</span>
              <span className="flex items-center gap-2 text-ink-secondary">
                <span className="tabular font-semibold text-ink">{compactNumber(s.value)}</span>
                <span className="tabular text-ink-muted">{percentRaw(overall, 0)} of top</span>
              </span>
            </div>
            <div className="flex items-center justify-center">
              <div
                className="relative h-9 rounded-md transition-all duration-500 group-hover:brightness-105"
                style={{ width: `${width}%`, background: palette[i % palette.length] }}
              >
                {i > 0 && (
                  <span className="absolute -top-0 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-secondary shadow-sm sm:block">
                    {percentRaw(s.conversionFromPrev, 1)} ↓
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
