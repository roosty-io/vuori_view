import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
} from "recharts";
import { CHART, TooltipShell, axisProps } from "./chartUtils";
import type { MarketSignal } from "@/data/types";
import { compactCurrency } from "@/lib/formatters";

export function MarketBubbleChart({
  markets,
  height = 360,
  onSelect,
}: {
  markets: MarketSignal[];
  height?: number;
  onSelect?: (market: string) => void;
}) {
  const data = markets.map((m) => ({
    x: m.competitorIntensityIndex,
    y: m.searchDemandIndex,
    z: m.ecommerceRevenue,
    name: m.market,
    score: m.opportunityScore,
  }));

  const color = (score: number) =>
    score >= 85 ? CHART.sage : score >= 75 ? "#8a9a7e" : score >= 65 ? CHART.ocean : CHART.muted;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 16, right: 20, left: 4, bottom: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name="Competition"
          {...axisProps}
          domain={[15, 90]}
          label={{ value: "Competitor intensity →", position: "insideBottom", offset: -8, fill: CHART.muted, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Demand"
          {...axisProps}
          domain={[70, 170]}
          width={40}
          label={{ value: "Search demand", angle: -90, position: "insideLeft", fill: CHART.muted, fontSize: 11 }}
        />
        <ZAxis type="number" dataKey="z" range={[120, 1400]} name="Revenue" />
        <ReferenceLine x={55} stroke={CHART.grid} strokeDasharray="4 4" />
        <ReferenceLine y={120} stroke={CHART.grid} strokeDasharray="4 4" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof data)[number];
            return (
              <TooltipShell
                title={p.name}
                rows={[
                  { label: "Opportunity score", value: String(p.score), color: color(p.score) },
                  { label: "Search demand", value: String(p.y) },
                  { label: "Competitor intensity", value: String(p.x) },
                  { label: "Ecommerce revenue", value: compactCurrency(p.z) },
                ]}
                footer="Bubble size = ecommerce revenue · upper-left = high demand, low competition"
              />
            );
          }}
        />
        <Scatter data={data} onClick={(d: { name?: string }) => d?.name && onSelect?.(d.name)} cursor={onSelect ? "pointer" : "default"}>
          {data.map((d, i) => (
            <Cell key={i} fill={color(d.score)} fillOpacity={0.8} stroke={color(d.score)} strokeWidth={1} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
