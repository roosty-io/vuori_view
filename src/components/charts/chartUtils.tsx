import type { ReactNode } from "react";

export const CHART = {
  sage: "#6f7f64",
  sageDeep: "#54624b",
  ocean: "#6f8a91",
  clay: "#b87955",
  positive: "#5e7d5a",
  warning: "#c59a4a",
  negative: "#b46a5d",
  ink: "#25231f",
  muted: "#8a8175",
  grid: "#ddd3c3",
  surface: "#fbfaf7",
};

/** Ordered categorical palette (calm, warm, brand-adjacent). */
export const SERIES_COLORS = [
  CHART.sage,
  CHART.ocean,
  CHART.clay,
  "#9aa386", // light sage
  "#a7b9bd", // light ocean
  "#d6a98c", // light clay
  "#7c7468",
];

export const axisProps = {
  stroke: CHART.grid,
  tick: { fill: CHART.muted, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
} as const;

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

/** Shared styled tooltip body. */
export function TooltipShell({ title, rows, footer }: { title?: string; rows: TooltipRow[]; footer?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-float">
      {title && <div className="mb-1.5 text-[12px] font-semibold text-ink">{title}</div>}
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-ink-secondary">
              {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
              {r.label}
            </span>
            <span className="tabular font-semibold text-ink">{r.value}</span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-1.5 border-t border-border pt-1.5 text-[11px] text-ink-muted">{footer}</div>}
    </div>
  );
}
