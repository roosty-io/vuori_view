import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, FlaskConical, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Progress } from "@/components/ui/Progress";
import { EventHaloChart } from "@/components/charts/EventHaloChart";
import { EVENT_TYPES, marketNames, markets, personas } from "@/data/syntheticData";
import { EVENT_TYPE_PRIORS, computeEventRoi, type EventInputs } from "@/lib/scoring";
import type { EventType } from "@/data/types";
import { compactCurrency, compactNumber, currency, multiplier } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const POST_EVENT_CONV = 0.28;

interface SimState {
  duration: number;
  costK: number;
  attendance: number;
  leadCapturePct: number;
  mediaK: number;
  partners: number;
  promoPct: number;
  followUpPct: number;
}

const DEFAULT: SimState = {
  duration: 3,
  costK: 108,
  attendance: 1200,
  leadCapturePct: 72,
  mediaK: 45,
  partners: 3,
  promoPct: 20,
  followUpPct: 70,
};

function toInputs(s: SimState, type: EventType): EventInputs {
  const prior = EVENT_TYPE_PRIORS[type];
  return {
    eventDurationDays: s.duration,
    eventCost: s.costK * 1000,
    expectedAttendance: s.attendance,
    leadCaptureRate: s.leadCapturePct / 100,
    localMediaSpend: s.mediaK * 1000,
    partnerCount: s.partners,
    promoDepth: s.promoPct / 100,
    followUpIntensity: s.followUpPct / 100,
    conversionRate: prior.conversionRate,
    aov: prior.aov,
    postEventConversionRate: POST_EVENT_CONV,
  };
}

function OutBig({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "sage" | "clay" | "ocean" }) {
  const color = tone === "clay" ? "text-clay" : tone === "ocean" ? "text-ocean" : "text-sage-deep";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={cn("tabular mt-1 text-[24px] font-semibold leading-none", color)}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-ink-muted">{sub}</div>}
    </div>
  );
}

