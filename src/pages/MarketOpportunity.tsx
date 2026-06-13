import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, CalendarRange, ChevronDown, Globe2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { MarketMap } from "@/components/charts/MarketMap";
import { MarketBubbleChart } from "@/components/charts/MarketBubbleChart";
import { OPP_WEIGHTS, austin, marketComponents, markets } from "@/data/syntheticData";
import { compactCurrency, percent, signedPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const COMPONENT_META: { key: keyof typeof OPP_WEIGHTS; label: string }[] = [
  { key: "trafficGrowth", label: "Ecommerce traffic growth" },
  { key: "search", label: "Search demand index" },
  { key: "personaFit", label: "Persona fit" },
  { key: "repeat", label: "Repeat purchase index" },
  { key: "conversion", label: "Conversion rate index" },
  { key: "social", label: "Social mention velocity" },
  { key: "wellnessRun", label: "Wellness / run club density" },
  { key: "whitespace", label: "Retail whitespace" },
  { key: "competitorInverse", label: "Competitor intensity (inverse)" },
  { key: "income", label: "Income index" },
];

type SortKey = "opportunityScore" | "ecommerceTrafficGrowth" | "repeatPurchaseRate" | "searchDemandIndex" | "competitorIntensityIndex" | "ecommerceRevenue";

export function MarketOpportunity() {
  const [selected, setSelected] = useState("Austin");
  const [sortKey, setSortKey] = useState<SortKey>("opportunityScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const market = markets.find((m) => m.market === selected)!;
  const components = marketComponents[selected];

  const sorted = useMemo(() => {
    const arr = [...markets];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
    return arr;
  }, [sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const componentRows = COMPONENT_META.map((c) => {
    const value = components[c.key];
    const weight = OPP_WEIGHTS[c.key];
    return { ...c, value, weight, contribution: value * weight };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Market Opportunity Engine"
        businessQuestion="Where should Vuori localize investment next?"
        subtitle="A weighted opportunity model across ten demand, retention, lifestyle, and competition signals — ranking markets for localized media, events, product, and retail tests."
        badge={{ label: `Austin #1 · ${austin.opportunityScore}`, tone: "sage" }}
      />

      <HeroPanel
        eyebrow="Where to localize next"
        title={`Austin ranks #1 with a ${austin.opportunityScore} opportunity score — demand is rising faster than revenue capture.`}
        body="Austin leads on ecommerce traffic growth, search and social velocity, wellness and run-club density, repeat rate, and persona fit, with manageable competitor intensity. The window is open to localize messaging and activate community before competitors saturate the market."
        badge={{ label: "Opportunity", tone: "sage" }}
        stats={[
          { label: "Opportunity score", value: String(austin.opportunityScore), sub: "of 100", tone: "positive" },
          { label: "Traffic growth YoY", value: `+${austin.ecommerceTrafficGrowth}%`, sub: "vs network avg", tone: "positive" },
          { label: "Repeat rate", value: percent(austin.repeatPurchaseRate), sub: "14% above avg" },
          { label: "Competitor intensity", value: String(austin.competitorIntensityIndex), sub: "manageable" },
        ]}
        actions={
          <>
            <Link to="/event-simulator">
              <Button size="sm"><CalendarRange className="h-4 w-4" /> Simulate Austin activation</Button>
            </Link>
            <Link to="/localization">
              <Button variant="outline" size="sm"><Globe2 className="h-4 w-4" /> Localization playbook</Button>
            </Link>
          </>
        }
      />

      {/* Map + selected detail */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionHeader question="Where are the highest-opportunity markets?" hint="Bubble color = opportunity score, size = ecommerce revenue. Click to select." />
            <MarketMap markets={markets} selected={selected} onSelect={setSelected} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="flex h-full flex-col pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sage" />
                <span className="text-[16px] font-semibold text-ink">{market.market}</span>
                <span className="text-[12px] text-ink-muted">{market.country}</span>
              </div>
              <Badge tone={market.opportunityScore >= 84 ? "positive" : market.opportunityScore >= 72 ? "sage" : "neutral"}>
                Score {market.opportunityScore}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <Stat label="Ecommerce revenue" value={compactCurrency(market.ecommerceRevenue)} />
              <Stat label="Traffic growth" value={`+${market.ecommerceTrafficGrowth}%`} />
              <Stat label="Conversion" value={percent(market.conversionRate, 2)} />
              <Stat label="Repeat rate" value={percent(market.repeatPurchaseRate)} />
              <Stat label="Search demand" value={String(market.searchDemandIndex)} />
              <Stat label="Social velocity" value={`+${market.socialMentionVelocity}%`} />
            </div>

            <div className="mt-3">
              <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Top personas</div>
              <div className="flex flex-wrap gap-1.5">
                {market.topPersonas.map((p) => (
                  <span key={p} className="rounded-md bg-sage-soft/70 px-2 py-0.5 text-[11.5px] text-sage-deep">{p}</span>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <div className="rounded-lg bg-clay-soft/50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-clay">Recommended action</div>
                <p className="mt-0.5 text-[13px] font-medium text-ink">{market.recommendedAction}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking table */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="How do markets rank for localized investment?" hint="Sortable by any signal. Click a row to inspect the market." />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Market</th>
                  <SortableTh label="Opportunity" active={sortKey === "opportunityScore"} dir={sortDir} onClick={() => toggleSort("opportunityScore")} />
                  <SortableTh label="Traffic YoY" active={sortKey === "ecommerceTrafficGrowth"} dir={sortDir} onClick={() => toggleSort("ecommerceTrafficGrowth")} />
                  <SortableTh label="Repeat" active={sortKey === "repeatPurchaseRate"} dir={sortDir} onClick={() => toggleSort("repeatPurchaseRate")} />
                  <SortableTh label="Search" active={sortKey === "searchDemandIndex"} dir={sortDir} onClick={() => toggleSort("searchDemandIndex")} />
                  <SortableTh label="Competition" active={sortKey === "competitorIntensityIndex"} dir={sortDir} onClick={() => toggleSort("competitorIntensityIndex")} />
                  <th className="py-2 pl-3 font-medium">Recommended action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m, i) => (
                  <tr
                    key={m.market}
                    onClick={() => setSelected(m.market)}
                    className={cn(
                      "cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2/50",
                      selected === m.market && "bg-sage-soft/40",
                    )}
                  >
                    <td className="tabular py-2.5 pr-3 text-ink-muted">{i + 1}</td>
                    <td className="py-2.5 pr-3 font-medium text-ink">
                      {m.market}
                      <span className="ml-1.5 text-[11px] text-ink-muted">{m.country}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <Progress value={m.opportunityScore} tone={m.opportunityScore >= 84 ? "positive" : m.opportunityScore >= 72 ? "sage" : "neutral"} className="w-16" />
                        <span className="tabular font-semibold text-ink">{m.opportunityScore}</span>
                      </div>
                    </td>
                    <td className="tabular py-2.5 pr-3 text-ink-secondary">{signedPercent(m.ecommerceTrafficGrowth, 0)}</td>
                    <td className="tabular py-2.5 pr-3 text-ink-secondary">{percent(m.repeatPurchaseRate, 0)}</td>
                    <td className="tabular py-2.5 pr-3 text-ink-secondary">{m.searchDemandIndex}</td>
                    <td className="tabular py-2.5 pr-3 text-ink-secondary">{m.competitorIntensityIndex}</td>
                    <td className="py-2.5 pl-3 text-[12px] text-ink-secondary">{m.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bubble + components */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="Where is demand high but competition still manageable?" hint="Upper-left markets are the cleanest localization opportunities." />
            <MarketBubbleChart markets={markets} onSelect={setSelected} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <SectionHeader question={`What drives ${market.market}'s opportunity score?`} hint="Each signal is normalized 0–100, then weighted. The weighted sum is the score." />
            <div className="space-y-2">
              {componentRows.map((c) => (
                <div key={c.key} className="flex items-center gap-2.5">
                  <span className="w-[170px] shrink-0 truncate text-[12px] text-ink-secondary" title={c.label}>{c.label}</span>
                  <Progress value={c.value} tone={c.value >= 80 ? "positive" : c.value >= 60 ? "sage" : "warning"} className="flex-1" />
                  <span className="tabular w-7 text-right text-[12px] font-semibold text-ink">{Math.round(c.value)}</span>
                  <span className="tabular w-9 text-right text-[11px] text-ink-muted">×{Math.round(c.weight * 100)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-[12px] font-medium text-ink-secondary">Weighted opportunity score</span>
              <span className="tabular text-[18px] font-semibold text-sage-deep">{market.opportunityScore}</span>
            </div>
            <p className="mt-2 text-[11px] text-ink-muted">
              Methodology: traffic growth 15%, search 12%, persona fit 12%, repeat 10%, conversion 10%, social 10%, wellness/run 10%, whitespace 8%, competitor-inverse 7%, income 6%.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="tabular mt-0.5 text-[14px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function SortableTh({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <th className="py-2 pr-3 font-medium">
      <button onClick={onClick} className={cn("inline-flex items-center gap-1 hover:text-ink", active ? "text-ink" : "")}>
        {label}
        {active ? <ChevronDown className={cn("h-3 w-3 transition-transform", dir === "asc" && "rotate-180")} /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );
}
