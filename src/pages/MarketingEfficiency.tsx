import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRightLeft, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { CHART, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import { channels, creativePerformance } from "@/data/syntheticData";
import { compactCurrency, compactNumber, multiplier, percent } from "@/lib/formatters";

export function MarketingEfficiency() {
  const [curveChannel, setCurveChannel] = useState("Paid Social");
  const [shiftK, setShiftK] = useState(250);

  const spendVsRev = channels.map((c) => ({ channel: c.channel, spend: c.spend, revenue: c.attributedRevenue, roas: c.roas }));

  // Diminishing returns curve for the selected channel.
  const curve = useMemo(() => {
    const c = channels.find((x) => x.channel === curveChannel)!;
    const asymptote = c.attributedRevenue * 1.45;
    const k = -Math.log(1 - c.attributedRevenue / asymptote) / c.spend;
    const pts: { spend: number; revenue: number; marginal: number }[] = [];
    const maxSpend = c.spend * 1.8;
    for (let s = 0; s <= maxSpend; s += maxSpend / 28) {
      const revenue = asymptote * (1 - Math.exp(-k * s));
      const marginal = asymptote * k * Math.exp(-k * s);
      pts.push({ spend: Math.round(s), revenue: Math.round(revenue), marginal: Number(marginal.toFixed(2)) });
    }
    return { pts, current: c.spend };
  }, [curveChannel]);

  // Budget reallocation simulator (Paid Search → Paid Social).
  const X = shiftK * 1000;
  const shortTermRevenue = -0.48 * X;
  const newCustomers = 0.056 * X;
  const ltv12mo = 7.2 * X;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing Efficiency Lab"
        businessQuestion="Which channels are driving profitable, high-quality customer growth?"
        subtitle="Spend, ROAS, CAC, MER, LTV:CAC, payback, and incremental efficiency by channel — plus a budget-reallocation simulator that trades short-term revenue against new-customer LTV."
        badge={{ label: "Channel economics", tone: "ocean" }}
      />

      <HeroPanel
        eyebrow="Efficiency insight"
        title="High-margin lifecycle channels and efficient prospecting carry the portfolio."
        body="Email, SMS, and Direct deliver outstanding ROAS and LTV:CAC on high-margin repeat revenue. Paid Social drives the most new customers but at lower first-order margin, while branded search shows strong ROAS with limited incremental scale. The opportunity is to reallocate toward incremental new-customer growth."
        icon={<Megaphone className="h-3.5 w-3.5" />}
        badge={{ label: "Reallocate", tone: "clay" }}
        stats={[
          { label: "Best LTV:CAC", value: `${Math.max(...channels.map((c) => c.ltvCacRatio)).toFixed(0)}x`, sub: "Direct", tone: "positive" },
          { label: "Most new customers", value: "Paid Social", sub: "71% new" },
          { label: "Highest ROAS", value: `${Math.max(...channels.map((c) => c.roas)).toFixed(0)}x`, sub: "Direct" },
          { label: "Blended MER", value: multiplier(channels.reduce((s, c) => s + c.attributedRevenue, 0) / channels.reduce((s, c) => s + c.spend, 0), 2), sub: "revenue / spend" },
        ]}
      />

      {/* Channel table */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="How efficient is each channel — and how good is the growth it buys?" hint="Quality score weighs new-customer share, margin, and LTV:CAC." />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Channel</th>
                  <th className="py-2 pr-3 text-right font-medium">Spend</th>
                  <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                  <th className="py-2 pr-3 text-right font-medium">ROAS</th>
                  <th className="py-2 pr-3 text-right font-medium">R-adj ROAS</th>
                  <th className="py-2 pr-3 text-right font-medium">CAC</th>
                  <th className="py-2 pr-3 text-right font-medium">LTV:CAC</th>
                  <th className="py-2 pr-3 text-right font-medium">New %</th>
                  <th className="py-2 pr-3 text-right font-medium">Inc %</th>
                  <th className="py-2 pl-3 text-right font-medium">CQS</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={c.channel} className="border-b border-border/60 hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3 font-medium text-ink">{c.channel}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(c.spend)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(c.attributedRevenue)}</td>
                    <td className="tabular py-2.5 pr-3 text-right font-medium text-ink">{multiplier(c.roas)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{multiplier(c.returnAdjustedRoas)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">${c.cac}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{multiplier(c.ltvCacRatio)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{percent(c.newCustomerShare, 0)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{percent(c.incrementalShare, 0)}</td>
                    <td className="py-2.5 pl-3 text-right">
                      <Badge tone={c.customerQualityScore >= 85 ? "positive" : c.customerQualityScore >= 75 ? "sage" : "warning"}>{c.customerQualityScore}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Spend vs revenue */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="Where does spend turn into revenue?" hint="Spend vs attributed revenue by channel." />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendVsRev} margin={{ top: 8, right: 8, left: 4, bottom: 40 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="channel" {...axisProps} angle={-35} textAnchor="end" interval={0} height={60} tick={{ fill: CHART.muted, fontSize: 10 }} />
                <YAxis {...axisProps} width={44} tickFormatter={(v: number) => compactCurrency(v)} />
                <Tooltip
                  cursor={{ fill: CHART.grid, fillOpacity: 0.2 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof spendVsRev)[number];
                    return <TooltipShell title={p.channel} rows={[{ label: "Spend", value: compactCurrency(p.spend), color: CHART.clay }, { label: "Revenue", value: compactCurrency(p.revenue), color: CHART.sage }, { label: "ROAS", value: multiplier(p.roas) }]} />;
                  }}
                />
                <Bar dataKey="spend" fill={CHART.clay} fillOpacity={0.55} radius={[3, 3, 0, 0]} maxBarSize={16} />
                <Bar dataKey="revenue" fill={CHART.sage} radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Diminishing returns */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHeader question="Where do diminishing returns set in?" hint="Incremental revenue saturates as spend scales." className="mb-0" />
              <Select size="sm" value={curveChannel} onChange={setCurveChannel} options={channels.map((c) => c.channel)} />
            </div>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={264}>
                <ComposedChart data={curve.pts} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="drFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.ocean} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={CHART.ocean} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="spend" {...axisProps} tickFormatter={(v: number) => compactCurrency(v)} />
                  <YAxis {...axisProps} width={44} tickFormatter={(v: number) => compactCurrency(v)} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as (typeof curve.pts)[number];
                      return <TooltipShell title={`Spend ${compactCurrency(p.spend)}`} rows={[{ label: "Revenue", value: compactCurrency(p.revenue), color: CHART.ocean }, { label: "Marginal ROAS", value: multiplier(p.marginal) }]} />;
                    }}
                  />
                  <ReferenceLine x={curve.current} stroke={CHART.clay} strokeDasharray="4 4" label={{ value: "Current", position: "top", fill: CHART.clay, fontSize: 10 }} />
                  <Line dataKey="revenue" stroke={CHART.ocean} strokeWidth={2.5} dot={false} fill="url(#drFill)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creative Intelligence */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which creative themes drive profitable, high-quality customer growth?" hint="Creative theme performance by persona and market — quality and return-adjusted margin, not just clicks." />
          <div className="mb-3 rounded-lg bg-sage-soft/40 p-3 text-[12.5px] leading-relaxed text-ink-secondary">
            <span className="font-medium text-ink">Insight — </span>Work-to-weekend creative drives the highest LTV among Performance Commuter customers, while softness/comfort creative drives stronger conversion among Studio Minimalist and Travel Weekender personas.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Creative theme</th>
                  <th className="py-2 pr-3 font-medium">Persona · Market</th>
                  <th className="py-2 pr-3 font-medium">Channel</th>
                  <th className="py-2 pr-3 text-right font-medium">Conv.</th>
                  <th className="py-2 pr-3 text-right font-medium">ROAS</th>
                  <th className="py-2 pr-3 text-right font-medium">CQS</th>
                  <th className="py-2 pr-3 text-right font-medium">Margin a/ returns</th>
                  <th className="py-2 pl-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...creativePerformance].sort((a, b) => b.customerQualityScore - a.customerQualityScore).map((c) => (
                  <tr key={c.creativeId} className="border-b border-border/60 align-top hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3 font-medium text-ink">{c.creativeTheme}</td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{c.persona} · {c.market}</td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{c.channel}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{percent(c.conversionRate, 1)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{multiplier(c.roas)}</td>
                    <td className="tabular py-2.5 pr-3 text-right"><span className={c.customerQualityScore >= 80 ? "font-semibold text-sage-deep" : "text-ink-secondary"}>{c.customerQualityScore}</span></td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(c.marginAfterReturns)}</td>
                    <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{c.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Budget reallocation simulator */}
      <Card className="border-sage/30 bg-gradient-to-br from-sage-soft/30 to-surface">
        <CardContent className="pt-5">
          <SectionHeader question="What happens if we reallocate budget toward incremental growth?" hint="Shift spend from branded search to prospecting paid social." />
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-center gap-3 rounded-xl border border-border bg-surface p-3">
                <Badge tone="clay">Paid Search (branded)</Badge>
                <ArrowRightLeft className="h-4 w-4 text-ink-muted" />
                <Badge tone="sage">Paid Social (prospecting)</Badge>
              </div>
              <Slider label="Amount to shift" value={shiftK} onChange={setShiftK} min={0} max={500} step={10} prefix="$" suffix="k" />
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-secondary">
                Branded search captures high-ROAS, largely non-incremental demand. Prospecting paid social returns less
                immediately but acquires incremental new customers with compounding lifetime value.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="text-[11px] uppercase tracking-wide text-ink-muted">Short-term revenue</div>
                <div className="tabular mt-1 text-[20px] font-semibold leading-none text-negative">{compactCurrency(shortTermRevenue)}</div>
                <div className="mt-1 text-[11px] text-ink-muted">immediate, last-click</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="text-[11px] uppercase tracking-wide text-ink-muted">New customers</div>
                <div className="tabular mt-1 text-[20px] font-semibold leading-none text-sage-deep">+{compactNumber(newCustomers)}</div>
                <div className="mt-1 text-[11px] text-ink-muted">incremental acquisition</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="text-[11px] uppercase tracking-wide text-ink-muted">12-month LTV</div>
                <div className="tabular mt-1 text-[20px] font-semibold leading-none text-sage-deep">+{compactCurrency(ltv12mo)}</div>
                <div className="mt-1 text-[11px] text-ink-muted">projected lifetime value</div>
              </div>
            </div>
          </div>
          <p className="mt-4 border-t border-border pt-3 text-[11px] text-ink-muted">
            Measurement plan: geo holdout on the reallocation; measure incremental new customers, blended CAC, and
            12-month LTV before scaling. Human approval required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