export function EventSimulator() {
  const [marketSel, setMarketSel] = useState("Austin");
  const [eventType, setEventType] = useState<EventType>("Run club event");
  const [s, setS] = useState<SimState>(DEFAULT);

  const set = (key: keyof SimState) => (v: number) => setS((prev) => ({ ...prev, [key]: v }));

  const onEventType = (t: string) => {
    const type = t as EventType;
    setEventType(type);
    setS((prev) => ({ ...prev, leadCapturePct: Math.round(EVENT_TYPE_PRIORS[type].leadCaptureRate * 100) }));
  };

  const out = useMemo(() => computeEventRoi(toInputs(s, eventType)), [s, eventType]);

  const market = markets.find((m) => m.market === marketSel)!;
  const recoPersonas = market.topPersonas;
  const recoProducts = useMemo(() => {
    const set = new Set<string>();
    recoPersonas.forEach((pn) => {
      const p = personas.find((x) => x.personaName === pn);
      p?.preferredProducts.slice(0, 2).forEach((pr) => set.add(pr));
    });
    return Array.from(set).slice(0, 5);
  }, [recoPersonas]);

  // Scenario comparison across event types with shared inputs.
  const comparison = useMemo(
    () =>
      (["Run club event", "Yoga/pilates studio takeover", "Outdoor trail event", "Ambassador/community event"] as EventType[]).map((t) => ({
        type: t,
        out: computeEventRoi(toInputs(s, t)),
      })),
    [s],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pop-Up & Event Simulator"
        businessQuestion="Which local activation would create the strongest ecommerce halo?"
        subtitle="Model event-period revenue, lead capture, new-customer CAC, and 30/60/90-day ecommerce halo for any market and activation type — then compare and design the test."
        badge={{ label: `${marketSel} · ${eventType}`, tone: "ocean" }}
        actions={
          <Link to="/market-opportunity">
            <Button variant="outline" size="sm"><CalendarRange className="h-4 w-4" /> Market ranking</Button>
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Controls */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Market" value={marketSel} onChange={setMarketSel} options={marketNames} />
              <Select label="Event type" value={eventType} onChange={onEventType} options={EVENT_TYPES as unknown as string[]} />
            </div>
            <div className="space-y-3.5 border-t border-border pt-4">
              <Slider label="Event duration" value={s.duration} onChange={set("duration")} min={1} max={5} suffix=" days" />
              <Slider label="Event cost" value={s.costK} onChange={set("costK")} min={20} max={250} step={2} prefix="$" suffix="k" tone="clay" />
              <Slider label="Expected attendance" value={s.attendance} onChange={set("attendance")} min={200} max={3000} step={50} />
              <Slider label="Lead capture rate" value={s.leadCapturePct} onChange={set("leadCapturePct")} min={30} max={90} suffix="%" />
              <Slider label="Local paid media spend" value={s.mediaK} onChange={set("mediaK")} min={0} max={150} step={2} prefix="$" suffix="k" tone="clay" />
              <Slider label="Creator / partner count" value={s.partners} onChange={set("partners")} min={1} max={10} tone="ocean" />
              <Slider label="Promo depth" value={s.promoPct} onChange={set("promoPct")} min={0} max={40} suffix="%" tone="clay" />
              <Slider label="Post-event follow-up intensity" value={s.followUpPct} onChange={set("followUpPct")} min={0} max={100} step={5} suffix="%" tone="ocean" />
            </div>
          </CardContent>
        </Card>

        {/* Outputs */}
        <div className="space-y-5 lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <OutBig label="Event-period revenue" value={compactCurrency(out.eventRevenue)} sub="in-market + onsite" tone="sage" />
            <OutBig label="90-day halo revenue" value={compactCurrency(out.haloRevenue90d)} sub="ecommerce lift" tone="clay" />
            <OutBig label="Event ROI" value={multiplier(out.projectedRoi)} sub="on total investment" tone="ocean" />
            <OutBig label="Leads captured" value={compactNumber(out.leadsCaptured)} sub="first-party" />
            <OutBig label="New customers" value={compactNumber(out.newCustomers)} sub={`CAC ${currency(out.cac)}`} />
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Confidence</div>
              <div className="tabular mt-1 text-[24px] font-semibold leading-none text-ink">{out.confidence}%</div>
              <Progress value={out.confidence} tone={out.confidence >= 80 ? "positive" : "sage"} className="mt-2" />
            </div>
          </div>

          <Card>
            <CardContent className="pt-5">
              <SectionHeader question="How does the ecommerce halo build over 90 days?" hint="Day-0 activation spike, then exponentially decaying lifecycle-driven lift." />
              <EventHaloChart eventRevenue={out.eventRevenue} halo90={out.haloRevenue90d} />
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: "30-day halo", value: out.haloRevenue30d },
                  { label: "60-day halo", value: out.haloRevenue60d },
                  { label: "90-day halo", value: out.haloRevenue90d },
                ].map((h) => (
                  <div key={h.label} className="rounded-lg bg-surface-2/50 p-2.5 text-center">
                    <div className="text-[10.5px] uppercase tracking-wide text-ink-muted">{h.label}</div>
                    <div className="tabular text-[15px] font-semibold text-ink">{compactCurrency(h.value)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              <Users className="h-3.5 w-3.5 text-sage" /> Recommended personas
            </div>
            <div className="space-y-1.5">
              {recoPersonas.map((p) => {
                const persona = personas.find((x) => x.personaName === p)!;
                return (
                  <div key={p} className="flex items-center gap-2 rounded-lg bg-surface-2/40 px-2.5 py-1.5">
                    <span>{persona.emoji}</span>
                    <span className="text-[13px] font-medium text-ink">{p}</span>
                    <span className="ml-auto text-[11px] text-ink-muted">idx {persona.marketIndex[marketSel]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              <Sparkles className="h-3.5 w-3.5 text-clay" /> Recommended products
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recoProducts.map((p) => (
                <span key={p} className="rounded-md border border-border bg-surface px-2 py-1 text-[12px] text-ink-secondary">{p}</span>
              ))}
            </div>
            <div className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Lifecycle flow</div>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-secondary">
              Lead capture → welcome series → local event invite → first-purchase incentive → 60-day winback
            </p>
          </CardContent>
        </Card>

        <Card className="border-ocean/30 bg-gradient-to-br from-ocean-soft/40 to-surface">
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ocean">
              <FlaskConical className="h-3.5 w-3.5" /> Test design
            </div>
            <p className="text-[13px] leading-relaxed text-ink-secondary">
              {marketSel} vs matched control markets. Measure lead capture, new-customer CAC, conversion lift, repeat
              purchase rate, incremental revenue, and 90-day ecommerce halo.
            </p>
            <div className="mt-3">
              <Badge tone="warning">Human approval required</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incrementality, control markets & landing page */}
      <Card className="border-ocean/25 bg-gradient-to-br from-ocean-soft/30 to-surface">
        <CardContent className="pt-5">
          <SectionHeader question="Is this incremental — and how would we route and measure it?" hint="Attributed vs incremental, recommended control markets, customer-quality forecast, and the on-site landing page." />
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-3.5">
              <div className="text-[11px] uppercase tracking-wide text-ink-muted">Attributed (event + halo)</div>
              <div className="tabular mt-1 text-[18px] font-semibold text-ink">{compactCurrency(out.totalRevenue)}</div>
              <div className="mt-1.5 text-[11px] uppercase tracking-wide text-ink-muted">Est. incremental (~72%)</div>
              <div className="tabular text-[18px] font-semibold text-sage-deep">{compactCurrency(Math.round(out.totalRevenue * 0.72))}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3.5">
              <div className="text-[11px] uppercase tracking-wide text-ink-muted">Recommended control markets</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {market.recommendedControlMarkets.map((m) => (
                  <Badge key={m} tone="ocean">{m}</Badge>
                ))}
              </div>
              <div className="mt-2 text-[10.5px] text-ink-muted">Matched-market incrementality design</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3.5">
              <div className="text-[11px] uppercase tracking-wide text-ink-muted">Customer-quality forecast</div>
              <div className="tabular mt-1 text-[24px] font-semibold leading-none text-sage-deep">
                {Math.round(recoPersonas.reduce((s, pn) => s + (personas.find((p) => p.personaName === pn)?.customerQualityScore ?? 75), 0) / recoPersonas.length)}
              </div>
              <div className="mt-1.5 text-[11px] text-ink-muted">vs ~71 paid-social average</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3.5">
              <div className="text-[11px] uppercase tracking-wide text-ink-muted">QR → landing page</div>
              <p className="mt-1 text-[12.5px] leading-snug text-ink-secondary">Route QR scans & creator links to a curated on-site edit to measure offline-to-online sales.</p>
              <Link to="/community-commerce" className="mt-2 inline-block">
                <Button variant="outline" size="sm">Open Community Commerce</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario comparison */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which activation type returns the most for the same investment?" hint="Same controls applied across event types." />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Event type</th>
                  <th className="py-2 pr-3 text-right font-medium">Event revenue</th>
                  <th className="py-2 pr-3 text-right font-medium">90-day halo</th>
                  <th className="py-2 pr-3 text-right font-medium">Leads</th>
                  <th className="py-2 pr-3 text-right font-medium">ROI</th>
                  <th className="py-2 pl-3 text-right font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((c) => (
                  <tr key={c.type} className={cn("border-b border-border/60", c.type === eventType && "bg-sage-soft/40")}>
                    <td className="py-2.5 pr-3 font-medium text-ink">
                      {c.type}
                      {c.type === eventType && <span className="ml-2 text-[11px] text-sage-deep">selected</span>}
                    </td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(c.out.eventRevenue)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(c.out.haloRevenue90d)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactNumber(c.out.leadsCaptured)}</td>
                    <td className="tabular py-2.5 pr-3 text-right font-semibold text-ink">{multiplier(c.out.projectedRoi)}</td>
                    <td className="tabular py-2.5 pl-3 text-right text-ink-secondary">{c.out.confidence}%</td>
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
