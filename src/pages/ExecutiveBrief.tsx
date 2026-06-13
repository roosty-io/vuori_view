import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Printer,
  ShieldAlert,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useApp } from "@/hooks/AppProvider";
import { austin } from "@/data/syntheticData";
import { format } from "date-fns";

const TOP_INSIGHTS = [
  { t: "Austin ranks #1 in market opportunity", d: `Opportunity score ${austin.opportunityScore}, driven by traffic growth, search/social velocity, wellness density, and persona fit.` },
  { t: "Ecommerce traffic +33% YoY in Austin", d: "Demand is forming faster than revenue capture — a localization window before competitors saturate." },
  { t: "Repeat purchase rate 14% above average", d: "Strong retention signal supports lifecycle-led activation economics." },
  { t: "Wellness & run-club density over-index", d: "A run club + recovery studio activation matches the local lifestyle and persona mix." },
  { t: "It acquires higher-quality customers", d: "Austin Run Club leads score 86 on Customer Quality Score vs a ~71 paid-social prospecting average — stronger repeat probability and lower promo dependency." },
];

const PLAN = [
  {
    window: "0–30 days",
    title: "Approve & prepare",
    items: [
      "Approve test budget and matched-control design",
      "Shortlist local run-club & recovery-studio partners",
      "Finalize localized assortment and capsule",
      "Build localized paid social + onsite personalization",
      "Stand up email/SMS lifecycle follow-up flows",
    ],
  },
  {
    window: "30–60 days",
    title: "Activate",
    items: [
      "Launch 3-day Austin run club + recovery activation",
      "Capture first-party leads at the event",
      "Activate paid social + onsite persona modules",
      "Begin post-event email/SMS welcome series",
    ],
  },
  {
    window: "60–90 days",
    title: "Measure & decide",
    items: [
      "Measure 90-day halo, CAC, conversion lift, repeat rate vs control",
      "Decide scale to Nashville and Miami",
      "Convert learnings into POCs: market scoring & event ROI",
      "Brief leadership on incremental revenue and next bets",
    ],
  },
];

