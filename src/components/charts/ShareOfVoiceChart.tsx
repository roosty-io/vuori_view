import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, TooltipShell, axisProps } from "./chartUtils";
import type { ShareOfVoiceRow } from "@/data/syntheticData";
import { percentRaw, signedPercent } from "@/lib/formatters";

export function ShareOfVoiceChart({ data, height = 300 }: { data: ShareOfVoiceRow[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
        <XAxis type="number" {...axisProps} tickFormatter={(v: number) => `${v}%`} domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="brand" {...axisProps} width={88} tick={{ fill: CHART.ink, fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: CHART.grid, fillOpacity: 0.25 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as ShareOfVoiceRow;
            return (
              <TooltipShell
                title={p.brand}
                rows={[
                  { label: "Share of voice", value: percentRaw(p.shareOfVoice) },
                  { label: "Velocity", value: signedPercent(p.velocity) },
                  { label: "Sentiment", value: p.sentiment.toFixed(2) },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="shareOfVoice" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.brand === "Vuori" ? CHART.clay : CHART.ocean} fillOpacity={d.brand === "Vuori" ? 1 : 0.65} />
          ))}
          <LabelList dataKey="shareOfVoice" position="right" formatter={(v: number) => `${v}%`} style={{ fill: CHART.muted, fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
