import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Compass, FileText, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { Card, CardContent, CardHeader, CardTitle, SectionHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RevenueForecastChart } from "@/components/charts/RevenueForecastChart";
import { WaterfallChart } from "@/components/charts/WaterfallChart";
import { ExecutiveAlerts } from "@/components/ui/ExecutiveAlerts";
import { CHART } from "@/components/charts/chartUtils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFilters } from "@/hooks/useFilters";
import {
  forecastVsPlan,
  inventoryRevenueAtRisk,
  pctChange,
  revenueWaterfall,
} from "@/data/calculations";
import { returnAdjustedGrossProfit } from "@/lib/scoring";
import { austin, executiveAlerts, incrementalRevenueIdentified, personas, revenueTimeline } from "@/data/syntheticData";
import type { DailyMetric } from "@/data/types";
import {
  compactCurrency,
  compactNumber,
  currency,
  multiplier,
  percent,
  signedPercent,
} from "@/lib/formatters";
import { format, parseISO } from "date-fns";

function weekly(series: DailyMetric[], pick: (d: DailyMetric) => number, n = 12): number[] {
  if (series.length === 0) return [];
  const bucket = Math.max(1, Math.floor(series.length / n));
  const out: number[] = [];
  for (let i = 0; i < series.length; i += bucket) {
    const slice = series.slice(i, i + bucket);
    out.push(slice.reduce((s, d) => s + pick(d), 0) / slice.length);
  }
  return out.slice(-n);
}

