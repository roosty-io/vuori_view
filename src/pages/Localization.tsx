import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, CloudSun, Globe2, Palette, ShieldAlert, Shirt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { ColorPreferenceHeatmap, type HeatRow } from "@/components/charts/ColorPreferenceHeatmap";
import {
  COLORS,
  climateByMarket,
  marketNames,
  markets,
  personaColorMatrix,
  personas,
} from "@/data/syntheticData";

interface Playbook {
  overIndexCategories: string[];
  activitySignals: string[];
  creativeAngle: string;
  recommendedEvent: string;
  recommendedProducts: string[];
  risk: string;
}

const OVERRIDES: Record<string, Playbook> = {
  Denver: {
    overIndexCategories: ["Outerwear", "Bottoms (joggers)", "Layers"],
    activitySignals: ["Trail", "Ski", "Training", "Recovery"],
    creativeAngle: "Built for movement, styled for mountain weekends",
    recommendedEvent: "Trail club + recovery studio pop-up",
    recommendedProducts: ["Sunday Performance Jogger", "Meta Pant", "Canyon Insulated Jacket"],
    risk: "Size breaks in men's M/L could cap revenue",
  },
  Austin: {
    overIndexCategories: ["Bottoms", "Tops", "Layers"],
    activitySignals: ["Run", "Yoga", "Travel", "Recovery"],
    creativeAngle: "Built to move. Styled for every day.",
    recommendedEvent: "Run club + recovery studio activation",
    recommendedProducts: ["Villa Wideleg", "Daily Legging", "Halo Essential Hoodie"],
    risk: "Demand rising faster than localized inventory allocation",
  },
  Miami: {
    overIndexCategories: ["Shorts", "Tops", "Dresses"],
    activitySignals: ["Surf", "Travel", "Training"],
    creativeAngle: "Made for sun, salt, and motion",
    recommendedEvent: "Surf / coastal wellness activation",
    recommendedProducts: ["Coastal Training Tank", "Kore Short", "Villa Wideleg"],
    risk: "Warm-weather assortment depth limited outside peak season",
  },
  Boston: {
    overIndexCategories: ["Bottoms", "Tops", "Layers"],
    activitySignals: ["Commute", "Training", "Recovery"],
    creativeAngle: "From the commute to the meeting",
    recommendedEvent: "Studio takeover + commuter pop-up",
    recommendedProducts: ["Meta Pant", "Transit Commuter Shirt", "Restore Half Zip"],
    risk: "High CAC market — protect margin on prospecting",
  },
};

function buildPlaybook(marketName: string): Playbook {
  if (OVERRIDES[marketName]) return OVERRIDES[marketName];
  const m = markets.find((x) => x.market === marketName)!;
  const tops = m.topPersonas.map((pn) => personas.find((p) => p.personaName === pn)!);
  const categories = Array.from(new Set(tops.flatMap((p) => p.preferredCategories))).slice(0, 3);
  const activities = Array.from(new Set(tops.flatMap((p) => p.primaryActivities))).slice(0, 4);
  const products = Array.from(new Set(tops.flatMap((p) => p.preferredProducts))).slice(0, 3);
  return {
    overIndexCategories: categories,
    activitySignals: activities,
    creativeAngle: tops[0].bestMessage,
    recommendedEvent: m.recommendedAction,
    recommendedProducts: products,
    risk: "Validate inventory depth and competitor intensity before scaling spend",
  };
}

