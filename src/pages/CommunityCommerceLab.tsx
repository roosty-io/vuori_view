import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CalendarRange,
  CheckCircle2,
  Circle,
  ExternalLink,
  Lock,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Progress } from "@/components/ui/Progress";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { EventHaloChart } from "@/components/charts/EventHaloChart";
import { ColorPreferenceHeatmap, type HeatRow } from "@/components/charts/ColorPreferenceHeatmap";
import { CHART, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import {
  activationLandingPages,
  commissionScenarios,
  creatorPartners,
  personaCreatorMatrix,
  personaNames,
  products,
} from "@/data/syntheticData";
import { Rng, round } from "@/data/seed";
import { computeCommission } from "@/lib/scoring";
import type { ActivationLandingPage, FunnelStage } from "@/data/types";
import { compactCurrency, compactNumber, currency, multiplier, number, percent, percentRaw } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const COLOR_HEX: Record<string, string> = {
  "Heather Sage": "#9aa386",
  Black: "#2b2a27",
  "Coastal Blue": "#6f8a91",
  Clay: "#b87955",
  Stone: "#d8cfc0",
  "Dusty Olive": "#7c8266",
  Oat: "#e4dccb",
  Storm: "#5b626a",
  Sand: "#ddc9a8",
  Charcoal: "#3d3c39",
};

const STRATEGY = [
  { persona: "Performance Commuter", event: "Run club event", angle: "Sunrise-miles + commuter performance edit", products: "Meta Pant, Restore Half Zip" },
  { persona: "Trail & Recovery", event: "Outdoor trail event", angle: "Climb / descent / recovery layering", products: "Canyon Insulated Jacket, Sunday Performance Jogger" },
  { persona: "Studio Minimalist", event: "Yoga / pilates takeover", angle: "Matching sets + soft performance", products: "Daily Legging, Villa Wideleg" },
  { persona: "Coastal Active", event: "Surf / coastal activation", angle: "Warm-weather, salt-and-motion", products: "Coastal Training Tank, Kore Short" },
  { persona: "Wellness Socialite", event: "Ambassador / community event", angle: "Community-first, creator-amplified", products: "Daily Legging, Halo Essential Hoodie" },
  { persona: "Travel Weekender", event: "Product launch preview", angle: "Airport-to-table travel edit", products: "Villa Wideleg, DreamKnit Layer" },
];

const COMPLIANCE_ITEMS = [
  "Disclosure required (#ad / paid partnership)",
  "Affiliate relationship documented",
  "Commission terms approved",
  "Landing page claims reviewed",
  "UTM / QR tracking active",
  "Return-adjusted commission rules defined",
];

function StorefrontPreview({ page }: { page: ActivationLandingPage }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-2/50 px-3 py-2">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        </span>
        <div className="ml-1 flex flex-1 items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-ink-muted">
          <Lock className="h-3 w-3" /> vuori.com<span className="text-ink">{page.urlSlug}</span>
        </div>
        <QrCode className="h-4 w-4 text-ink-muted" />
      </div>
      {/* hero */}
      <div className="hero-grain bg-gradient-to-br from-sage-soft/60 to-surface px-4 py-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sage-deep">{page.market} · Curated edit</div>
        <h3 className="font-display mt-1 text-[20px] font-semibold leading-tight text-ink">{page.heroMessage}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {page.targetPersonas.map((p) => (
            <Badge key={p} tone="sage">{p}</Badge>
          ))}
        </div>
      </div>
      {/* featured products */}
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {page.featuredProducts.map((name) => {
          const prod = products.find((p) => p.productName === name);
          const hex = prod ? COLOR_HEX[prod.color] ?? "#d8cfc0" : "#d8cfc0";
          return (
            <div key={name} className="rounded-lg border border-border bg-surface p-2">
              <div className="h-14 w-full rounded-md" style={{ background: hex }} />
              <div className="mt-1.5 truncate text-[11.5px] font-medium text-ink" title={name}>{name}</div>
              <div className="tabular text-[11px] text-ink-muted">{prod ? currency(prod.price) : "—"}</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-ink-muted">
        <span>UTM: {page.utmCampaign}</span>
        <span className="flex items-center gap-1">{page.qrCodeId} <ExternalLink className="h-3 w-3" /></span>
      </div>
    </div>
  );
}

export function CommunityCommerceLab() {
  const [pageId, setPageId] = useState("LP-001");
  const [sortBy, setSortBy] = useState<"attributedRevenue" | "incrementalRevenue" | "roi" | "brandFitScore">("attributedRevenue");
  const [commissionRate, setCommissionRate] = useState(10);
  const [newCustomerBonus, setNewCustomerBonus] = useState(0);
  const [leadBonus, setLeadBonus] = useState(0);
  const [returnAdjusted, setReturnAdjusted] = useState(true);
  const [compliance, setCompliance] = useState<boolean[]>([true, true, false, true, true, false]);

  const page = activationLandingPages.find((p) => p.landingPageId === pageId)!;
  const partner = creatorPartners.find((c) => c.partnerId === page.partnerId);
  const leads = page.emailCaptures + page.smsCaptures;

  const funnelStages: FunnelStage[] = useMemo(() => {
    const raw = [
      { stage: "QR scans", value: page.qrScans },
      { stage: "Landing sessions", value: page.sessions },
      { stage: "Product views", value: page.productViews },
      { stage: "Add to cart", value: page.addToCart },
      { stage: "Orders", value: page.orders },
    ];
    return raw.map((s, i) => ({ ...s, conversionFromPrev: i === 0 ? 100 : round((s.value / raw[i - 1].value) * 100, 1) }));
  }, [page]);

  const assortment = useMemo(() => {
    const weights = page.featuredProducts.map((name) => {
      const prod = products.find((p) => p.productName === name);
      const roleW = prod?.productRole === "Hero" ? 1.5 : prod?.productRole === "Driver" ? 1.1 : 0.8;
      const r = new Rng(page.landingPageId + name);
      return roleW * r.range(0.85, 1.15);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    return page.featuredProducts.map((name, i) => {
      const prod = products.find((p) => p.productName === name);
      const share = weights[i] / total;
      return {
        name,
        color: prod?.color ?? "",
        revenue: Math.round(page.revenue * share),
        units: Math.round(page.orders * 1.18 * share),
        share,
        returnRate: prod?.returnRate ?? 0.09,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [page]);

  const incData = [
    { label: "Attributed (direct)", value: page.revenue, fill: CHART.muted },
    { label: "90-day halo", value: page.haloRevenue90d, fill: CHART.ocean },
    { label: "Incremental", value: page.incrementalRevenueEstimate, fill: CHART.sage },
    { label: "Cannibalized", value: page.cannibalizedRevenueEstimate, fill: CHART.clay },
  ];
  const influenced = page.revenue + page.haloRevenue90d;
  const incrementalityRate = page.incrementalRevenueEstimate / influenced;

  const leaderboard = useMemo(() => [...creatorPartners].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number)), [sortBy]);

  const matrixRows: HeatRow[] = useMemo(
    () => personaCreatorMatrix().map((r) => ({ label: r.creator, values: r.values })),
    [],
  );

  // Commission simulator
  const marginRate = page.grossMargin / page.revenue;
  const sim = computeCommission({
    baseRevenue: page.revenue,
    baseNewCustomers: page.newCustomers,
    baseLeads: leads,
    commissionRate: commissionRate / 100,
    newCustomerBonus,
    leadBonus,
    marginRate,
    returnRate: page.returnRate,
    ltvPerCustomer: 478,
    returnAdjusted,
  });
  const simRecTone = sim.marginAfterCommissionRate >= 46 ? "positive" : sim.marginAfterCommissionRate >= 40 ? "sage" : "warning";
  const simRec = sim.marginAfterCommissionRate >= 46 ? "Margin-protective" : sim.newCustomers >= page.newCustomers * 1.08 ? "Acquisition-led" : "Balanced";

  const nextBest = creatorPartners
    .filter((c) => c.status === "Proposed" || c.status === "In Test")
    .sort((a, b) => b.brandFitScore - a.brandFitScore)
    .slice(0, 4);

  const completedCompliance = compliance.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community Commerce Lab"
        businessQuestion="Which creators, ambassadors, events, landing pages, and curated assortments drive incremental DTC growth?"
        subtitle="On-site activation landing pages turn creators, ambassadors, affiliates, and local events into measurable DTC sales — tracking QR-to-purchase, new customers, margin after commission, and 90-day halo. Internal ecommerce capability; not data resale."
        badge={{ label: "Offline → on-site DTC", tone: "clay" }}
        actions={
          <Link to="/event-simulator">
            <Button variant="outline" size="sm"><CalendarRange className="h-4 w-4" /> Event simulator</Button>
          </Link>
        }
      />

      <HeroPanel
        eyebrow="Flagship activation"
        title="The Austin run-club activation routes QR scans and creator links to a curated on-site landing page."
        body="A dedicated /austin-run-club edit lets Vuori measure offline-to-online conversion, first-party lead capture, margin after commission, and the 90-day ecommerce halo — turning a community moment into attributable, incremental DTC revenue."
        icon={<Store className="h-3.5 w-3.5" />}
        badge={{ label: "84% confidence", tone: "positive" }}
        stats={[
          { label: "QR scans", value: compactNumber(8400), sub: "→ on-site" },
          { label: "Leads captured", value: compactNumber(2900), sub: "email + SMS", tone: "positive" },
          { label: "Event revenue", value: "$180K", sub: "page-period" },
          { label: "90-day halo", value: "$560K", sub: "3.7x ROI", tone: "positive" },
        ]}
      />

      {/* Selector + preview + metrics */}
      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionHeader question="What does the on-site activation page look like — and how is it performing?" hint="Select an activation to preview its curated storefront edit and live metrics." className="mb-0" />
            <Select
              value={pageId}
              onChange={setPageId}
              label="Activation page"
              options={activationLandingPages.map((p) => ({ value: p.landingPageId, label: `${p.name} (${p.urlSlug})` }))}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <StorefrontPreview page={page} />
            <div>
              <div className="mb-2 flex items-center gap-2">
                {partner && <Badge tone="ocean">{partner.partnerType}</Badge>}
                {partner && <span className="text-[12px] text-ink-secondary">{partner.name}</span>}
                <span className="ml-auto text-[11px] text-ink-muted">{page.market}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <Metric label="QR scans" value={compactNumber(page.qrScans)} />
                <Metric label="Sessions" value={compactNumber(page.sessions)} />
                <Metric label="Leads" value={compactNumber(leads)} tone="sage" />
                <Metric label="Orders" value={number(page.orders)} />
                <Metric label="Revenue" value={compactCurrency(page.revenue)} tone="sage" />
                <Metric label="New customers" value={number(page.newCustomers)} />
                <Metric label="Commission payout" value={compactCurrency(page.commissionPayout)} tone="clay" />
                <Metric label="Margin after comm." value={compactCurrency(page.marginAfterCommission)} tone="sage" />
                <Metric label="90-day halo" value={compactCurrency(page.haloRevenue90d)} tone="ocean" />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2 text-[12px]">
                <span className="text-ink-secondary">Activation ROI · confidence</span>
                <span className="tabular font-semibold text-ink">{multiplier(page.roi)} · {page.confidence}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funnel + halo */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="How does a QR scan turn into a purchase?" hint={`QR-to-purchase funnel · ${compactNumber(leads)} leads captured along the way.`} />
            <FunnelChart stages={funnelStages} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="How does the ecommerce halo build over 90 days?" hint="Day-0 activation, then decaying lifecycle-driven on-site lift." />
            <EventHaloChart eventRevenue={page.revenue} halo90={page.haloRevenue90d} />
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "30-day", value: page.haloRevenue30d },
                { label: "60-day", value: page.haloRevenue60d },
                { label: "90-day", value: page.haloRevenue90d },
              ].map((h) => (
                <div key={h.label} className="rounded-lg bg-surface-2/50 p-2.5 text-center">
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-muted">{h.label} halo</div>
                  <div className="tabular text-[15px] font-semibold text-ink">{compactCurrency(h.value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incrementality + assortment */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="What's incremental vs simply attributed?" hint={`${percent(incrementalityRate, 0)} of influenced revenue is modeled as incremental.`} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={incData} margin={{ top: 18, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" {...axisProps} interval={0} tick={{ fill: CHART.muted, fontSize: 10 }} />
                <YAxis {...axisProps} width={46} tickFormatter={(v: number) => compactCurrency(v)} />
                <Tooltip
                  cursor={{ fill: CHART.grid, fillOpacity: 0.2 }}
                  content={({ active, payload }) => active && payload?.length ? <TooltipShell title={(payload[0].payload as { label: string }).label} rows={[{ label: "Revenue", value: compactCurrency((payload[0].payload as { value: number }).value) }]} /> : null}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={56}>
                  {incData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                  <LabelList dataKey="value" position="top" formatter={(v: number) => compactCurrency(v)} style={{ fill: CHART.muted, fontSize: 10, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-[11px] leading-snug text-ink-muted">
              Last-click <span className="font-medium text-ink-secondary">attributed</span> revenue understates the true value: the 90-day halo
              adds influenced demand, while <span className="font-medium text-ink-secondary">incremental</span> isolates what wouldn't have happened
              otherwise (net of cannibalized existing demand).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="Which curated products carried the edit?" hint="Featured-assortment performance on this landing page." />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Product</th>
                    <th className="py-2 pr-3 text-right font-medium">Units</th>
                    <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                    <th className="py-2 pr-3 font-medium">% of page</th>
                    <th className="py-2 pl-3 text-right font-medium">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {assortment.map((a) => (
                    <tr key={a.name} className="border-b border-border/60 hover:bg-surface-2/40">
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2 font-medium text-ink">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLOR_HEX[a.color] ?? "#d8cfc0" }} />
                          {a.name}
                        </span>
                      </td>
                      <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{number(a.units)}</td>
                      <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(a.revenue)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <Progress value={a.share * 100} max={45} tone="sage" className="w-14" />
                          <span className="tabular text-[12px] text-ink-secondary">{percent(a.share, 0)}</span>
                        </div>
                      </td>
                      <td className="tabular py-2.5 pl-3 text-right text-ink-secondary">{percent(a.returnRate, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <SectionHeader question="Which creators and partners drive the most — and the most incremental — DTC revenue?" hint="Reach drives attributed revenue; brand fit, incrementality, and ROI separate durable partners from one-off spikes." className="mb-0" />
            <Select
              size="sm"
              value={sortBy}
              onChange={(v) => setSortBy(v as typeof sortBy)}
              label="Sort by"
              options={[
                { value: "attributedRevenue", label: "Attributed revenue" },
                { value: "incrementalRevenue", label: "Incremental revenue" },
                { value: "roi", label: "ROI" },
                { value: "brandFitScore", label: "Brand fit" },
              ]}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Partner</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Market</th>
                  <th className="py-2 pr-3 text-right font-medium">Audience</th>
                  <th className="py-2 pr-3 text-right font-medium">Eng.</th>
                  <th className="py-2 pr-3 text-right font-medium">Attributed</th>
                  <th className="py-2 pr-3 text-right font-medium">Incremental</th>
                  <th className="py-2 pr-3 text-right font-medium">ROI</th>
                  <th className="py-2 pl-3 font-medium">Fit · Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((c, i) => (
                  <tr key={c.partnerId} className="border-b border-border/60 hover:bg-surface-2/40">
                    <td className="tabular py-2.5 pr-3 text-ink-muted">{i + 1}</td>
                    <td className="py-2.5 pr-3 font-medium text-ink">{c.name}</td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{c.partnerType}</td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{c.market}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactNumber(c.audienceSize)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{percentRaw(c.engagementRate * 100)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(c.attributedRevenue)}</td>
                    <td className="tabular py-2.5 pr-3 text-right font-semibold text-sage-deep">{compactCurrency(c.incrementalRevenue)}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{multiplier(c.roi)}</td>
                    <td className="py-2.5 pl-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular text-[12px] font-semibold text-ink">{c.brandFitScore}</span>
                        <StatusBadge status={c.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Persona-creator matrix */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Which creator fits which persona?" hint="Persona-to-creator fit index 0–100. Match creators to the personas you want to reach." />
          <ColorPreferenceHeatmap rows={matrixRows} columns={personaNames} tone="ocean" rowHeader="Creator / partner" compact />
        </CardContent>
      </Card>

      {/* Commission simulator + comparison */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionHeader question="How should we structure commission?" hint={`Richer incentives lift creator effort but compress margin. Base: ${page.name}.`} />
            <div className="space-y-3.5">
              <Slider label="Commission rate" value={commissionRate} onChange={setCommissionRate} min={6} max={20} suffix="%" tone="clay" />
              <Slider label="New-customer bonus" value={newCustomerBonus} onChange={setNewCustomerBonus} min={0} max={40} prefix="$" tone="sage" />
              <Slider label="Lead bonus" value={leadBonus} onChange={setLeadBonus} min={0} max={8} prefix="$" tone="ocean" />
              <button
                onClick={() => setReturnAdjusted((v) => !v)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                  returnAdjusted ? "border-sage bg-sage-soft/60 text-sage-deep" : "border-border bg-surface text-ink-secondary",
                )}
              >
                <span>Return-adjusted commission</span>
                {returnAdjusted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Metric label="Revenue" value={compactCurrency(sim.revenue)} tone="sage" />
              <Metric label="Creator payout" value={compactCurrency(sim.creatorPayout)} tone="clay" />
              <Metric label="Margin after comm." value={compactCurrency(sim.marginAfterCommission)} tone="sage" />
              <Metric label="Margin rate" value={percentRaw(sim.marginAfterCommissionRate)} />
              <Metric label="New customers" value={number(sim.newCustomers)} />
              <Metric label="Projected LTV" value={compactCurrency(sim.projectedLtv)} tone="ocean" />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2">
              <span className="text-[12px] text-ink-secondary">Strategy profile · effective rate {percentRaw(sim.effectiveCommissionRate)}</span>
              <Badge tone={simRecTone}>{simRec}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <SectionHeader question="How do commission models compare?" hint="Preset structures on a ~$180K activation." />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Model</th>
                    <th className="py-2 pr-3 text-right font-medium">Payout</th>
                    <th className="py-2 pr-3 text-right font-medium">Margin after comm.</th>
                    <th className="py-2 pr-3 text-right font-medium">New cust.</th>
                    <th className="py-2 pr-3 text-right font-medium">Proj. LTV</th>
                    <th className="py-2 pl-3 font-medium">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionScenarios.map((s) => {
                    const recommended = s.recommendation.startsWith("Recommended");
                    return (
                      <tr key={s.scenarioId} className={cn("border-b border-border/60 hover:bg-surface-2/40", recommended && "bg-sage-soft/40")}>
                        <td className="py-2.5 pr-3 font-medium text-ink">{s.model}</td>
                        <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(s.creatorPayout)}</td>
                        <td className="tabular py-2.5 pr-3 text-right font-semibold text-ink">{compactCurrency(s.marginAfterCommission)}</td>
                        <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{number(s.newCustomers)}</td>
                        <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{compactCurrency(s.projectedLtv)}</td>
                        <td className="py-2.5 pl-3">
                          {recommended ? <Badge tone="positive">{s.recommendation}</Badge> : <span className="text-[12px] text-ink-secondary">{s.recommendation}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next-best creators + strategy */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="Which creators or partners should we onboard next, by market?" hint="Highest brand-fit partners not yet activated." />
            <div className="grid gap-3 sm:grid-cols-2">
              {nextBest.map((c) => (
                <div key={c.partnerId} className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-semibold text-ink">{c.name}</div>
                      <div className="text-[11px] text-ink-muted">{c.partnerType} · {c.market}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px]">
                    <div><span className="text-ink-muted">Persona</span><div className="font-medium text-ink">{c.primaryPersona}</div></div>
                    <div><span className="text-ink-muted">Brand fit</span><div className="tabular font-medium text-ink">{c.brandFitScore}</div></div>
                    <div><span className="text-ink-muted">Audience</span><div className="tabular font-medium text-ink">{compactNumber(c.audienceSize)}</div></div>
                    <div><span className="text-ink-muted">Engagement</span><div className="tabular font-medium text-ink">{percentRaw(c.engagementRate * 100)}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <SectionHeader question="What landing-page strategy fits each persona and event type?" hint="Suggested edit angle and featured assortment." />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Persona</th>
                    <th className="py-2 pr-3 font-medium">Event type</th>
                    <th className="py-2 pl-3 font-medium">Landing-page angle</th>
                  </tr>
                </thead>
                <tbody>
                  {STRATEGY.map((s) => (
                    <tr key={s.persona} className="border-b border-border/60 align-top hover:bg-surface-2/40">
                      <td className="py-2.5 pr-3 font-medium text-ink">{s.persona}</td>
                      <td className="py-2.5 pr-3 text-ink-secondary">{s.event}</td>
                      <td className="py-2.5 pl-3">
                        <div className="text-ink-secondary">{s.angle}</div>
                        <div className="text-[11px] text-ink-muted">Feature: {s.products}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance */}
      <Card className="border-clay/30 bg-gradient-to-br from-clay-soft/40 to-surface">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-clay" />
              <h3 className="text-[15px] font-semibold text-ink">Affiliate / influencer compliance checklist</h3>
            </div>
            <Badge tone={completedCompliance === COMPLIANCE_ITEMS.length ? "positive" : "warning"}>
              {completedCompliance} / {COMPLIANCE_ITEMS.length} complete
            </Badge>
          </div>
          <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-ink-secondary">
            Affiliate and influencer commissions create a material relationship, so every creator landing-page launch
            must clear disclosure, documentation, and tracking gates before going live.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {COMPLIANCE_ITEMS.map((item, i) => (
              <button
                key={item}
                onClick={() => setCompliance((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-left text-[12.5px] transition-colors hover:border-ink-muted"
              >
                {compliance[i] ? <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" /> : <Circle className="h-4 w-4 shrink-0 text-ink-muted" />}
                <span className={compliance[i] ? "text-ink" : "text-ink-secondary"}>{item}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5">
            <Lock className="h-4 w-4 shrink-0 text-clay" />
            <span className="text-[12.5px] font-medium text-ink">Human approval required before launch</span>
            <Badge tone="warning" className="ml-auto">Gated</Badge>
          </div>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
        <Sparkles className="h-3 w-3" /> Internal ecommerce capability on synthetic data — improving Vuori's own DTC
        performance. Not a data-resale or SaaS concept. Recommendations are testable and human-approved.
      </p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "sage" | "clay" | "ocean" }) {
  const color = tone === "clay" ? "text-clay" : tone === "ocean" ? "text-ocean" : tone === "sage" ? "text-sage-deep" : "text-ink";
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <div className="text-[10.5px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={cn("tabular mt-0.5 text-[15px] font-semibold leading-none", color)}>{value}</div>
    </div>
  );
}