export function CommandCenter() {
  const { result, filters } = useFilters();
  const { current, prior, series } = result;
  const fvp = forecastVsPlan();

  const blendedCac = current.newCustomers > 0 ? current.marketingSpend / current.newCustomers : 0;
  const ltv = 478;
  const ltvCac = blendedCac > 0 ? ltv / blendedCac : 0;
  const priorCac = prior.newCustomers > 0 ? prior.marketingSpend / prior.newCustomers : 0;
  const priorLtvCac = priorCac > 0 ? ltv / priorCac : 0;
  const invAtRisk = inventoryRevenueAtRisk();
  const blendedCqs = Math.round(personas.reduce((s, p) => s + p.share * p.customerQualityScore, 0));
  const returnAdjGp = returnAdjustedGrossProfit({ revenue: current.revenue, marginRate: current.grossMarginRate, returnRate: 0.092 });
  const priorReturnAdjGp = returnAdjustedGrossProfit({ revenue: prior.revenue, marginRate: prior.grossMarginRate, returnRate: 0.092 });

  const newRepeatSeries = useMemo(() => {
    const n = 14;
    const bucket = Math.max(1, Math.floor(series.length / n));
    const out: { date: string; New: number; Repeat: number }[] = [];
    for (let i = 0; i < series.length; i += bucket) {
      const slice = series.slice(i, i + bucket);
      out.push({
        date: slice[0].date,
        New: Math.round(slice.reduce((s, d) => s + d.newRevenue, 0) * result.factor),
        Repeat: Math.round(slice.reduce((s, d) => s + d.repeatRevenue, 0) * result.factor),
      });
    }
    return out.slice(-n);
  }, [series, result.factor]);

  const waterfall = useMemo(() => revenueWaterfall(filters), [filters]);

  const kpis = [
    {
      title: "Net revenue",
      value: compactCurrency(current.revenue),
      delta: pctChange(current.revenue, prior.revenue),
      deltaLabel: "vs prior",
      sparkline: weekly(series, (d) => d.revenue),
      tooltip: "Total DTC net revenue for the selected period and filters.",
      accent: "sage" as const,
    },
    {
      title: "Forecast vs plan",
      value: signedPercent(fvp.aheadPct),
      status: { label: fvp.aheadPct >= 0 ? "Ahead of Plan" : "Behind Plan", tone: (fvp.aheadPct >= 0 ? "positive" : "warning") as "positive" | "warning" },
      sparkline: weekly(series, (d) => d.revenue),
      tooltip: "Trailing-quarter actuals vs the financial plan.",
      accent: "ocean" as const,
    },
    {
      title: "Gross margin",
      value: percent(current.grossMarginRate),
      delta: pctChange(current.grossMarginRate, prior.grossMarginRate),
      deltaLabel: "vs prior",
      sparkline: weekly(series, (d) => d.grossMargin),
      tooltip: "Blended product gross margin rate.",
    },
    {
      title: "Conversion rate",
      value: percent(current.conversionRate, 2),
      delta: pctChange(current.conversionRate, prior.conversionRate),
      deltaLabel: "vs prior",
      sparkline: weekly(series, (d) => d.conversionRate),
      tooltip: "Sessions that convert to orders.",
    },
    {
      title: "AOV",
      value: currency(current.aov),
      delta: pctChange(current.aov, prior.aov),
      deltaLabel: "vs prior",
      sparkline: weekly(series, (d) => d.aov),
      tooltip: "Average order value.",
    },
    {
      title: "New customers",
      value: compactNumber(current.newCustomers),
      delta: pctChange(current.newCustomers, prior.newCustomers),
      deltaLabel: "vs prior",
      sparkline: weekly(series, (d) => d.newCustomers),
      tooltip: "First-time customers acquired in period. Watch for flattening in mature markets.",
      accent: "clay" as const,
    },
    {
      title: "Repeat revenue share",
      value: percent(current.repeatRevenueShare),
      delta: pctChange(current.repeatRevenueShare, prior.repeatRevenueShare),
      deltaLabel: "vs prior",
      sparkline: weekly(series, (d) => d.repeatRevenue / d.revenue),
      tooltip: "Share of revenue from returning customers.",
    },
    {
      title: "MER",
      value: multiplier(current.mer, 2),
      delta: pctChange(current.mer, prior.mer),
      deltaLabel: "vs prior",
      tooltip: "Marketing efficiency ratio: revenue / total marketing spend.",
    },
    {
      title: "LTV : CAC",
      value: `${ltvCac.toFixed(1)}x`,
      delta: pctChange(ltvCac, priorLtvCac),
      deltaLabel: "vs prior",
      tooltip: "Blended predicted lifetime value vs blended acquisition cost.",
    },
    {
      title: "Customer Quality Score",
      value: String(blendedCqs),
      delta: 2.1,
      deltaLabel: "vs prior",
      sparkline: weekly(series, (d) => d.repeatRevenue / d.revenue),
      tooltip: "Blended quality of acquired customers (0–100): LTV, margin, repeat, return & promo inverse, engagement.",
      accent: "sage" as const,
    },
    {
      title: "Return-adj. gross profit",
      value: compactCurrency(returnAdjGp),
      delta: pctChange(returnAdjGp, priorReturnAdjGp),
      deltaLabel: "vs prior",
      sparkline: weekly(series, (d) => d.grossMargin),
      tooltip: "Gross profit after estimated returns, exchanges, commission, and discount impact.",
    },
    {
      title: "Incremental revenue identified",
      value: compactCurrency(incrementalRevenueIdentified),
      status: { label: "Validated", tone: "positive" as const },
      tooltip: "Incremental DTC revenue validated or reading across the experiment portfolio (vs attributed).",
      accent: "ocean" as const,
    },
    {
      title: "Revenue at risk · inventory",
      value: compactCurrency(invAtRisk),
      status: { label: "Watch", tone: "warning" as const },
      invert: true,
      tooltip: "Estimated revenue exposed to stockouts and size-break gaps.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command Center"
        businessQuestion="What changed in DTC performance, why, and where should leadership focus?"
        subtitle="A single read on revenue health, demand formation, and the highest-leverage actions for the week."
        badge={{ label: "Trailing 90 days", tone: "neutral" }}
        actions={
          <>
            <Link to="/market-opportunity">
              <Button variant="outline" size="sm">
                <Compass className="h-4 w-4" /> Market Opportunity
              </Button>
            </Link>
            <Link to="/executive-brief">
              <Button size="sm">
                <FileText className="h-4 w-4" /> Executive Brief
              </Button>
            </Link>
          </>
        }
      />

      <HeroPanel
        title="DTC revenue is healthy, but growth is concentrating in repeat customers."
        body="Revenue is running 3.4% ahead of plan, yet new-customer acquisition is flattening in mature markets. Austin, Denver, Miami, and Boston show rising external demand — Austin leads with a 91 opportunity score, where demand is forming faster than revenue capture."
        badge={{ label: "Ahead of Plan", tone: "positive" }}
        stats={[
          { label: "Net revenue", value: compactCurrency(current.revenue), sub: `${signedPercent(pctChange(current.revenue, prior.revenue))} vs prior` },
          { label: "Forecast vs plan", value: signedPercent(fvp.aheadPct), sub: "trailing quarter", tone: "positive" },
          { label: "New customers", value: compactNumber(current.newCustomers), sub: `${signedPercent(pctChange(current.newCustomers, prior.newCustomers))} vs prior` },
          { label: "Top opportunity", value: "Austin", sub: `Opportunity score ${austin.opportunityScore}` },
        ]}
        actions={
          <>
            <Link to="/forecast">
              <Button variant="primary" size="sm">
                <TrendingUp className="h-4 w-4" /> Build forecast scenario
              </Button>
            </Link>
            <Link to="/market-opportunity">
              <Button variant="outline" size="sm">
                View market opportunity <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        }
      />

      <ExecutiveAlerts alerts={executiveAlerts} />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <MetricCard key={k.title} {...k} />
        ))}
      </div>

      {/* Forecast + waterfall */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionHeader
              question="Are we tracking ahead of plan — and where is it heading?"
              hint="Weekly actuals vs base forecast and financial plan, with a forward confidence band."
              action={
                <div className="hidden items-center gap-3 text-[11px] text-ink-secondary sm:flex">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART.sage }} /> Actual</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART.clay }} /> Forecast</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART.muted }} /> Plan</span>
                </div>
              }
            />
            <RevenueForecastChart data={revenueTimeline} height={300} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="What drove the revenue change?" hint="Decomposition vs prior period." />
            <WaterfallChart items={waterfall} height={280} />
          </CardContent>
        </Card>
      </div>

      {/* New vs repeat */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader
            question="How is the mix of new vs repeat revenue shifting?"
            hint="Repeat revenue is carrying more of the growth — a signal to protect acquisition in emerging markets."
          />
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={newRepeatSeries} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="repeatFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.sage} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART.sage} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="newFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.clay} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART.clay} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={CHART.grid} tick={{ fill: CHART.muted, fontSize: 11 }} tickLine={false} minTickGap={32} tickFormatter={(v: string) => format(parseISO(v), "MMM ''yy")} />
              <YAxis stroke={CHART.grid} tick={{ fill: CHART.muted, fontSize: 11 }} tickLine={false} width={48} tickFormatter={(v: number) => compactCurrency(v)} />
              <Tooltip
                formatter={(v: number, name) => [currency(v), name]}
                labelFormatter={(v) => format(parseISO(v as string), "MMM d, yyyy")}
                contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }}
              />
              <Area dataKey="Repeat" stackId="1" stroke={CHART.sage} strokeWidth={2} fill="url(#repeatFill)" />
              <Area dataKey="New" stackId="1" stroke={CHART.clay} strokeWidth={2} fill="url(#newFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Opportunities & risks */}
      <div>
        <SectionHeader question="Where should leadership focus this week?" hint="Top opportunities and risks, each with a recommended action and confidence." />
        <div className="grid gap-4 lg:grid-cols-2">
          <InsightCard
            title="Activate Austin before competitors saturate"
            status="Opportunity"
            whatHappened="Austin's search, social, and lifestyle demand are accelerating faster than current revenue capture, and it ranks #1 on the market opportunity model (91)."
            whyItMatters="A localization window is open: demand is forming ahead of supply of brand presence, and competitor intensity remains manageable."
            recommendedAction="Approve an Austin run club + recovery studio activation with localized media and lifecycle."
            estimatedImpact="$560K 90-day halo · 3.7x ROI"
            confidence={84}
            owner="Retail / Growth"
            testDesign="Austin vs matched control markets; measure CAC, conversion lift, repeat rate, and 90-day halo."
            briefItem={{
              id: "cc-austin",
              title: "Activate Austin localized growth",
              detail: "Run club + recovery activation with localized media and lifecycle; 90-day halo ~$560K at 3.7x ROI.",
              source: "Command Center",
              impact: "$560K 90-day halo",
              confidence: 84,
            }}
            evidence={{
              title: "Austin localized growth opportunity",
              confidence: 84,
              sourceSignals: ["Market opportunity model", "External demand radar", "Persona fit", "Event halo history"],
              supportingMetrics: [
                { label: "Opportunity score", value: String(austin.opportunityScore) },
                { label: "Traffic growth YoY", value: `+${austin.ecommerceTrafficGrowth}%` },
                { label: "Repeat rate", value: percent(austin.repeatPurchaseRate) },
                { label: "Competitor intensity", value: String(austin.competitorIntensityIndex) },
              ],
              assumptions: [
                "Event conversion and lead-capture priors hold within ±15%.",
                "90-day halo decays exponentially from the activation date.",
                "Local partner and assortment availability confirmed.",
              ],
              modelLogic:
                "Weighted opportunity score across 10 normalized signals (traffic growth, conversion, repeat, search, social velocity, wellness/run density, persona fit, income, retail whitespace, competitor-intensity inverse).",
              confidenceRationale:
                "Multiple independent signals corroborate; event ROI model trained on comparable activations with matched-control validation planned.",
              recommendedExperiment:
                "Austin vs matched control markets. Measure lead capture, new-customer CAC, conversion lift, repeat purchase rate, and 90-day ecommerce halo.",
              risks: [
                "Halo attribution requires clean matched controls.",
                "Size availability in key styles could cap conversion.",
              ],
            }}
          />
          <InsightCard
            title="New-customer acquisition is flattening in mature markets"
            status="Watch"
            whatHappened="LA, SF, and San Diego show strong retention but slowing first-time acquisition as channels approach saturation."
            whyItMatters="Over-reliance on repeat revenue masks acquisition softness; future growth needs new, under-saturated markets and more efficient prospecting."
            recommendedAction="Shift incremental prospecting budget toward emerging markets and value-based bidding."
            estimatedImpact="+14K new customers · +$1.8M 12-mo LTV"
            confidence={73}
            owner="Performance Marketing"
            testDesign="Geo holdout on prospecting reallocation; measure incremental new customers and blended CAC."
            briefItem={{
              id: "cc-acq",
              title: "Protect new-customer acquisition",
              detail: "Reallocate prospecting toward emerging markets + value-based bidding; +14K new customers, +$1.8M LTV.",
              source: "Command Center",
              impact: "+14K new customers",
              confidence: 73,
            }}
            evidence={{
              title: "New-customer acquisition softness",
              confidence: 73,
              sourceSignals: ["Channel marginal ROAS", "New-customer share", "Market signals", "LTV model"],
              supportingMetrics: [
                { label: "New customers", value: compactNumber(current.newCustomers) },
                { label: "Δ vs prior", value: signedPercent(pctChange(current.newCustomers, prior.newCustomers)) },
                { label: "Blended CAC", value: currency(blendedCac) },
                { label: "LTV:CAC", value: `${ltvCac.toFixed(1)}x` },
              ],
              assumptions: [
                "Mature-market channel saturation continues near current levels.",
                "Emerging markets convert at modeled persona-fit rates.",
              ],
              modelLogic:
                "Compares period-over-period new-customer trends against channel marginal-ROAS curves and market-level demand signals.",
              confidenceRationale:
                "Directionally strong but requires geo-holdout validation to confirm incrementality before scaling budget shifts.",
              recommendedExperiment:
                "Geo holdout reallocating prospecting budget; measure incremental new customers, blended CAC, and 12-month LTV.",
              risks: ["Short-term revenue dip during reallocation.", "Attribution noise in blended CAC."],
            }}
          />
        </div>
      </div>

      {/* AI weekly readout */}
      <Card className="border-sage/30 bg-gradient-to-br from-sage-soft/40 to-surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-clay" /> AI-assisted weekly readout
            </CardTitle>
            <Badge tone="warning">Human-reviewed draft</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5 text-[13.5px] leading-relaxed text-ink-secondary">
            <p>
              <span className="font-semibold text-ink">Headline.</span> DTC revenue is{" "}
              {signedPercent(fvp.aheadPct)} ahead of plan, with gross margin at {percent(current.grossMarginRate)} and
              MER at {multiplier(current.mer, 2)}. Momentum is healthy, but the composition is shifting toward repeat
              revenue ({percent(current.repeatRevenueShare)} of total).
            </p>
            <p>
              <span className="font-semibold text-ink">What to watch.</span> New-customer acquisition is flattening in
              mature markets even as retention holds. The clearest growth lever is localized activation in emerging
              markets — Austin leads, followed by Nashville and Miami.
            </p>
            <p>
              <span className="font-semibold text-ink">Recommended focus.</span> (1) Approve the Austin activation
              test, (2) reallocate prospecting toward emerging markets with value-based bidding, and (3) close
              size-break gaps protecting <span className="tabular">{compactCurrency(invAtRisk)}</span> of at-risk
              revenue. Each carries a defined owner, confidence level, and measurement plan.
            </p>
          </div>
          <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-ink-muted">
            Model-supported summary over governed metrics. Figures are synthetic. Major commercial decisions remain
            evidence-based, testable, and human-approved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
