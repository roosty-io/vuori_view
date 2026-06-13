import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Beaker, FlaskConical, ShieldCheck, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroPanel } from "@/components/ui/HeroPanel";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge, StatusBadge, type BadgeTone } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { Drawer } from "@/components/ui/Drawer";
import { CHART, TooltipShell, axisProps } from "@/components/charts/chartUtils";
import { experiments, incrementalityTests } from "@/data/syntheticData";
import type { Experiment, ExperimentStatus } from "@/data/types";
import { compactCurrency, signed } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const STATUS_ORDER: ExperimentStatus[] = [
  "Proposed", "Designing", "Running", "Reading Results", "Scale", "Iterate", "Stop", "Needs More Data",
];
const STATUS_COLOR: Record<ExperimentStatus, string> = {
  Proposed: CHART.muted, Designing: "#9aa9ac", Running: CHART.ocean, "Reading Results": "#7b8a70",
  Scale: CHART.sage, Iterate: CHART.warning, Stop: CHART.negative, "Needs More Data": "#c0a36a",
};
const DECISION_TONE: Record<string, BadgeTone> = {
  Scale: "positive", Iterate: "warning", Stop: "negative", Running: "info", Proposed: "info", "Needs More Data": "warning",
};

export function ExperimentationCommandCenter() {
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [incId, setIncId] = useState("INC-001");
  const inc = incrementalityTests.find((t) => t.testId === incId)!;

  const statusCounts = useMemo(
    () => STATUS_ORDER.map((s) => ({ status: s, count: experiments.filter((e) => e.status === s).length })),
    [],
  );
  const totalIncremental = experiments.reduce((s, e) => s + e.incrementalRevenue, 0);
  const running = experiments.filter((e) => ["Running", "Reading Results"].includes(e.status)).length;
  const scaling = experiments.filter((e) => e.status === "Scale").length;

  const matrix = experiments
    .filter((e) => e.confidence > 0)
    .map((e) => ({ x: e.confidence, y: e.lift, z: Math.max(e.incrementalRevenue, 40000), name: e.name, status: e.status }));

  const incomeData = [...experiments]
    .filter((e) => e.incrementalRevenue > 0)
    .sort((a, b) => b.incrementalRevenue - a.incrementalRevenue)
    .map((e) => ({ name: e.name, value: e.incrementalRevenue, status: e.status }));

  const incBars = [
    { label: "Attributed", value: inc.attributedRevenue, fill: CHART.muted },
    { label: "Incremental", value: inc.incrementalRevenue, fill: CHART.sage },
    { label: "Cannibalized", value: inc.cannibalizedRevenue, fill: CHART.clay },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Experimentation Command Center"
        businessQuestion="Which growth ideas are proven, which are still hypotheses, and which should be scaled?"
        subtitle="Vuori View treats recommendations as hypotheses until validated. Every experiment carries an owner, success metric, control strategy, expected impact, and a decision rule — so the team scales only what works."
        badge={{ label: "Test before scaling", tone: "ocean" }}
      />

      <HeroPanel
        eyebrow="Test portfolio"
        title="Recommendations become experiments — with controls, confidence, and decision rules."
        body="Across ecommerce, CRM, paid media, community commerce, merchandising, localization, and PDP, the pipeline turns ideas into measured, incremental outcomes. Validated wins scale; ambiguous reads iterate; weak ideas stop."
        icon={<Beaker className="h-3.5 w-3.5" />}
        badge={{ label: `${running} running`, tone: "info" }}
        stats={[
          { label: "Incremental identified", value: compactCurrency(totalIncremental), sub: "validated + reading", tone: "positive" },
          { label: "Running now", value: String(running), sub: "with controls" },
          { label: "Ready to scale", value: String(scaling), sub: "above decision rule", tone: "positive" },
          { label: "Experiments", value: String(experiments.length), sub: "across domains" },
        ]}
      />

      {/* Test Before Scaling */}
      <Card className="border-ocean/30 bg-gradient-to-br from-ocean-soft/40 to-surface">
        <CardContent className="flex items-start gap-3 pt-5">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-ocean" />
          <div>
            <div className="text-[15px] font-semibold text-ink">Test Before Scaling</div>
            <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-ink-secondary">
              Vuori View treats recommendations as hypotheses until they are validated. Every major action should include
              an <span className="font-medium text-ink">owner, success metric, control strategy, expected impact, and a
              decision rule</span> — and remain human-approved before scaling.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline + matrix */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionHeader question="Where is everything in the pipeline?" hint="Experiments by status." />
            <div className="space-y-2">
              {statusCounts.map((s) => (
                <div key={s.status} className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                  <span className="w-32 shrink-0 text-[12.5px] text-ink-secondary">{s.status}</span>
                  <Progress value={s.count} max={Math.max(...statusCounts.map((c) => c.count))} tone="ocean" className="flex-1" />
                  <span className="tabular w-5 text-right text-[12px] font-semibold text-ink">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <SectionHeader question="Which tests combine high impact with high confidence?" hint="Lift vs confidence; bubble size = incremental revenue. Upper-right = scale candidates." />
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 12, right: 20, left: 4, bottom: 14 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" {...axisProps} domain={[60, 95]} label={{ value: "Confidence →", position: "insideBottom", offset: -8, fill: CHART.muted, fontSize: 11 }} />
                <YAxis type="number" dataKey="y" {...axisProps} width={36} tickFormatter={(v: number) => `${v}%`} label={{ value: "Lift", angle: -90, position: "insideLeft", fill: CHART.muted, fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" range={[80, 900]} />
                <ReferenceLine x={78} stroke={CHART.grid} strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof matrix)[number];
                    return <TooltipShell title={p.name} rows={[{ label: "Status", value: p.status, color: STATUS_COLOR[p.status] }, { label: "Lift", value: `${p.y}%` }, { label: "Confidence", value: `${p.x}%` }]} />;
                  }}
                />
                <Scatter data={matrix} onClick={(d: { name?: string }) => { const e = experiments.find((x) => x.name === d?.name); if (e) setSelected(e); }} cursor="pointer">
                  {matrix.map((d, i) => (
                    <Cell key={i} fill={STATUS_COLOR[d.status]} fillOpacity={0.8} stroke={STATUS_COLOR[d.status]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Incremental revenue by experiment */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Where is validated incremental revenue coming from?" hint="Incremental revenue by experiment (validated + reading)." />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeData} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" {...axisProps} tickFormatter={(v: number) => compactCurrency(v)} />
              <YAxis type="category" dataKey="name" {...axisProps} width={184} tick={{ fill: CHART.ink, fontSize: 11.5 }} />
              <Tooltip cursor={{ fill: CHART.grid, fillOpacity: 0.2 }} content={({ active, payload }) => active && payload?.length ? <TooltipShell title={(payload[0].payload as { name: string }).name} rows={[{ label: "Incremental revenue", value: compactCurrency((payload[0].payload as { value: number }).value) }]} /> : null} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {incomeData.map((d, i) => (
                  <Cell key={i} fill={STATUS_COLOR[d.status]} />
                ))}
                <LabelList dataKey="value" position="right" formatter={(v: number) => compactCurrency(v)} style={{ fill: CHART.muted, fontSize: 10.5, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Decision table */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="Scale, iterate, or stop?" hint="Each experiment's decision and next step. Click a row for the full design." />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Experiment</th>
                  <th className="py-2 pr-3 font-medium">Test type</th>
                  <th className="py-2 pr-3 font-medium">Primary KPI</th>
                  <th className="py-2 pr-3 text-right font-medium">Lift</th>
                  <th className="py-2 pr-3 text-right font-medium">Incremental</th>
                  <th className="py-2 pr-3 text-right font-medium">Conf.</th>
                  <th className="py-2 pl-3 font-medium">Decision</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((e) => (
                  <tr key={e.experimentId} onClick={() => setSelected(e)} className="cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2/50">
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-ink">{e.name}</div>
                      <div className="text-[11px] text-ink-muted">{e.domain} · {e.owner}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{e.testType}</td>
                    <td className="py-2.5 pr-3 text-ink-secondary">{e.primaryKpi}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{e.lift > 0 ? `${signed(e.lift)}%` : "—"}</td>
                    <td className="tabular py-2.5 pr-3 text-right font-semibold text-sage-deep">{e.incrementalRevenue > 0 ? compactCurrency(e.incrementalRevenue) : "—"}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-secondary">{e.confidence}%</td>
                    <td className="py-2.5 pl-3"><Badge tone={DECISION_TONE[e.decision] ?? "neutral"}>{e.decision}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Geo-Holdout & Incrementality Planner */}
      <Card className="border-sage/25 bg-gradient-to-br from-sage-soft/20 to-surface">
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionHeader
              question="How do we know this created incremental growth, not just captured demand?"
              hint="Geo-holdout & incrementality planner — attributed vs incremental, market similarity, and a decision rule."
              className="mb-0"
            />
            <Select value={incId} onChange={setIncId} label="Test" options={incrementalityTests.map((t) => ({ value: t.testId, label: t.name }))} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* test vs control + bars */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-muted">Test market</div>
                    <Badge tone="sage" className="mt-0.5">{inc.testMarket}</Badge>
                  </div>
                  <Target className="h-4 w-4 text-ink-muted" />
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-muted">Control markets</div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {inc.controlMarkets.map((m) => <Badge key={m} tone="ocean">{m}</Badge>)}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[11px] uppercase tracking-wide text-ink-muted">Status</div>
                    <StatusBadge status={inc.status} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Attributed vs incremental revenue</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={incBars} margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis {...axisProps} width={46} tickFormatter={(v: number) => compactCurrency(v)} />
                    <Tooltip cursor={{ fill: CHART.grid, fillOpacity: 0.2 }} content={({ active, payload }) => active && payload?.length ? <TooltipShell title={(payload[0].payload as { label: string }).label} rows={[{ label: "Revenue", value: compactCurrency((payload[0].payload as { value: number }).value) }]} /> : null} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={70}>
                      {incBars.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      <LabelList dataKey="value" position="top" formatter={(v: number) => compactCurrency(v)} style={{ fill: CHART.muted, fontSize: 10.5, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {inc.attributedRevenue > 0 ? (
                  <p className="mt-1 text-[12px] leading-snug text-ink-secondary">
                    {inc.testMarket} generated <span className="font-semibold text-ink">{compactCurrency(inc.attributedRevenue)}</span> attributed,
                    but the model estimates <span className="font-semibold text-sage-deep">{compactCurrency(inc.incrementalRevenue)}</span> was
                    incremental after adjusting for existing-customer overlap and baseline market growth.
                  </p>
                ) : (
                  <p className="mt-1 text-[12px] text-ink-muted">Test not yet started — results will populate at readout.</p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Market similarity scorecard</div>
                <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  {inc.similarityFactors.map((f) => (
                    <div key={f.factor} className="flex items-center gap-2">
                      <span className="w-36 shrink-0 truncate text-[11.5px] text-ink-secondary" title={f.factor}>{f.factor}</span>
                      <Progress value={f.score} tone={f.score >= 85 ? "positive" : "sage"} className="flex-1" />
                      <span className="tabular w-6 text-right text-[11px] font-semibold text-ink">{f.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* planner cards */}
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-surface p-4 text-center">
                <div className="text-[11px] uppercase tracking-wide text-ink-muted">Market similarity</div>
                <div className="tabular mt-1 text-[30px] font-semibold leading-none text-sage-deep">{inc.marketSimilarityScore}</div>
                <div className="mt-1 text-[11px] text-ink-muted">control match quality</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PlannerTile label="Min. detectable effect" value={`${inc.minimumDetectableEffect}%`} />
                <PlannerTile label="Recommended duration" value={`${inc.recommendedDuration} wks`} />
                <PlannerTile label="Expected lift" value={`${inc.expectedLift}%`} />
                <PlannerTile label="Actual lift" value={inc.actualLift != null ? `${signed(inc.actualLift)}%` : "—"} tone={inc.actualLift != null && inc.actualLift >= inc.expectedLift ? "sage" : undefined} />
              </div>
              <div className="rounded-xl border border-ocean/30 bg-ocean-soft/30 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ocean"><FlaskConical className="h-3.5 w-3.5" /> Decision rule</div>
                <p className="text-[12.5px] leading-snug text-ink">{inc.decisionRule}</p>
              </div>
              <div className="rounded-lg bg-surface-2/50 px-3 py-2 text-[11px] text-ink-secondary">Owner · {inc.owner}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experiment detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected ? `${selected.domain} · ${selected.testType}` : undefined} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <Badge tone={DECISION_TONE[selected.decision] ?? "neutral"}>Decision: {selected.decision}</Badge>
              <Badge tone="neutral">{selected.confidence}% confidence</Badge>
            </div>
            <div className="rounded-lg bg-sage-soft/40 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-sage-deep">Hypothesis</div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{selected.hypothesis}</p>
            </div>
            <DetailRow label="Business question" value={selected.businessQuestion} />
            <DetailRow label="Primary KPI" value={selected.primaryKpi} />
            <DetailRow label="Secondary KPIs" value={selected.secondaryKpis.join(" · ")} />
            <DetailRow label="Test market" value={selected.testMarket} />
            {selected.controlMarkets.length > 0 && <DetailRow label="Control markets" value={selected.controlMarkets.join(", ")} />}
            <DetailRow label="Audience" value={selected.audience} />
            <DetailRow label="Baseline" value={selected.baseline} />
            <DetailRow label="Result" value={selected.testResult} />
            <div className="grid grid-cols-3 gap-2">
              <PlannerTile label="Lift" value={selected.lift > 0 ? `${signed(selected.lift)}%` : "—"} />
              <PlannerTile label="Incremental rev." value={selected.incrementalRevenue > 0 ? compactCurrency(selected.incrementalRevenue) : "—"} />
              <PlannerTile label="Margin impact" value={selected.marginImpact > 0 ? compactCurrency(selected.marginImpact) : "—"} />
            </div>
            <div className="rounded-lg border border-border bg-surface-2/40 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Next step</div>
              <p className="mt-0.5 text-[13px] text-ink-secondary">{selected.nextStep}</p>
              {selected.customerQualityImpact > 0 && (
                <p className="mt-1.5 text-[12px] text-ink-muted">Customer Quality Score impact: {signed(selected.customerQualityImpact)} pts</p>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function PlannerTile({ label, value, tone }: { label: string; value: string; tone?: "sage" }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={cn("tabular mt-0.5 text-[15px] font-semibold", tone === "sage" ? "text-sage-deep" : "text-ink")}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border pt-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <p className="mt-0.5 text-[13px] leading-relaxed text-ink-secondary">{value}</p>
    </div>
  );
}
