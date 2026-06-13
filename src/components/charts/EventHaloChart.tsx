import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, TooltipShell, axisProps } from "./chartUtils";
import { compactCurrency, currency } from "@/lib/formatters";

/** 0–90 day ecommerce halo curve following an activation. */
export function EventHaloChart({
  eventRevenue,
  halo90,
  height = 240,
}: {
  eventRevenue: number;
  halo90: number;
  height?: number;
}) {
  // Distribute halo across 90 days with exponential decay (sums ≈ halo90).
  const decay = 0.045;
  const weights = Array.from({ length: 91 }, (_, d) => (d === 0 ? 0 : Math.exp(-decay * d)));
  const wsum = weights.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  const data = weights.map((w, d) => {
    const daily = d === 0 ? eventRevenue : (w / wsum) * halo90;
    cumulative += daily;
    return { day: d, daily: Math.round(daily), cumulative: Math.round(cumulative) };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="haloFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.sage} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART.sage} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" {...axisProps} tickFormatter={(v: number) => `D${v}`} ticks={[0, 30, 60, 90]} />
        <YAxis {...axisProps} width={46} tickFormatter={(v: number) => compactCurrency(v)} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof data)[number];
            return (
              <TooltipShell
                title={`Day ${p.day}`}
                rows={[
                  { label: p.day === 0 ? "Event-period revenue" : "Daily halo revenue", value: currency(p.daily), color: CHART.sage },
                  { label: "Cumulative", value: currency(p.cumulative), color: CHART.clay },
                ]}
              />
            );
          }}
        />
        <ReferenceLine x={30} stroke={CHART.grid} strokeDasharray="3 3" />
        <ReferenceLine x={60} stroke={CHART.grid} strokeDasharray="3 3" />
        <Area dataKey="daily" stroke={CHART.sage} strokeWidth={2} fill="url(#haloFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
