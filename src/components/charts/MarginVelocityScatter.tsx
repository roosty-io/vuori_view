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
import type { Product } from "@/data/types";
import { compactCurrency, percent } from "@/lib/formatters";

const RECO_COLOR: Record<Product["recommendation"], string> = {
  Push: CHART.sage,
  Replenish: CHART.ocean,
  Localize: CHART.clay,
  Protect: CHART.warning,
  Hold: CHART.muted,
};

export function MarginVelocityScatter({ products, height = 340 }: { products: Product[]; height?: number }) {
  const data = products.map((p) => ({
    x: p.velocity,
    y: p.marginRate * 100,
    z: p.revenue,
    name: p.productName,
    reco: p.recommendation,
    returnRate: p.returnRate,
  }));
  const avgVel = data.reduce((s, d) => s + d.x, 0) / data.length;
  const avgMargin = data.reduce((s, d) => s + d.y, 0) / data.length;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 16, right: 20, left: 4, bottom: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          {...axisProps}
          name="Velocity"
          label={{ value: "Sell-through velocity (units/wk) →", position: "insideBottom", offset: -8, fill: CHART.muted, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          {...axisProps}
          width={44}
          domain={[50, 70]}
          tickFormatter={(v: number) => `${v}%`}
          label={{ value: "Gross margin", angle: -90, position: "insideLeft", fill: CHART.muted, fontSize: 11 }}
        />
        <ZAxis type="number" dataKey="z" range={[80, 900]} name="Revenue" />
        <ReferenceLine x={avgVel} stroke={CHART.grid} strokeDasharray="4 4" />
        <ReferenceLine y={avgMargin} stroke={CHART.grid} strokeDasharray="4 4" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof data)[number];
            return (
              <TooltipShell
                title={p.name}
                rows={[
                  { label: "Recommendation", value: p.reco, color: RECO_COLOR[p.reco] },
                  { label: "Velocity", value: `${p.x}/wk` },
                  { label: "Gross margin", value: `${p.y.toFixed(0)}%` },
                  { label: "Revenue", value: compactCurrency(p.z) },
                  { label: "Return rate", value: percent(p.returnRate, 0) },
                ]}
              />
            );
          }}
        />
        <Scatter data={data}>
          {data.map((d, i) => (
            <Cell key={i} fill={RECO_COLOR[d.reco]} fillOpacity={0.78} stroke={RECO_COLOR[d.reco]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
