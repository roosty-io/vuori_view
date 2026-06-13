import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ArrowRight, Compass, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Progress } from "@/components/ui/Progress";
import { PersonaAffinityGraph } from "@/components/charts/PersonaAffinityGraph";
import { ColorPreferenceHeatmap, type HeatRow } from "@/components/charts/ColorPreferenceHeatmap";
import { CHART, SERIES_COLORS, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import {
  COLORS,
  personaColorMatrix,
  personaProductMatrix,
  personas,
  productNames,
  visitorSignals,
} from "@/data/syntheticData";
import { currency, percent } from "@/lib/formatters";
import type { VisitorSignal } from "@/data/types";

function PersonaDistribution({ selected, onSelect }: { selected: string; onSelect: (p: string) => void }) {
  const max = Math.max(...personas.map((p) => p.share));
  return (
    <div className="space-y-1.5">
      {personas.map((p, i) => {
        const active = p.personaName === selected;
        return (
          <button
            key={p.personaName}
            onClick={() => onSelect(p.personaName)}
            className={`group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${active ? "bg-sage-soft/70" : "hover:bg-surface-2"}`}
          >
            <span className="w-5 text-center text-[13px]">{p.emoji}</span>
            <span className={`w-[148px] shrink-0 truncate text-[12.5px] ${active ? "font-semibold text-ink" : "text-ink-secondary"}`}>
              {p.personaName}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(p.share / max) * 100}%`, background: SERIES_COLORS[i % SERIES_COLORS.length] }}
              />
            </div>
            <span className="tabular w-9 text-right text-[12px] font-semibold text-ink">{percent(p.share, 0)}</span>
          </button>
        );
      })}
    </div>
  );
}

function VisitorCard({ v }: { v: VisitorSignal }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="ocean">{v.market}</Badge>
          <span className="text-[11px] text-ink-muted">
            {v.device} · {v.acquisitionChannel}
          </span>
        </div>
        {v.eventRsvp && <Badge tone="clay">Event RSVP</Badge>}
      </div>

      <div className="mt-3 text-[12px] font-medium uppercase tracking-wide text-ink-muted">Predicted persona mix</div>
      <div className="mt-1.5 space-y-1.5">
        {v.personaProbabilities.map((pp, i) => (
          <div key={pp.persona} className="flex items-center gap-2">
            <span className="w-[150px] shrink-0 truncate text-[12px] text-ink-secondary">{pp.persona}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full" style={{ width: `${pp.probability}%`, background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            </div>
            <span className="tabular w-9 text-right text-[12px] font-semibold text-ink">{pp.probability}%</span>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[12px]">
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-ink-muted">Predicted 90-day value</div>
          <div className="tabular font-semibold text-sage-deep">{currency(v.predictedLtv)}</div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-ink-muted">Confidence</div>
          <div className="tabular font-semibold text-ink">{v.personaConfidence}%</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-[12px] leading-snug text-ink-secondary">
        <p><span className="font-medium text-ink">Action — </span>{v.recommendedAction}</p>
        <p><span className="font-medium text-ink">Message — </span>"{v.recommendedMessage}"</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {v.recommendedProductCarousel.map((c) => (
            <span key={c} className="rounded-md border border-border bg-surface-2/60 px-1.5 py-0.5 text-[11px]">{c}</span>
          ))}
        </div>
      </div>
      <div className="mt-2 border-t border-border pt-2 text-[10.5px] text-ink-muted">
        Source signals: landing page, category & product views, colors viewed, market, device, session depth
      </div>
    </Card>
  );
}

export function ConsumerIntelligence() {
  const [selected, setSelected] = useState<string>("Performance Commuter");
  const [heatTab, setHeatTab] = useState("product");
  const persona = personas.find((p) => p.personaName === selected)!;

  const productMatrix = useMemo(() => personaProductMatrix(productNames), []);
  const colorMatrix = useMemo(() => personaColorMatrix(), []);

  const productRows: HeatRow[] = personas.map((p) => {
    const row = productMatrix.find((r) => r.persona === p.personaName)!;
    return { label: p.personaName, emoji: p.emoji, values: row.values };
  });
  const colorRows: HeatRow[] = personas.map((p) => {
    const row = colorMatrix.find((r) => r.persona === p.personaName)!;
    return { label: p.personaName, emoji: p.emoji, values: row.values };
  });

  const ltvCacData = personas.map((p, i) => ({
    x: p.cac,
    y: p.predictedLtv,
    z: p.share * 100,
    name: p.personaName,
    ratio: p.predictedLtv / p.cac,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  const topMarkets = Object.entries(persona.marketIndex)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Consumer Intelligence Graph"
        businessQuestion="Who is the customer, what do they care about, and what should Vuori show them next?"
        subtitle="Ten behavioral personas connected to product, color, activity, channel, and market affinity — plus live persona prediction for anonymous visitors."
        badge={{ label: "10 personas", tone: "sage" }}
        actions={
          <Link to="/right-message">
            <Button variant="outline" size="sm">
              <Target className="h-4 w-4" /> Activate messaging
            </Button>
          </Link>
        }
      />

      <HeroPanel
        eyebrow="Persona insight"
        title="Austin over-indexes on Performance Commuter, Wellness Socialite, and Studio Minimalist personas."
        body="These three personas carry strong product, color, and channel affinities — giving a clear blueprint for localized assortment, creative, and lifecycle messaging. Premium Basics Loyalist and Modern Dad Uniform drive the highest lifetime value at the lowest acquisition cost."
        badge={{ label: "Highest LTV:CAC — Premium Basics Loyalist", tone: "positive" }}
        stats={[
          { label: "Highest LTV", value: currency(620), sub: "Premium Basics Loyalist", tone: "positive" },
          { label: "Lowest CAC", value: currency(54), sub: "Premium Basics Loyalist" },
          { label: "Most engaged", value: "Wellness Socialite", sub: "creator-responsive" },
          { label: "Needs onboarding", value: "New Explorer", sub: "5% of base" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionHeader question="How is the customer base distributed across personas?" hint="Share of active customers. Click to focus." />
            <PersonaDistribution selected={selected} onSelect={setSelected} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <SectionHeader question="How do personas relate through shared product affinity?" hint="Lines connect personas that share preferred products. Click a node to focus." />
            <PersonaAffinityGraph personas={personas} selected={selected} onSelect={setSelected} />
          </CardContent>
        </Card>
      </div>

      {/* Selected persona detail */}
      <Card className="border-sage/25 bg-gradient-to-br from-sage-soft/30 to-surface">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="lg:w-[340px]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-2xl shadow-sm">{persona.emoji}</div>
                <div>
                  <div className="text-[17px] font-semibold text-ink">{persona.personaName}</div>
                  <div className="text-[12px] text-ink-secondary">{percent(persona.share, 0)} of base · LTV {currency(persona.predictedLtv)}</div>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-secondary">{persona.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[10px] uppercase text-ink-muted">AOV</div>
                  <div className="tabular text-[15px] font-semibold text-ink">{currency(persona.avgAov)}</div>
                </div>
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[10px] uppercase text-ink-muted">Repeat</div>
                  <div className="tabular text-[15px] font-semibold text-ink">{percent(persona.repeatRate, 0)}</div>
                </div>
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[10px] uppercase text-ink-muted">CAC</div>
                  <div className="tabular text-[15px] font-semibold text-ink">{currency(persona.cac)}</div>
                </div>
              </div>
              <div className="mt-2 rounded-lg border border-sage/25 bg-sage-soft/40 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-sage-deep">Customer Quality Score</span>
                  <span className="tabular text-[18px] font-semibold text-sage-deep">{persona.customerQualityScore}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-secondary">
                  <span>Promo dependency <span className="tabular font-semibold text-ink">{percent(persona.promoDependency, 0)}</span></span>
                  <span>Return risk <span className="tabular font-semibold text-ink">{percent(persona.returnRisk, 0)}</span></span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailList label="Preferred products" items={persona.preferredProducts} />
                <DetailList label="Preferred colors" items={persona.preferredColors} />
                <DetailList label="Primary activities" items={persona.primaryActivities} />
                <DetailList label="Preferred channels" items={persona.preferredChannels} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Best message</div>
                  <p className="text-[13px] font-medium text-ink">"{persona.bestMessage}"</p>
                  <div className="mt-2 mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Best next action</div>
                  <p className="text-[13px] text-ink-secondary">{persona.bestNextAction}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Top market concentration</div>
                  <div className="space-y-1.5">
                    {topMarkets.map(([m, idx]) => (
                      <div key={m} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 text-[12px] text-ink-secondary">{m}</span>
                        <Progress value={idx} max={175} tone="ocean" className="flex-1" />
                        <span className="tabular w-9 text-right text-[12px] font-semibold text-ink">{idx}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 text-[10.5px] text-ink-muted">Index vs network average (100 = avg)</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affinity heatmaps */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader
              question="What does each persona prefer — by product and by color?"
              hint="Affinity index 0–100. Deeper cells mean stronger preference."
              className="mb-0"
            />
            <Tabs
              items={[
                { value: "product", label: "Product affinity" },
                { value: "color", label: "Color preference" },
              ]}
              value={heatTab}
              onChange={setHeatTab}
            />
          </div>
          <div className="mt-4">
            {heatTab === "product" ? (
              <ColorPreferenceHeatmap rows={productRows} columns={productNames} tone="sage" />
            ) : (
              <ColorPreferenceHeatmap rows={colorRows} columns={COLORS} tone="clay" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* LTV vs CAC */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which personas have the highest LTV and most efficient acquisition?" hint="Bubble size = share of base. Upper-left = high value, low cost." />
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 16, right: 24, left: 8, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" {...axisProps} domain={[40, 95]} tickFormatter={(v: number) => currency(v)} label={{ value: "Acquisition cost (CAC) →", position: "insideBottom", offset: -8, fill: CHART.muted, fontSize: 11 }} />
              <YAxis type="number" dataKey="y" {...axisProps} width={52} domain={[200, 680]} tickFormatter={(v: number) => currency(v)} label={{ value: "Predicted LTV", angle: -90, position: "insideLeft", fill: CHART.muted, fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" range={[120, 900]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof ltvCacData)[number];
                  return (
                    <TooltipShell
                      title={p.name}
                      rows={[
                        { label: "Predicted LTV", value: currency(p.y) },
                        { label: "CAC", value: currency(p.x) },
                        { label: "LTV:CAC", value: `${p.ratio.toFixed(1)}x` },
                      ]}
                    />
                  );
                }}
              />
              <Scatter data={ltvCacData} onClick={(d: { name?: string }) => d?.name && setSelected(d.name)} cursor="pointer">
                {ltvCacData.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={d.name === selected ? 1 : 0.72} stroke={d.name === selected ? CHART.ink : d.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Visitor persona assignment */}
      <div>
        <SectionHeader
          question="Who is the anonymous visitor — and what should we show them right now?"
          hint="Live persona prediction with confidence, predicted value, and a recommended next action for each visitor."
          action={
            <Link to="/market-opportunity">
              <Button variant="ghost" size="sm">
                <Compass className="h-3.5 w-3.5" /> See market view <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visitorSignals.map((v) => (
            <VisitorCard key={v.visitorId} v={v} />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-muted">
          <Sparkles className="h-3 w-3" /> Persona prediction is model-supported and privacy-safe (no PII). Recommendations are human-approvable before activation.
        </p>
      </div>
    </div>
  );
}

function DetailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span key={it} className="rounded-md bg-surface-2/70 px-2 py-0.5 text-[12px] text-ink-secondary">{it}</span>
        ))}
      </div>
    </div>
  );
}
