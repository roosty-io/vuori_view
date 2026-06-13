import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { CHART, TooltipShell, axisProps } from "./chartUtils";
import type { TimelinePoint } from "@/data/syntheticData";
import { compactCurrency, currency } from "@/lib/formatters";

interface Props {
  data: TimelinePoint[];
  height?: number;
  showPlan?: boolean;
  showBand?: boolean;
  bestCase?: number; // multiplier on forecast for future, e.g. 1.12
  worstCase?: number; // e.g. 0.9
}

export function RevenueForecastChart({
  data,
  height = 300,
  showPlan = true,
  showBand = true,
  bestCase,
  worstCase,
}: Props) {
  const firstFutureIdx = data.findIndex((d) => d.isFuture);
  const boundaryDate = firstFutureIdx > 0 ? data[firstFutureIdx].date : undefined;

  const rows = data.map((d) => ({
    ...d,
    _bandBase: showBand ? d.lower : 0,
    _bandSize: showBand ? d.upper - d.lower : 0,
    best: bestCase && d.isFuture ? Math.round(d.forecast * bestCase) : null,
    worst: worstCase && d.isFuture ? Math.round(d.forecast * worstCase) : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.ocean} stopOpacity={0.18} />
            <stop offset="100%" stopColor={CHART.ocean} stopOpacity={0.06} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          {...axisProps}
          minTickGap={42}
          tickFormatter={(v: string) => format(parseISO(v), "MMM ''yy")}
        />
        <YAxis {...axisProps} width={48} tickFormatter={(v: number) => compactCurrency(v)} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof rows)[number];
            const rowsT = [
              p.actual != null ? { label: "Actual", value: currency(p.actual), color: CHART.sage } : null,
              { label: "Forecast", value: currency(p.forecast), color: CHART.clay },
              showPlan ? { label: "Plan", value: currency(p.plan), color: CHART.muted } : null,
              p.best != null ? { label: "Best case", value: currency(p.best), color: CHART.positive } : null,
              p.worst != null ? { label: "Worst case", value: currency(p.worst), color: CHART.negative } : null,
              showBand ? { label: "Range", value: `${compactCurrency(p.lower)}–${compactCurrency(p.upper)}` } : null,
            ].filter(Boolean) as { label: string; value: string; color?: string }[];
            return (
              <TooltipShell
                title={format(parseISO(label as string), "MMM d, yyyy")}
                rows={rowsT}
                footer={p.isFuture ? "Forecast period" : "Actuals (weekly)"}
              />
            );
          }}
        />
        {showBand && (
          <>
            <Area dataKey="_bandBase" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area dataKey="_bandSize" stackId="band" stroke="none" fill="url(#bandFill)" isAnimationActive={false} />
          </>
        )}
        {showPlan && (
          <Line dataKey="plan" stroke={CHART.muted} strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Plan" />
        )}
        <Line dataKey="forecast" stroke={CHART.clay} strokeWidth={2} strokeDasharray="2 3" dot={false} name="Forecast" />
        <Line dataKey="actual" stroke={CHART.sage} strokeWidth={2.5} dot={false} connectNulls={false} name="Actual" />
        {bestCase && <Line dataKey="best" stroke={CHART.positive} strokeWidth={1.5} dot={false} name="Best case" />}
        {worstCase && <Line dataKey="worst" stroke={CHART.negative} strokeWidth={1.5} dot={false} name="Worst case" />}
        {boundaryDate && (
          <ReferenceLine
            x={boundaryDate}
            stroke={CHART.ink}
            strokeOpacity={0.25}
            strokeDasharray="3 3"
            label={{ value: "Today", position: "insideTopRight", fill: CHART.muted, fontSize: 10 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