export function Localization() {
  const [marketSel, setMarketSel] = useState("Denver");
  const market = markets.find((m) => m.market === marketSel)!;
  const playbook = useMemo(() => buildPlaybook(marketSel), [marketSel]);
  const colorMatrix = useMemo(() => personaColorMatrix(), []);

  // Market × color affinity, weighted by the market's top personas.
  const marketColorRows: HeatRow[] = useMemo(() => {
    const weights = [0.5, 0.3, 0.2];
    return markets.map((m) => {
      const values: Record<string, number> = {};
      COLORS.forEach((c) => {
        let v = 0;
        m.topPersonas.forEach((pn, i) => {
          const row = colorMatrix.find((r) => r.persona === pn);
          v += (row?.values[c] ?? 0) * (weights[i] ?? 0.1);
        });
        values[c] = Math.round(v);
      });
      return { label: m.market, values };
    });
  }, [colorMatrix]);

  const tops = market.topPersonas.map((pn) => personas.find((p) => p.personaName === pn)!);
  const channelTally = useMemo(() => {
    const counts: Record<string, number> = {};
    tops.forEach((p) => p.preferredChannels.forEach((ch) => (counts[ch] = (counts[ch] ?? 0) + 1)));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tops]);
  const climate = climateByMarket[marketSel] ?? { season: "Four-season demand", demand: "Balanced assortment" };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Localization Intelligence"
        businessQuestion="What should Vuori say, sell, and prioritize by market?"
        subtitle="Market playbooks that translate persona mix, climate, and demand into localized assortment, creative, channel, and event recommendations."
        badge={{ label: "Market playbooks", tone: "ocean" }}
        actions={
          <Link to="/event-simulator">
            <Button variant="outline" size="sm"><CalendarRange className="h-4 w-4" /> Simulate event</Button>
          </Link>
        }
      />

      <HeroPanel
        eyebrow="Playbook example"
        title="Denver over-indexes on outdoor, trail, and recovery — lead with layering and mountain-weekend creative."
        body="Climate and persona signals point to outerwear, joggers, and layers, with trail, ski, training, and recovery activity. Recommend a trail club + recovery studio pop-up, featuring Sunday Performance Jogger, Meta Pant, and Canyon Insulated Jacket. Watch men's M/L size breaks."
        icon={<Globe2 className="h-3.5 w-3.5" />}
        badge={{ label: "Localize", tone: "clay" }}
        stats={[
          { label: "Outdoor activity index", value: String(markets.find((m) => m.market === "Denver")!.outdoorActivityIndex), sub: "well above avg", tone: "positive" },
          { label: "Top persona", value: "Trail & Recovery", sub: "Denver" },
          { label: "Climate window", value: "Nov–Mar", sub: "cold-weather peak" },
          { label: "Key risk", value: "Size breaks", sub: "men's M/L", tone: "warning" },
        ]}
      />

      {/* Playbook */}
      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionHeader question="What is the localized playbook for this market?" hint="Select a market to generate its assortment, creative, and activation plan." className="mb-0" />
            <Select value={marketSel} onChange={setMarketSel} options={marketNames} label="Market" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-2/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted"><Shirt className="h-3.5 w-3.5 text-sage" /> Over-indexing categories</div>
              <div className="flex flex-wrap gap-1.5">
                {playbook.overIndexCategories.map((c) => <Badge key={c} tone="sage">{c}</Badge>)}
              </div>
              <div className="mt-3 mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Activity signals</div>
              <div className="flex flex-wrap gap-1.5">
                {playbook.activitySignals.map((a) => <span key={a} className="rounded-md bg-surface px-2 py-0.5 text-[12px] text-ink-secondary">{a}</span>)}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/30 p-4">
              <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Best creative angle</div>
              <p className="text-[14px] font-medium text-ink">"{playbook.creativeAngle}"</p>
              <div className="mt-3 mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Recommended event</div>
              <p className="text-[13px] text-ink-secondary">{playbook.recommendedEvent}</p>
              <div className="mt-3 mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Recommended products</div>
              <div className="flex flex-wrap gap-1.5">
                {playbook.recommendedProducts.map((p) => <span key={p} className="rounded-md border border-border bg-surface px-2 py-0.5 text-[12px] text-ink-secondary">{p}</span>)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-surface-2/30 p-4">
                <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted"><CloudSun className="h-3.5 w-3.5 text-ocean" /> Climate-adjusted demand</div>
                <p className="text-[13px] font-medium text-ink">{climate.season}</p>
                <p className="text-[12.5px] text-ink-secondary">{climate.demand}</p>
              </div>
              <div className="rounded-xl border border-clay/30 bg-clay-soft/40 p-4">
                <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-clay"><ShieldAlert className="h-3.5 w-3.5" /> Localization risk</div>
                <p className="text-[13px] text-ink">{playbook.risk}</p>
              </div>
            </div>
          </div>

          {/* Channel preference */}
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Channel preference (top personas)</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {channelTally.map(([ch, count]) => (
                <div key={ch} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-[12px] text-ink-secondary">{ch}</span>
                  <Progress value={count} max={3} tone="ocean" className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color heatmap */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which colors resonate by market?" hint="Color affinity index 0–100, weighted by each market's persona mix." />
          <div className="mb-2 flex items-center gap-2 text-[11px] text-ink-muted"><Palette className="h-3.5 w-3.5" /> Deeper cells = stronger local color preference</div>
          <ColorPreferenceHeatmap rows={marketColorRows} columns={COLORS} tone="clay" rowHeader="Market" compact />
        </CardContent>
      </Card>
    </div>
  );
}
