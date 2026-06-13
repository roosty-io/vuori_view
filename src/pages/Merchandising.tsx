import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BellRing, Boxes, Monitor, Ruler, Shirt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import { MarginVelocityScatter } from "@/components/charts/MarginVelocityScatter";
import { CHART, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import {
  inventoryRisk,
  pdpQuality,
  productLaunches,
  products,
  returnsFitData,
  waitlistDemand,
  waitlistRecoverable,
} from "@/data/syntheticData";
import { compactCurrency, percent, percentRaw, signed } from "@/lib/formatters";
import type { Product } from "@/data/types";
import { groupBy, sumBy } from "@/lib/utils";

const RECO_TONE: Record<Product["recommendation"], BadgeTone> = {
  Push: "positive",
  Replenish: "ocean",
  Localize: "clay",
  Protect: "warning",
  Hold: "neutral",
};

export function Merchandising() {
  const byCategory = useMemo(() => {
    const groups = groupBy(products, (p) => p.category);
    return Object.entries(groups)
      .map(([category, items]) => ({ category, revenue: sumBy(items, (p) => p.revenue) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, []);

  const byColor = useMemo(() => {
    const groups = groupBy(products, (p) => p.color);
    return Object.entries(groups)
      .map(([color, items]) => ({ color, revenue: sumBy(items, (p) => p.revenue) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, []);

  const totalLostRevenue = inventoryRisk.reduce((s, r) => s + r.lostRevenueEstimate, 0);
  const sortedProducts = [...products].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Merchandising & Assortment"
        businessQuestion="Which products, colors, and sizes should Vuori push, protect, replenish, or localize?"
        subtitle="Revenue, sell-through, margin, days of cover, size availability, and return risk by style — with clear push / hold / replenish / localize recommendations and inventory revenue at risk."
        badge={{ label: "Assortment actions", tone: "sage" }}
      />

      <HeroPanel
        eyebrow="Merch insight"
        title="Villa Wideleg is over-indexing with Travel Weekender and Studio Minimalist personas."
        body="High engagement in warm-weather and resort markets points to a localized creative and capsule-bundling opportunity. Meanwhile, size breaks in a handful of hero styles are exposing meaningful revenue — closing them is one of the highest-confidence recovery plays available."
        icon={<Shirt className="h-3.5 w-3.5" />}
        badge={{ label: "Localize Villa Wideleg", tone: "clay" }}
        stats={[
          { label: "Revenue at risk", value: compactCurrency(totalLostRevenue), sub: "stockouts & size gaps", tone: "warning" },
          { label: "Push styles", value: String(products.filter((p) => p.recommendation === "Push").length), sub: "high sell-through", tone: "positive" },
          { label: "Localize styles", value: String(products.filter((p) => p.recommendation === "Localize").length), sub: "market-fit upside" },
          { label: "High-return styles", value: String(products.filter((p) => p.returnRate > 0.12).length), sub: "fit guidance needed", tone: "warning" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="Where does revenue concentrate by category?" hint="Trailing-year synthetic revenue by category." />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byCategory} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="category" {...axisProps} tick={{ fill: CHART.muted, fontSize: 10.5 }} interval={0} />
                <YAxis {...axisProps} width={44} tickFormatter={(v: number) => compactCurrency(v)} />
                <Tooltip cursor={{ fill: CHART.grid, fillOpacity: 0.2 }} content={({ active, payload }) => active && payload?.length ? <TooltipShell title={(payload[0].payload as { category: string }).category} rows={[{ label: "Revenue", value: compactCurrency((payload[0].payload as { revenue: number }).revenue), color: CHART.sage }]} /> : null} />
                <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={48} fill={CHART.sage} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="Which colorways are performing?" hint="Revenue by color — lead with winners earlier in the season." />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byColor} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" {...axisProps} tickFormatter={(v: number) => compactCurrency(v)} />
                <YAxis type="category" dataKey="color" {...axisProps} width={90} tick={{ fill: CHART.ink, fontSize: 11.5 }} />
                <Tooltip cursor={{ fill: CHART.grid, fillOpacity: 0.2 }} content={({ active, payload }) => active && payload?.length ? <TooltipShell title={(payload[0].payload as { color: string }).color} rows={[{ label: "Revenue", value: compactCurrency((payload[0].payload as { revenue: number }).revenue), color: CHART.clay }]} /> : null} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={16} fill={CHART.clay} fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="What should we push, protect, replenish, or localize?" hint="Margin vs sell-through velocity. Bubble size = revenue; color = recommended action." />
          <MarginVelocityScatter products={products} />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-secondary">
            {(["Push", "Replenish", "Localize", "Protect", "Hold"] as Product["recommendation"][]).map((r) => (
              <span key={r} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: r === "Push" ? CHART.sage : r === "Replenish" ? CHART.ocean : r === "Localize" ? CHART.clay : r === "Protect" ? CHART.warning : CHART.muted }} /> {r}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product table */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which styles drive revenue — and what's the action?" hint="Sell-through, margin, and return risk by style." />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Style</th>
                  <th className="py-2 pr-3 font-medium">Role</th>
                  <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                  <th className="py-2 pr-3 font-medium">Sell-through</th>
                  <th className="py-2 pr-3 text-right font-medium">Margin</th>
                  <th className="py-2 pr-3 text-right font-medium">Return rate</th>
                  <th className="py-2 pl-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((p) => (
                  <tr key={p.productId} className="border-b border-border/60 hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-ink">{p.productName}</div>
                      <div className="text-[11px] text-ink-muted">{p.category} · {p.color}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{p.productRole}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(p.revenue)}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <Progress value={p.sellThrough * 100} tone={p.sellThrough > 0.7 ? "positive" : p.sellThrough > 0.5 ? "sage" : "warning"} className="w-14" />
                        <span className="tabular text-[12px] text-ink-secondary">{percent(p.sellThrough, 0)}</span>
                      </div>
                    </td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{percent(p.marginRate, 0)}</td>
                    <td className="tabular py-2.5 pr-3 text-right">
                      <span className={p.returnRate > 0.12 ? "font-semibold text-negative" : "text-ink-secondary"}>{percent(p.returnRate, 0)}</span>
                    </td>
                    <td className="py-2.5 pl-3"><Badge tone={RECO_TONE[p.recommendation]}>{p.recommendation}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Inventory risk */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionHeader question="Where are we losing revenue to stockouts and size breaks?" hint={`Estimated ${compactCurrency(totalLostRevenue)} of revenue at risk.`} />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Style · Market · Size</th>
                    <th className="py-2 pr-3 text-right font-medium">Days cover</th>
                    <th className="py-2 pr-3 font-medium">Size avail.</th>
                    <th className="py-2 pr-3 text-right font-medium">Lost rev.</th>
                    <th className="py-2 pl-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryRisk.map((r, i) => (
                    <tr key={i} className="border-b border-border/60 hover:bg-surface-2/40">
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-ink">{r.productName}</span>
                        <span className="ml-1.5 text-[11px] text-ink-muted">{r.market} · {r.size}</span>
                      </td>
                      <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{r.daysOfCover}d</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <Progress value={r.sizeAvailabilityRate * 100} tone={r.sizeAvailabilityRate > 0.8 ? "positive" : r.sizeAvailabilityRate > 0.6 ? "warning" : "negative"} className="w-12" />
                          <span className="tabular text-[12px] text-ink-secondary">{percent(r.sizeAvailabilityRate, 0)}</span>
                        </div>
                      </td>
                      <td className="tabular py-2.5 pr-3 text-right font-semibold text-ink">{compactCurrency(r.lostRevenueEstimate)}</td>
                      <td className="py-2.5 pl-3"><Badge tone={r.riskLevel === "High" ? "negative" : r.riskLevel === "Medium" ? "warning" : "positive"}>{r.riskLevel}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Back-in-stock summary */}
        <Card className="border-sage/25 bg-gradient-to-br from-sage-soft/30 to-surface">
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              <BellRing className="h-3.5 w-3.5 text-sage" /> Back-in-stock recoverable
            </div>
            <div className="tabular text-[26px] font-semibold leading-none text-sage-deep">{compactCurrency(waitlistRecoverable)}</div>
            <p className="mt-1 text-[11.5px] text-ink-muted">within ~30 days if replenishment is prioritized</p>
            <div className="mt-3 space-y-2">
              {waitlistDemand.slice(0, 3).map((w) => (
                <div key={w.waitlistId} className="rounded-lg border border-border bg-surface p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-medium text-ink">{w.productName}</span>
                    <span className="tabular text-[12px] font-semibold text-sage-deep">{compactCurrency(w.expectedRecoveryRevenue)}</span>
                  </div>
                  <div className="text-[11px] text-ink-muted">{w.market} · {w.size} · {w.waitlistSignups.toLocaleString()} waitlisted</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <MerchOpsSection />
    </div>
  );
}

// ── Back-in-Stock, Returns/Fit, Launches & PDP Quality (progressive disclosure)
function MerchOpsSection() {
  const [tab, setTab] = useState("returns");
  const totalRecoverable = waitlistRecoverable;
  const joggerRecoverable = waitlistDemand
    .filter((w) => w.productName === "Sunday Performance Jogger")
    .reduce((s, w) => s + w.expectedRecoveryRevenue, 0);
  const totalPreventable = returnsFitData.reduce((s, r) => s + r.preventableReturnEstimate, 0);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionHeader question="How do we protect margin and recover demand across the assortment?" hint="Returns & fit, back-in-stock demand, launch reads, and digital-shelf quality." className="mb-0" />
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "returns", label: "Returns & Fit", icon: Ruler },
              { value: "waitlist", label: "Back-in-Stock", icon: BellRing },
              { value: "launches", label: "Launches", icon: Boxes },
              { value: "pdp", label: "PDP Quality", icon: Monitor },
            ]}
          />
        </div>

        {tab === "returns" && (
          <div>
            <div className="mb-3 rounded-lg bg-clay-soft/40 p-3 text-[12.5px] leading-relaxed text-ink-secondary">
              <span className="font-medium text-ink">Insight — </span>Daily Legging has strong conversion but an elevated return rate among first-time Studio Minimalist customers. Size-guide interaction reduces return probability by ~18%. Prioritize fit guidance and review snippets on PDP for new visitors. <span className="text-ink-muted">~{compactCurrency(totalPreventable)} of returns look preventable.</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Style</th>
                    <th className="py-2 pr-3 text-right font-medium">Return rate</th>
                    <th className="py-2 pr-3 font-medium">Top reason</th>
                    <th className="py-2 pr-3 font-medium">Exchange</th>
                    <th className="py-2 pr-3 font-medium">Fit risk</th>
                    <th className="py-2 pr-3 text-right font-medium">Return-adj. GP</th>
                    <th className="py-2 pl-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {returnsFitData.map((r) => (
                    <tr key={r.productId} className="border-b border-border/60 align-top hover:bg-surface-2/40">
                      <td className="py-2.5 pr-3 font-medium text-ink">{r.productName}</td>
                      <td className="tabular py-2.5 pr-3 text-right"><span className={r.returnRate > 0.12 ? "font-semibold text-negative" : "text-ink-secondary"}>{percent(r.returnRate, 0)}</span></td>
                      <td className="py-2.5 pr-3 text-ink-secondary">{r.topReason}</td>
                      <td className="py-2.5 pr-3"><Badge tone={r.sizeExchangeDirection === "Up" ? "warning" : r.sizeExchangeDirection === "Down" ? "ocean" : "neutral"}>{r.sizeExchangeDirection === "Balanced" ? "Balanced" : `Size ${r.sizeExchangeDirection.toLowerCase()}`}</Badge></td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <Progress value={r.fitRiskScore} tone={r.fitRiskScore > 60 ? "negative" : r.fitRiskScore > 40 ? "warning" : "positive"} className="w-12" />
                          <span className="tabular text-[12px] text-ink-secondary">{r.fitRiskScore}</span>
                        </div>
                      </td>
                      <td className="tabular py-2.5 pr-3 text-right font-semibold text-ink">{compactCurrency(r.returnAdjustedGrossProfit)}</td>
                      <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{r.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "waitlist" && (
          <div>
            <div className="mb-3 rounded-lg bg-sage-soft/40 p-3 text-[12.5px] leading-relaxed text-ink-secondary">
              <span className="font-medium text-ink">Insight — </span>Men's M/L in Sunday Performance Jogger is suppressing Denver and Salt Lake City revenue — back-in-stock demand suggests <span className="font-semibold text-sage-deep">~{compactCurrency(joggerRecoverable)}</span> recoverable on that style alone if replenishment is prioritized and lifecycle messaging launches within 24 hours of availability. Across the full waitlist, ~{compactCurrency(totalRecoverable)} looks recoverable within 30 days.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Style · Market · Size</th>
                    <th className="py-2 pr-3 text-right font-medium">Waitlist</th>
                    <th className="py-2 pr-3 text-right font-medium">Lost rev.</th>
                    <th className="py-2 pr-3 text-right font-medium">Recoverable</th>
                    <th className="py-2 pr-3 font-medium">Priority</th>
                    <th className="py-2 pl-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlistDemand.map((w) => (
                    <tr key={w.waitlistId} className="border-b border-border/60 align-top hover:bg-surface-2/40">
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-ink">{w.productName}</span>
                        <span className="ml-1.5 text-[11px] text-ink-muted">{w.market} · {w.size}</span>
                      </td>
                      <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{w.waitlistSignups.toLocaleString()}</td>
                      <td className="tabular py-2.5 pr-3 text-right text-negative">{compactCurrency(w.estimatedLostRevenue)}</td>
                      <td className="tabular py-2.5 pr-3 text-right font-semibold text-sage-deep">{compactCurrency(w.expectedRecoveryRevenue)}</td>
                      <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><Progress value={w.priorityScore} tone={w.priorityScore > 70 ? "negative" : "warning"} className="w-12" /><span className="tabular text-[12px] text-ink-secondary">{w.priorityScore}</span></div></td>
                      <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{w.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "launches" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {productLaunches.map((l) => (
              <div key={l.launchId} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-ink">{l.launchName}</div>
                    <div className="text-[11px] text-ink-muted">{l.primaryPersona} · {l.topMarkets.join(", ")}</div>
                  </div>
                  <span className={`tabular text-[14px] font-semibold ${l.actualRevenue >= l.forecastRevenue ? "text-positive" : "text-negative"}`}>
                    {signed(round1((l.actualRevenue / l.forecastRevenue - 1) * 100))}% vs plan
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <Mini label="New cust." value={percentRaw(l.newCustomerContribution * 100, 0)} />
                  <Mini label="Sell-through" value={percentRaw(l.sellThroughRate * 100, 0)} />
                  <Mini label="Quality" value={String(l.customerQualityScore)} />
                </div>
                <ResponsiveContainer width="100%" height={88}>
                  <LineChart data={l.sellThroughCurve} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                    <XAxis dataKey="week" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip cursor={false} content={({ active, payload }) => active && payload?.length ? <TooltipShell rows={[{ label: "Planned", value: `${(payload[0].payload as { planned: number }).planned}%`, color: CHART.muted }, { label: "Actual", value: `${(payload[0].payload as { actual: number }).actual}%`, color: CHART.sage }]} /> : null} />
                    <Line dataKey="planned" stroke={CHART.muted} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                    <Line dataKey="actual" stroke={CHART.sage} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-1 flex items-center justify-between">
                  <Badge tone={l.inventoryRisk === "High" ? "negative" : l.inventoryRisk === "Medium" ? "warning" : "positive"}>{l.inventoryRisk} inventory risk</Badge>
                  <span className="text-[11px] text-ink-muted">{l.forecastAccuracy}% accuracy</span>
                </div>
                <p className="mt-2 text-[12px] leading-snug text-ink-secondary"><span className="font-medium text-ink">Action — </span>{l.recommendedAction}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "pdp" && (
          <div>
            <div className="mb-3 rounded-lg bg-ocean-soft/40 p-3 text-[12.5px] leading-relaxed text-ink-secondary">
              <span className="font-medium text-ink">Insight — </span>Meta Pant has high traffic but a PDP Quality Score below the category benchmark, driven by fit uncertainty and limited visual merchandising for work-to-weekend use cases. Test commuter-focused PDP content.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Style</th>
                    <th className="py-2 pr-3 font-medium">PDP score</th>
                    <th className="py-2 pr-3 text-right font-medium">Fit clarity</th>
                    <th className="py-2 pr-3 text-center font-medium">Video</th>
                    <th className="py-2 pr-3 text-right font-medium">Reviews</th>
                    <th className="py-2 pr-3 text-right font-medium">Rev. opp.</th>
                    <th className="py-2 pl-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pdpQuality.map((p) => (
                    <tr key={p.productId} className="border-b border-border/60 align-top hover:bg-surface-2/40">
                      <td className="py-2.5 pr-3 font-medium text-ink">{p.productName}</td>
                      <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><Progress value={p.pdpQualityScore} tone={p.pdpQualityScore >= 80 ? "positive" : p.pdpQualityScore >= 70 ? "sage" : "warning"} className="w-14" /><span className="tabular text-[12px] font-semibold text-ink">{p.pdpQualityScore}</span></div></td>
                      <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{p.fitClarityScore}</td>
                      <td className="py-2.5 pr-3 text-center">{p.videoAvailable ? <span className="text-positive">✓</span> : <span className="text-ink-muted">—</span>}</td>
                      <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{p.reviewCount.toLocaleString()} · {p.reviewRating}</td>
                      <td className="tabular py-2.5 pr-3 text-right font-semibold text-sage-deep">{compactCurrency(p.revenueOpportunity)}</td>
                      <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{p.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2/50 p-1.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="tabular text-[13px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
