import { Gauge, Monitor, Smartphone, Tablet, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { deviceFunnel, funnel, funnelOpportunities, onsiteSearchIntent, siteSearchTerms } from "@/data/syntheticData";
import { compactCurrency, compactNumber, percentRaw, signedPercent } from "@/lib/formatters";

const DEVICE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Mobile: Smartphone,
  Desktop: Monitor,
  Tablet: Tablet,
};

export function ConversionFunnel() {
  const addToCart = funnel.find((f) => f.stage === "Add to Cart")!.value;
  const checkoutStarts = funnel.find((f) => f.stage === "Checkout Starts")!.value;
  const orders = funnel.find((f) => f.stage === "Orders")!.value;
  const cartAbandon = 1 - checkoutStarts / addToCart;
  const checkoutAbandon = 1 - orders / checkoutStarts;
  const mobileConv = deviceFunnel.find((d) => d.device === "Mobile")!.conversionRate;
  const desktopConv = deviceFunnel.find((d) => d.device === "Desktop")!.conversionRate;
  const totalOpp = funnelOpportunities.reduce((s, o) => s + o.monthlyImpact, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Conversion Funnel"
        businessQuestion="Where is ecommerce demand leaking before purchase?"
        subtitle="The path from session to order, where it drops off by device and stage, and a prioritized list of conversion fixes ranked by estimated revenue impact."
        badge={{ label: "Funnel diagnostics", tone: "ocean" }}
      />

      <HeroPanel
        eyebrow="Funnel insight"
        title="Mobile is 62% of sessions but converts ~38% below desktop — the clearest revenue leak is the mobile PDP."
        body="Product-view-to-cart drop-off concentrates on mobile, where PDP image load time correlates with bounce. Fixing mobile PDP performance is the single highest-confidence conversion play, ahead of checkout streamlining and earlier promotion of best-selling colorways."
        icon={<Gauge className="h-3.5 w-3.5" />}
        badge={{ label: "High confidence", tone: "positive" }}
        stats={[
          { label: "Mobile vs desktop conv.", value: signedPercent(((mobileConv - desktopConv) / desktopConv) * 100, 0), sub: "mobile gap", tone: "negative" },
          { label: "Cart abandonment", value: percentRaw(cartAbandon * 100, 0), sub: "add-to-cart → checkout", tone: "warning" },
          { label: "Checkout abandonment", value: percentRaw(checkoutAbandon * 100, 0), sub: "checkout → order", tone: "warning" },
          { label: "Prioritized upside", value: `${compactCurrency(totalOpp)}/mo`, sub: "if all addressed", tone: "positive" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionHeader question="Where does the funnel leak most?" hint="Step conversion from session to order." />
            <FunnelChart stages={funnel} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="How does conversion differ by device?" hint="Share of sessions vs conversion rate." />
            <div className="space-y-3">
              {deviceFunnel.map((d) => {
                const Icon = DEVICE_ICON[d.device];
                return (
                  <div key={d.device} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink"><Icon className="h-4 w-4 text-ink-muted" /> {d.device}</span>
                      <span className="tabular text-[13px] font-semibold text-ink">{d.conversionRate}%</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-[11px] text-ink-muted">Sessions</span>
                        <Progress value={d.sessions} tone="ocean" className="flex-1" />
                        <span className="tabular w-9 text-right text-[11px] text-ink-secondary">{d.sessions}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-[11px] text-ink-muted">Conversion</span>
                        <Progress value={d.conversionRate} max={5} tone={d.device === "Mobile" ? "warning" : "positive"} className="flex-1" />
                        <span className="tabular w-9 text-right text-[11px] text-ink-secondary">{d.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Opportunity prioritizer */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="Which conversion fixes should we prioritize?" hint="Ranked by estimated monthly revenue impact." />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Opportunity</th>
                    <th className="py-2 pr-3 text-right font-medium">Impact</th>
                    <th className="py-2 pr-3 font-medium">Conf.</th>
                    <th className="py-2 pl-3 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {[...funnelOpportunities].sort((a, b) => b.monthlyImpact - a.monthlyImpact).map((o, i) => (
                    <tr key={i} className="border-b border-border/60 align-top hover:bg-surface-2/40">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-ink">{o.opportunity}</div>
                        <div className="text-[11px] text-ink-muted">{o.stage}</div>
                      </td>
                      <td className="tabular py-2.5 pr-3 text-right font-semibold text-sage-deep">{o.estimatedImpact}</td>
                      <td className="py-2.5 pr-3"><Badge tone={o.confidence === "High" ? "positive" : o.confidence === "Medium" ? "warning" : "neutral"}>{o.confidence}</Badge></td>
                      <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{o.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Site search */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="What are shoppers searching for onsite?" hint="Search terms by volume, conversion, and trend." />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Term</th>
                    <th className="py-2 pr-3 text-right font-medium">Volume</th>
                    <th className="py-2 pr-3 text-right font-medium">Conv.</th>
                    <th className="py-2 pl-3 text-right font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {siteSearchTerms.map((t) => (
                    <tr key={t.term} className="border-b border-border/60 hover:bg-surface-2/40">
                      <td className="py-2.5 pr-3 font-medium text-ink">{t.term}</td>
                      <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{t.volume.toLocaleString()}</td>
                      <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{percentRaw(t.conversion * 100)}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <span className={`tabular inline-flex items-center gap-0.5 font-medium ${t.trend >= 0 ? "text-positive" : "text-negative"}`}>
                          {t.trend >= 0 && <TrendingUp className="h-3 w-3" />}
                          {signedPercent(t.trend, 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-ink-muted">Rising "dreamknit" and "wide leg pant" searches signal demand to surface earlier onsite.</p>
          </CardContent>
        </Card>
      </div>

      {/* Onsite Search & Intent Intelligence */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="What are shoppers telling Vuori they want before they purchase?" hint="Onsite search intent, zero-result gaps, and the content/landing-page opportunities behind them." />
          <div className="mb-3 rounded-lg bg-ocean-soft/40 p-3 text-[12.5px] leading-relaxed text-ink-secondary">
            <span className="font-medium text-ink">Insight — </span>Searches for "travel pants" are up 46% in Boston, New York, and London, but conversion is below average due to fragmented product discovery. Create a Travel &amp; Commuter landing page and test it against current search results.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Query · Intent</th>
                  <th className="py-2 pr-3 font-medium">Market</th>
                  <th className="py-2 pr-3 text-right font-medium">Sessions</th>
                  <th className="py-2 pr-3 text-right font-medium">Conv.</th>
                  <th className="py-2 pr-3 text-right font-medium">Zero-result</th>
                  <th className="py-2 pr-3 font-medium">Demand</th>
                  <th className="py-2 pl-3 font-medium">Recommended action</th>
                </tr>
              </thead>
              <tbody>
                {onsiteSearchIntent.map((q) => (
                  <tr key={q.searchId} className="border-b border-border/60 align-top hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5 font-medium text-ink">
                        "{q.query}"
                        {q.contentGap && <Badge tone="warning">Content gap</Badge>}
                      </div>
                      <div className="text-[11px] text-ink-muted">{q.normalizedIntent} · {q.relatedProducts.join(", ")}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{q.market}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactNumber(q.sessions)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{percentRaw(q.conversionRate * 100)}</td>
                    <td className="tabular py-2.5 pr-3 text-right"><span className={q.zeroResultRate > 0.15 ? "font-semibold text-negative" : "text-ink-secondary"}>{percentRaw(q.zeroResultRate * 100, 0)}</span></td>
                    <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><Progress value={q.demandSignalScore} tone={q.demandSignalScore >= 70 ? "positive" : "sage"} className="w-12" /><span className="tabular text-[12px] text-ink-secondary">{q.demandSignalScore}</span></div></td>
                    <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{q.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
