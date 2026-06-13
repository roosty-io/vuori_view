import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export interface HeatRow {
  label: string;
  emoji?: string;
  values: Record<string, number>;
}

const HUE = { sage: 95, ocean: 192, clay: 22 } as const;

/** Generic affinity heatmap (personas × colors, personas × products, etc.). */
export function ColorPreferenceHeatmap({
  rows,
  columns,
  tone = "sage",
  rowHeader = "Persona",
  unit = "",
  compact = false,
}: {
  rows: HeatRow[];
  columns: string[];
  tone?: keyof typeof HUE;
  rowHeader?: string;
  unit?: string;
  compact?: boolean;
}) {
  const hue = HUE[tone];
  const cell = (v: number) => {
    const t = Math.min(1, Math.max(0, v / 100));
    const light = 96 - t * 54;
    const sat = 14 + t * 14;
    return `hsl(${hue} ${sat}% ${light}%)`;
  };
  const text = (v: number) => (v > 55 ? "#fbfaf7" : "#4a463f");

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface px-2 pb-1 text-left text-[11px] font-medium text-ink-muted">
              {rowHeader}
            </th>
            {columns.map((c) => (
              <th
                key={c}
                className="px-1 pb-1 text-center text-[10.5px] font-medium text-ink-muted"
                style={{ minWidth: compact ? 44 : 56 }}
              >
                <span className="inline-block max-w-[64px] truncate align-bottom" title={c}>
                  {c}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="sticky left-0 z-10 bg-surface px-2 text-[12px] font-medium text-ink">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  {row.emoji && <span>{row.emoji}</span>}
                  {row.label}
                </span>
              </td>
              {columns.map((c) => {
                const v = row.values[c] ?? 0;
                return (
                  <td key={c} className="p-0">
                    <Tooltip content={`${row.label} · ${c}: ${v}${unit}`}>
                      <div
                        className={cn(
                          "flex items-center justify-center rounded text-[10.5px] font-semibold tabular transition-transform hover:scale-[1.08]",
                          compact ? "h-7" : "h-8",
                        )}
                        style={{ background: cell(v), color: text(v) }}
                      >
                        {v}
                      </div>
                    </Tooltip>
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
