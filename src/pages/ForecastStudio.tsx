import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RotateCcw, Save, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/Slider";
import { Tooltip as UITooltip } from "@/components/ui/Tooltip";
import { RevenueForecastChart } from "@/components/charts/RevenueForecastChart";
import { CHART, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import { useScenario } from "@/hooks/useScenario";
import { forecastAccuracy, revenueTimeline } from "@/data/syntheticData";
import type { ScenarioInputs } from "@/data/calculations";
import type { ScenarioName } from "@/data/types";
import { compactCurrency, compactNumber, multiplier, signed } from "@/lib/formatters";

const SCENARIOS: ScenarioName[] = [
  "Base Case",
  "Aggressive Growth",
  "Margin Protection",
  "Inventory Constrained",
  "Localized Activation Push",
];

const SLIDERS: { key: keyof ScenarioInputs; label: string; min: number; max: number; hint: string }[] = [
  { key: "paidMediaChange", label: "Paid media spend", min: -30, max: 50, hint: "Diminishing returns at the top end" },
  { key: "conversionChange", label: "Conversion rate", min: -10, max: 15, hint: "Onsite + UX improvements" },
  { key: "aovChange", label: "Average order value", min: -10, max: 15, hint: "Bundling, mix, pricing" },
  { key: "emailSmsLift", label: "Email / SMS revenue lift", min: 0, max: 30, hint: "High-margin repeat revenue" },
  { key: "promoDepth", label: "Promo depth", min: -30, max: 30, hint: "Revenue up, margin down" },
  { key: "inventoryConstraint", label: "Inventory constraint", min: -30, max: 10, hint: "Negative caps available demand" },
  { key: "marketActivationLift", label: "Market activation lift", min: 0, max: 40, hint: "Localized events + media" },
  { key: "productLaunchImpact", label: "Product launch impact", min: -10, max: 25, hint: "Launch demand spikes" },
  { key: "internationalGrowth", label: "International growth", min: 0, max: 40, hint: "Higher uncertainty" },
];

function OutputCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "positive" | "warning" | "negative" | "neutral";
}) {
  const color =
    tone === "positive" ? "text-positive" : tone === "warning" ? "text-warning" : tone === "negative" ? "text-negative" : "text-ink-secondary";
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="tabular mt-1 text-[21px] font-semibold leading-none text-ink">{value}</div>
      {delta && <div className={`mt-1 text-[12px] font-medium ${color}`}>{delta}</div>}
    </div>
  );
}

