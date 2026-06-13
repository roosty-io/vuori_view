import type { CohortRow } from "@/data/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { compactNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/** Retention heatmap: cohorts (rows) × months-since-acquisition (cols). */
export function CohortHeatmap({ cohorts, maxMonths = 12 }: { cohorts: CohortRow[]; maxMonths?: number }) {
  const cols = Array.from({ length: maxMonths + 1 }, (_, i) => i);

  const cellColor = (v: number | undefined) => {
    if (v == null) return "transparent";
    // Sage scale: higher retention = deeper sage.
    const t = Math.min(1, v / 100);
    const light = 96 - t * 52; // lightness
    return `hsl(95 16% ${light}%)`;
  };
  const textColor = (v: number | undefined) => (v != null && v > 55 ? "#fbfaf7" : "#54624b");

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th className="sticky left-0 bg-surface px-2 text-left text-[11px] font-medium text-ink-muted">Cohort</th>
            <th className="px-1 text-[11px] font-medium text-ink-muted">Size</th>
            {cols.map((c) => (
              <th key={c} className="px-1 text-center text-[11px] font-medium text-ink-muted">
                M{c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((row) => (
            <tr key={row.cohort}>
              <td className="sticky left-0 bg-surface px-2 text-[12px] font-medium text-ink">{row.cohort}</td>
              <td className="tabular px-1 text-right text-[11px] text-ink-secondary">{compactNumber(row.size)}</td>
              {cols.map((c) => {
                const v = row.retention[c];
                return (
                  <td key={c} className="p-0">
                    {v != null ? (
                      <Tooltip content={`${row.cohort} · Month ${c}: ${v.toFixed(1)}% retained`}>
                        <div
                          className={cn(
                            "flex h-7 w-9 items-center justify-center rounded text-[10.5px] font-semibold tabular transition-transform hover:scale-105",
                          )}
                          style={{ background: cellColor(v), color: textColor(v) }}
                        >
                          {c === 0 ? "100" : v.toFixed(0)}
                        </div>
                      </Tooltip>
                    ) : (
                      <div className="h-7 w-9 rounded bg-surface-2/40" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
