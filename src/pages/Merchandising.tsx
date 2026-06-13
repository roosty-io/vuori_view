import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PackageX, Shirt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { MarginVelocityScatter } from "@/components/charts/MarginVelocityScatter";
import { CHART, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import { inventoryRisk, products } from "@/data/syntheticData";
import { compactCurrency, percent } from "@/lib/formatters";
import type { Product } from "@/data/types";
import { groupBy, sumBy } from "@/lib/utils";

const RECO_TONE: Record<Product["recommendation"], BadgeTone> = {
  Push: "positive",
  Replenish: "ocean",
  Localize: "clay",
  Protect: "warning",
  Hold: "neutral",
};

const LAUNCHES = [
  { name: "DreamKnit Layer", vsPlan: 18, read: "Beating plan — accelerate buy & marketing", status: "Ahead of Plan" },
  { name: "Cloudridge Lined Pant", vsPlan: -7, read: "Soft early read — hold incremental buy", status: "Watch" },
  { name: "Restore Half Zip", vsPlan: 11, read: "On margin & velocity — replenish core sizes", status: "On Track" },
];

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

        {/* Launch scorecard */}
        <Card>
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              <PackageX className="h-3.5 w-3.5 text-sage" /> Product launch scorecard
            </div>
            <div className="space-y-3">
              {LAUNCHES.map((l) => (
                <div key={l.name} className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">{l.name}</span>
                    <span className={`tabular text-[13px] font-semibold ${l.vsPlan >= 0 ? "text-positive" : "text-negative"}`}>{l.vsPlan >= 0 ? "+" : ""}{l.vsPlan}% vs plan</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-ink-secondary">{l.read}</p>
                  <Badge tone={l.status === "Ahead of Plan" ? "positive" : l.status === "Watch" ? "warning" : "sage"} className="mt-2">{l.status}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-ink-muted">Early-read model compares first weeks of sell-through to comparable launch curves.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