export function ForecastStudio() {
  const { scenario, scenarioInputs, selectScenario, setScenarioInput, resetScenario, isCustomScenario, outputs } =
    useScenario();

  const lift = outputs.revenueLiftPct / 100;
  const adjustedTimeline = revenueTimeline.map((p) =>
    p.isFuture
      ? {
          ...p,
          forecast: Math.round(p.forecast * (1 + lift)),
          lower: Math.round(p.lower * (1 + lift)),
          upper: Math.round(p.upper * (1 + lift)),
        }
      : p,
  );

  const riskTone = outputs.forecastRisk === "Low" ? "positive" : outputs.forecastRisk === "Moderate" ? "warning" : "negative";
  const profitDelta = outputs.grossProfit - Math.round(outputs.baseRevenue * 0.585);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forecast Studio"
        businessQuestion="How will changes in demand, spend, promo, inventory, and activation move DTC revenue?"
        subtitle="A driver-based scenario model over the next 26 weeks. Adjust the levers, compare saved scenarios, and read the revenue, profit, and risk trade-offs."
        badge={{ label: isCustomScenario ? "Custom scenario" : scenario, tone: "ocean" }}
      />

      {/* Saved scenarios */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Saved scenarios</span>
              {SCENARIOS.map((s) => (
                <button
                  key={s}
                  onClick={() => selectScenario(s)}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all ${
                    scenario === s && !isCustomScenario
                      ? "border-sage bg-sage-soft text-sage-deep"
                      : "border-border bg-surface text-ink-secondary hover:border-ink-muted hover:text-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={resetScenario} disabled={!isCustomScenario}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset to preset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-5">
            <SectionHeader question="Scenario controls" hint="Each lever maps to a revenue / margin driver." />
            <div className="space-y-4">
              {SLIDERS.map((s) => (
                <Slider
                  key={s.key}
                  label={s.label}
                  value={scenarioInputs[s.key]}
                  onChange={(v) => setScenarioInput(s.key, v)}
                  min={s.min}
                  max={s.max}
                  suffix="%"
                  signed
                  hint={s.hint}
                  tone={s.key === "promoDepth" || s.key === "inventoryConstraint" ? "clay" : "sage"}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Forecast + outputs */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <SectionHeader
                question="Projected revenue under this scenario"
                hint="Base forecast scaled by driver lift, with best / worst case and a widening confidence band."
                action={
                  <div className="hidden items-center gap-3 text-[11px] text-ink-secondary sm:flex">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART.sage }} /> Actual</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART.clay }} /> Forecast</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART.positive }} /> Best</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART.negative }} /> Worst</span>
                  </div>
                }
              />
              <RevenueForecastChart data={adjustedTimeline} height={290} bestCase={1.1} worstCase={0.88} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <OutputCard
              label="Revenue forecast (26wk)"
              value={compactCurrency(outputs.revenue)}
              delta={`${signed(outputs.revenueLiftPct)}% vs base`}
              tone={outputs.revenueLiftPct >= 0 ? "positive" : "negative"}
            />
            <OutputCard
              label="Gross profit forecast"
              value={compactCurrency(outputs.grossProfit)}
              delta={`${profitDelta >= 0 ? "+" : "−"}${compactCurrency(Math.abs(profitDelta))} vs base`}
              tone={profitDelta >= 0 ? "positive" : "negative"}
            />
            <OutputCard label="New customers" value={compactNumber(outputs.newCustomers)} delta="next 26 weeks" tone="neutral" />
            <OutputCard label="Repeat revenue" value={compactCurrency(outputs.repeatRevenue)} delta="next 26 weeks" tone="neutral" />
            <OutputCard label="MER" value={multiplier(outputs.mer, 2)} delta="revenue / spend" tone="neutral" />
            <div className="rounded-xl border border-border bg-surface p-3.5">
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Forecast risk</div>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone={riskTone}>{outputs.forecastRisk}</Badge>
              </div>
              <div className="mt-1 text-[11px] text-ink-muted">Promo, inventory & spend volatility</div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver decomposition + accuracy */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="Which drivers move the forecast most?" hint="Contribution to the 26-week revenue delta vs base." />
            {outputs.drivers.length === 0 ? (
              <p className="py-12 text-center text-[13px] text-ink-muted">
                No drivers active — adjust the scenario controls to see contributions.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={outputs.drivers} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" {...axisProps} tickFormatter={(v: number) => compactCurrency(v)} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={104} tick={{ fill: CHART.ink, fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: CHART.grid, fillOpacity: 0.25 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as { name: string; contribution: number };
                      return <TooltipShell title={p.name} rows={[{ label: "Contribution", value: (p.contribution >= 0 ? "+" : "−") + compactCurrency(Math.abs(p.contribution)) }]} />;
                    }}
                  />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {outputs.drivers.map((d, i) => (
                      <Cell key={i} fill={d.contribution >= 0 ? CHART.sage : CHART.clay} />
                    ))}
                    <LabelList dataKey="contribution" position="right" formatter={(v: number) => (v >= 0 ? "+" : "−") + compactCurrency(Math.abs(v))} style={{ fill: CHART.muted, fontSize: 10.5, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <SectionHeader
              question="How accurate has the forecast been?"
              hint="MAPE by month. Accuracy degrades around launches and promotional peaks."
            />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={forecastAccuracy} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" {...axisProps} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis {...axisProps} width={36} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  cursor={{ fill: CHART.grid, fillOpacity: 0.25 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof forecastAccuracy)[number];
                    return (
                      <TooltipShell
                        title={p.month}
                        rows={[
                          { label: "MAPE", value: `${p.mape}%` },
                          { label: "Bias", value: `${signed(p.bias)}%` },
                        ]}
                        footer={p.note}
                      />
                    );
                  }}
                />
                <Bar dataKey="mape" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {forecastAccuracy.map((p, i) => (
                    <Cell key={i} fill={p.mape > 8 ? CHART.clay : p.mape > 6 ? CHART.warning : CHART.sage} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      <Card className="border-ocean/30 bg-gradient-to-br from-ocean-soft/40 to-surface">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ocean" />
            <div>
              <div className="text-[14px] font-semibold text-ink">Recommended: adopt the Margin Protection scenario into the Q3 plan</div>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-secondary">
                Margin Protection produces slightly lower revenue but higher gross profit by reducing promo depth and
                improving inventory allocation — a better profit outcome with resilient repeat revenue. Phase the promo
                reduction by market and monitor weekly before scaling.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => selectScenario("Margin Protection")} className="shrink-0">
            <Save className="h-3.5 w-3.5" /> Load scenario
          </Button>
        </CardContent>
      </Card>

      <UITooltip content="All figures are synthetic and deterministic." side="top">
        <p className="text-[11px] text-ink-muted">Scenario outputs are model estimates over synthetic data — test before scaling.</p>
      </UITooltip>
    </div>
  );
}