export function ExecutiveBrief() {
  const { briefItems, removeFromBrief } = useApp();

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          eyebrow="Executive Brief"
          businessQuestion="What should leadership know, decide, and test next?"
          subtitle="A decision-ready summary: recommendation, evidence, expected impact, confidence, risks, owners, and a 30/60/90-day test plan. Print or export to share."
          badge={{ label: "Decision required", tone: "warning" }}
          actions={
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Export / Print
            </Button>
          }
        />
      </div>

      <article className="print-full space-y-5">
        {/* Document header */}
        <Card className="print-surface overflow-hidden">
          <div className="border-b border-border bg-gradient-to-br from-sage-soft/60 to-surface px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-deep">Executive Brief · Commercial Intelligence</div>
                <h1 className="font-display mt-1 text-[28px] font-semibold leading-tight text-ink">Austin Localized Growth Opportunity</h1>
                <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-secondary">
                  Test a 3-day Austin run club + recovery studio activation, supported by localized paid social, onsite
                  personalization, and post-event email/SMS lifecycle flows.
                </p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <div className="text-[11px] uppercase tracking-wide text-ink-muted">Prepared</div>
                <div className="tabular text-[13px] font-medium text-ink">{format(new Date(2026, 5, 13), "MMM d, yyyy")}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-ink-muted">Owner</div>
                <div className="text-[13px] font-medium text-ink">Sr. Manager, Ecommerce Analytics</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-5 lg:col-span-2">
            <Card className="print-surface print-break-avoid">
              <CardContent className="pt-5">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  <Target className="h-3.5 w-3.5 text-sage" /> Recommendation
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-ink">
                  Approve a controlled Austin activation test: a 3-day run club + recovery studio event with localized
                  paid social, onsite personalization, and post-event email/SMS lifecycle flows. Route QR scans and
                  creator links to a curated on-site <span className="font-semibold">/austin-run-club</span> landing
                  page, and measure against matched control markets (Nashville, Salt Lake City, Denver) before any
                  scale decision.
                </p>
              </CardContent>
            </Card>

            <Card className="print-surface print-break-avoid">
              <CardContent className="pt-5">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sage" /> Top 5 insights
                </div>
                <ol className="space-y-2.5">
                  {TOP_INSIGHTS.map((ins, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[11px] font-semibold text-sage-deep">{i + 1}</span>
                      <div>
                        <div className="text-[13.5px] font-semibold text-ink">{ins.t}</div>
                        <div className="text-[12.5px] leading-snug text-ink-secondary">{ins.d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className="print-surface print-break-avoid">
              <CardContent className="pt-5">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  <CalendarCheck className="h-3.5 w-3.5 text-sage" /> 30 / 60 / 90-day action plan
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {PLAN.map((p) => (
                    <div key={p.window} className="rounded-xl border border-border bg-surface-2/30 p-3">
                      <Badge tone="sage">{p.window}</Badge>
                      <div className="mt-1.5 text-[13px] font-semibold text-ink">{p.title}</div>
                      <ul className="mt-1.5 space-y-1.5">
                        {p.items.map((it) => (
                          <li key={it} className="flex gap-1.5 text-[12px] leading-snug text-ink-secondary">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage" />
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="print-surface print-break-avoid">
              <CardContent className="pt-5">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  <ClipboardList className="h-3.5 w-3.5 text-ocean" /> Test design
                </div>
                <p className="text-[13.5px] leading-relaxed text-ink-secondary">
                  Austin vs matched control markets (Nashville, Salt Lake City, Denver; similarity score 88). Measure
                  lead capture, new-customer CAC, conversion lift, repeat purchase rate, Customer Quality Score, and the
                  90-day ecommerce halo. Distinguish <span className="font-medium text-ink">attributed</span> ($184K)
                  from <span className="font-medium text-ink">incremental</span> revenue (~$132K) via difference-in-differences;
                  decision rule: scale if incremental lift exceeds the 4.5% MDE at ≥80% confidence. Human approval and
                  the affiliate/influencer compliance checklist are required before launch.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card className="print-surface print-break-avoid border-sage/30 bg-gradient-to-br from-sage-soft/40 to-surface">
              <CardContent className="pt-5">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Expected impact</div>
                <div className="mt-2 space-y-2">
                  {[
                    { label: "Event-period revenue", value: "$180K" },
                    { label: "90-day ecommerce halo", value: "$560K" },
                    { label: "Attributed → incremental", value: "$184K → $132K" },
                    { label: "Customer Quality Score", value: "86" },
                    { label: "Leads captured", value: "2,900" },
                    { label: "Event ROI", value: "3.7x" },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between">
                      <span className="text-[13px] text-ink-secondary">{m.label}</span>
                      <span className="tabular text-[15px] font-semibold text-sage-deep">{m.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                    <span>Confidence</span>
                    <span className="tabular text-ink-secondary">84% · High</span>
                  </div>
                  <Progress value={84} tone="positive" />
                </div>
              </CardContent>
            </Card>

            <Card className="print-surface print-break-avoid">
              <CardContent className="pt-5">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  <Users className="h-3.5 w-3.5 text-sage" /> Required owners
                </div>
                <ul className="space-y-1.5 text-[13px] text-ink-secondary">
                  <li>Retail / Growth — activation lead</li>
                  <li>Performance Marketing — localized paid social</li>
                  <li>Lifecycle CRM — email/SMS flows</li>
                  <li>Merchandising — localized assortment</li>
                  <li>Ecommerce Analytics — measurement & readout</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="print-surface print-break-avoid">
              <CardContent className="pt-5">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                  <ShieldAlert className="h-3.5 w-3.5 text-clay" /> Risks & decision
                </div>
                <ul className="space-y-1.5 text-[13px] text-ink-secondary">
                  <li className="flex gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay" />Halo attribution requires clean matched controls.</li>
                  <li className="flex gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay" />Size availability could cap conversion.</li>
                  <li className="flex gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay" />Partner & assortment lead times.</li>
                </ul>
                <div className="mt-3 rounded-lg bg-clay-soft/50 p-2.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-clay">Decision needed</div>
                  <p className="mt-0.5 text-[12.5px] text-ink">Approve test budget, local partner shortlist, product assortment, and CRM/paid-media activation plan.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Collected insights from other pages */}
        <Card className="print-surface">
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                <ClipboardList className="h-3.5 w-3.5 text-sage" /> Insights sent to this brief
              </div>
              <Badge tone="neutral">{briefItems.length} saved</Badge>
            </div>
            {briefItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-2/30 px-5 py-8 text-center">
                <p className="text-[13px] font-medium text-ink">No insights collected yet</p>
                <p className="mt-1 text-[12.5px] text-ink-secondary">
                  Use <span className="font-medium">Send to brief</span> on Command Center, Growth Impact Lab, and other
                  pages to assemble a custom brief here.
                </p>
                <div className="mt-3 flex justify-center gap-2 no-print">
                  <Link to="/"><Button variant="outline" size="sm">Command Center</Button></Link>
                  <Link to="/growth-impact"><Button variant="outline" size="sm">Growth Impact Lab</Button></Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {briefItems.map((b) => (
                  <div key={b.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3">
                    <div>
                      <div className="text-[13px] font-semibold text-ink">{b.title}</div>
                      <div className="text-[12.5px] leading-snug text-ink-secondary">{b.detail}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge tone="neutral">{b.source}</Badge>
                        {b.impact && <Badge tone="positive">{b.impact}</Badge>}
                        {b.confidence != null && <Badge tone="sage">{b.confidence}% confidence</Badge>}
                      </div>
                    </div>
                    <button onClick={() => removeFromBrief(b.id)} className="no-print rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-negative" aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[11px] text-ink-muted">
          Portfolio demo using synthetic data. Not affiliated with Vuori and does not use proprietary Vuori data. All
          figures are illustrative. Recommendations are evidence-based, testable, and require human approval before
          scaling.
        </p>
      </article>
    </div>
  );
}
