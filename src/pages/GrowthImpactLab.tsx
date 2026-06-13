import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookmarkCheck, BookmarkPlus, FlaskConical, Sprout, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { CHART, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import { useApp } from "@/hooks/AppProvider";
import { growthInitiatives } from "@/data/syntheticData";
import type { GrowthInitiative } from "@/data/types";
import { compactCurrency } from "@/lib/formatters";

const STAGE_COLOR: Record<GrowthInitiative["stage"], string> = {
  Now: CHART.sage,
  Next: CHART.ocean,
  Later: CHART.clay,
};

const STAGE_DESC: Record<GrowthInitiative["stage"], string> = {
  Now: "Self-service visibility & measurement",
  Next: "POCs & controlled tests",
  Later: "Productionized models & activation",
};

function MetricChip({ label, value, tone }: { label: string; value: string; tone?: "positive" | "neutral" }) {
  return (
    <div className="rounded-lg bg-surface-2/50 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`tabular text-[13px] font-semibold ${tone === "positive" ? "text-sage-deep" : "text-ink"}`}>{value}</div>
    </div>
  );
}

function InitiativeCard({ g }: { g: GrowthInitiative }) {
  const { addToBrief, briefItems } = useApp();
  const inBrief = briefItems.some((b) => b.id === g.id);

  const chips: { label: string; value: string; tone?: "positive" }[] = [
    { label: "Revenue impact", value: compactCurrency(g.revenueImpact), tone: "positive" },
    { label: "Gross profit", value: compactCurrency(g.grossProfitImpact), tone: "positive" },
  ];
  if (g.cacReduction) chips.push({ label: "CAC reduction", value: `−${g.cacReduction}%` });
  if (g.ltvLift) chips.push({ label: "LTV lift", value: `+${g.ltvLift}%` });
  if (g.conversionLift) chips.push({ label: "Conversion lift", value: `+${g.conversionLift}%` });
  if (g.retentionLift) chips.push({ label: "Retention lift", value: `+${g.retentionLift}%` });
  if (g.inventoryRiskReduction) chips.push({ label: "Inventory risk ↓", value: compactCurrency(g.inventoryRiskReduction) });

  return (
    <Card hover className="flex flex-col p-5">
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">{g.name}</h3>
        <StatusBadge status={g.status} />
      </div>
      <p className="text-[13px] leading-relaxed text-ink-secondary">{g.description}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {chips.map((c) => (
          <MetricChip key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-ink-muted">
          <span>Confidence</span>
          <span className="tabular text-ink-secondary">{g.confidence}%</span>
        </div>
        <Progress value={g.confidence} tone={g.confidence >= 82 ? "positive" : g.confidence >= 72 ? "sage" : "warning"} />
      </div>

      <div className="mt-3 flex gap-2 rounded-lg bg-surface-2/40 p-2.5 text-[12px] leading-snug text-ink-secondary">
        <FlaskConical className="h-3.5 w-3.5 shrink-0 text-ocean" />
        <span><span className="font-medium text-ink-secondary/90">Test — </span>{g.testDesign}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Badge tone={g.stage === "Now" ? "sage" : g.stage === "Next" ? "ocean" : "clay"}>{g.stage}</Badge>
          <span className="text-[11px] text-ink-muted">{g.owner} · {g.timeToValue}</span>
        </div>
        <Button variant={inBrief ? "subtle" : "ghost"} size="sm" disabled={inBrief} onClick={() => addToBrief({ id: g.id, title: g.name, detail: `${compactCurrency(g.revenueImpact)} revenue impact · ${g.confidence}% confidence`, source: "Growth Impact Lab", impact: compactCurrency(g.revenueImpact), confidence: g.confidence })}>
          {inBrief ? <BookmarkCheck className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
          {inBrief ? "In brief" : "Send to brief"}
        </Button>
      </div>
    </Card>
  );
}

export function GrowthImpactLab() {
  const totalRevenue = growthInitiatives.reduce((s, g) => s + g.revenueImpact, 0);
  const totalProfit = growthInitiatives.reduce((s, g) => s + g.grossProfitImpact, 0);
  const avgConfidence = Math.round(growthInitiatives.reduce((s, g) => s + g.confidence, 0) / growthInitiatives.length);

  const chartData = [...growthInitiatives]
    .sort((a, b) => b.revenueImpact - a.revenueImpact)
    .map((g) => ({ name: g.name, revenue: g.revenueImpact, stage: g.stage, confidence: g.confidence }));

  const stages: GrowthInitiative["stage"][] = ["Now", "Next", "Later"];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Growth Impact Lab"
        businessQuestion="Which analytics initiatives create the greatest internal business impact?"
        subtitle="Every initiative quantified by revenue, gross profit, efficiency, and risk reduction — with confidence, owner, test design, and a Now / Next / Later roadmap. Internal value only; no external monetization."
        badge={{ label: "Internal value", tone: "sage" }}
      />

      <HeroPanel
        eyebrow="Portfolio value"
        title="The current analytics portfolio represents meaningful, testable internal value."
        body="Across personalization, bidding, localized activation, lifecycle, and merchandising, the initiatives below are sized for revenue and gross profit impact — each with a defined owner, confidence level, and measurement plan. Sequence them Now / Next / Later to balance quick wins against compounding capabilities."
        badge={{ label: "Evidence-based", tone: "positive" }}
        stats={[
          { label: "Annual revenue impact", value: compactCurrency(totalRevenue), sub: "modeled", tone: "positive" },
          { label: "Gross profit impact", value: compactCurrency(totalProfit), sub: "modeled", tone: "positive" },
          { label: "Initiatives", value: String(growthInitiatives.length), sub: "across the funnel" },
          { label: "Avg. confidence", value: `${avgConfidence}%`, sub: "test before scaling" },
        ]}
      />

      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Where is the largest modeled revenue impact?" hint="Colored by roadmap stage. Hover for confidence." />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" {...axisProps} tickFormatter={(v: number) => compactCurrency(v)} />
              <YAxis type="category" dataKey="name" {...axisProps} width={170} tick={{ fill: CHART.ink, fontSize: 11.5 }} />
              <Tooltip
                cursor={{ fill: CHART.grid, fillOpacity: 0.25 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof chartData)[number];
                  return <TooltipShell title={p.name} rows={[{ label: "Revenue impact", value: compactCurrency(p.revenue), color: STAGE_COLOR[p.stage] }, { label: "Stage", value: p.stage }, { label: "Confidence", value: `${p.confidence}%` }]} />;
                }}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={STAGE_COLOR[d.stage]} />
                ))}
                <LabelList dataKey="revenue" position="right" formatter={(v: number) => compactCurrency(v)} style={{ fill: CHART.muted, fontSize: 10.5, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-ink-secondary">
            {stages.map((st) => (
              <span key={st} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[st] }} /> {st}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <SectionHeader question="What is each initiative worth, and how confident are we?" hint="Scorecards with impact, efficiency, retention, risk reduction, and test design." />
        <div className="grid gap-4 lg:grid-cols-2">
          {growthInitiatives.map((g) => (
            <InitiativeCard key={g.id} g={g} />
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="How should we sequence the roadmap?" hint="Now / Next / Later — balancing quick wins against compounding capability." />
          <div className="grid gap-4 md:grid-cols-3">
            {stages.map((stage) => (
              <div key={stage} className="rounded-xl border border-border bg-surface-2/30 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: STAGE_COLOR[stage] }}>
                    {stage === "Now" ? <TrendingUp className="h-3.5 w-3.5 text-white" /> : stage === "Next" ? <FlaskConical className="h-3.5 w-3.5 text-white" /> : <Sprout className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className="text-[14px] font-semibold text-ink">{stage}</span>
                </div>
                <p className="mb-2.5 text-[11.5px] text-ink-muted">{STAGE_DESC[stage]}</p>
                <div className="space-y-2">
                  {growthInitiatives.filter((g) => g.stage === stage).map((g) => (
                    <div key={g.id} className="rounded-lg border border-border bg-surface p-2.5">
                      <div className="text-[12.5px] font-medium text-ink">{g.name}</div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-muted">
                        <span className="tabular text-sage-deep">{compactCurrency(g.revenueImpact)}</span>
                        <span>{g.confidence}% conf.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-ink-muted">
        Values are modeled on synthetic data and represent internal business impact only — there is no external data
        monetization. Every initiative should be tested before scaling, with human-approved activation.
      </p>
    </div>
  );
}
