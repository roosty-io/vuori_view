import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, TooltipShell, axisProps } from "./chartUtils";
import type { WaterfallItem } from "@/data/calculations";
import { compactCurrency } from "@/lib/formatters";

export function WaterfallChart({ items, height = 280 }: { items: WaterfallItem[]; height?: number }) {
  let running = 0;
  const rows = items.map((it) => {
    if (it.type === "start") {
      running = it.value;
      return { name: it.name, base: 0, bar: it.value, kind: "total" as const, raw: it.value };
    }
    if (it.type === "end") {
      return { name: it.name, base: 0, bar: it.value, kind: "total" as const, raw: it.value };
    }
    const start = running;
    running += it.value;
    const base = Math.min(start, running);
    return { name: it.name, base, bar: Math.abs(it.value), kind: it.value >= 0 ? ("up" as const) : ("down" as const), raw: it.value };
  });

  const color = (k: "total" | "up" | "down") => (k === "total" ? CHART.ink : k === "up" ? CHART.sage : CHART.clay);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 18, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="name" {...axisProps} interval={0} tick={{ fill: CHART.muted, fontSize: 10.5 }} />
        <YAxis {...axisProps} width={48} tickFormatter={(v: number) => compactCurrency(v)} />
        <Tooltip
          cursor={{ fill: CHART.grid, fillOpacity: 0.25 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof rows)[number];
            return (
              <TooltipShell
                title={p.name}
                rows={[
                  {
                    label: p.kind === "total" ? "Total" : p.kind === "up" ? "Contribution" : "Drag",
                    value: (p.raw >= 0 ? "" : "−") + compactCurrency(Math.abs(p.raw)),
                    color: color(p.kind),
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="bar" stackId="w" radius={[3, 3, 0, 0]} maxBarSize={64}>
          {rows.map((r, i) => (
            <Cell key={i} fill={color(r.kind)} />
          ))}
          <LabelList
            dataKey="raw"
            position="top"
            formatter={(v: number) => (v >= 0 ? "+" : "−") + compactCurrency(Math.abs(v))}
            style={{ fill: CHART.muted, fontSize: 10, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
