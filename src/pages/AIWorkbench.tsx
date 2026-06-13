import { Link } from "react-router-dom";
import {
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Eye,
  FileText,
  GitBranch,
  Lock,
  PenLine,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, SectionHeader } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ModelItem {
  name: string;
  desc: string;
  status: string;
  tone: BadgeTone;
}

const PREDICTIVE: ModelItem[] = [
  { name: "LTV prediction", desc: "Predicted lifetime value per customer & visitor", status: "In test", tone: "warning" },
  { name: "Churn risk", desc: "Probability of lapse within horizon", status: "POC", tone: "sage" },
  { name: "Demand forecasting", desc: "Weekly demand by style & market", status: "In test", tone: "warning" },
  { name: "Event ROI forecast", desc: "Pre-event halo & ROI prediction", status: "In test", tone: "warning" },
  { name: "Market opportunity scoring", desc: "Weighted localization opportunity model", status: "Production", tone: "positive" },
  { name: "Persona assignment", desc: "Behavioral persona classification", status: "POC", tone: "sage" },
];

const RECOMMENDATION: ModelItem[] = [
  { name: "Next best product", desc: "Per-visitor product carousel ranking", status: "POC", tone: "sage" },
  { name: "Next best action", desc: "Highest-EV action across channels", status: "Discovery", tone: "info" },
  { name: "Budget reallocation", desc: "Marginal-ROAS-aware spend shifts", status: "POC", tone: "sage" },
  { name: "Local activation recommendation", desc: "Market × event-type ranking", status: "In test", tone: "warning" },
  { name: "Product launch risk", desc: "Early-read launch outcome model", status: "In test", tone: "warning" },
  { name: "Inventory prioritization", desc: "Stockout & size-gap revenue risk", status: "Production", tone: "positive" },
];

const GENERATIVE: ModelItem[] = [
  { name: "Insight summarization", desc: "Drafts over governed metrics with citations", status: "POC", tone: "sage" },
  { name: "Executive brief drafting", desc: "Assembles recommendation + evidence", status: "POC", tone: "sage" },
  { name: "Anomaly explanation", desc: "Plain-language driver decomposition", status: "Discovery", tone: "info" },
  { name: "Campaign brief generation", desc: "Localized creative & audience briefs", status: "Discovery", tone: "info" },
  { name: "Localized message drafts", desc: "Persona × market message variants", status: "Discovery", tone: "info" },
  { name: "Analyst copilot", desc: "Query, chart, and narrate governed data", status: "Discovery", tone: "info" },
];

const GOVERNANCE = [
  { icon: Target, label: "Confidence score", desc: "Every output carries a calibrated confidence." },
  { icon: Boxes, label: "Source data", desc: "Inputs and lineage are documented and governed." },
  { icon: Eye, label: "Explainability", desc: "Drivers and feature contributions are surfaced." },
  { icon: CheckCircle2, label: "Human approval", desc: "Commercial decisions require sign-off." },
  { icon: GitBranch, label: "Experiment design", desc: "Holdouts & matched controls before scaling." },
  { icon: TrendingUp, label: "Model monitoring", desc: "Drift, accuracy, and stability tracked." },
  { icon: Lock, label: "Bias / privacy review", desc: "No PII to models; fairness checks on guidance." },
  { icon: ScrollText, label: "Decision log", desc: "What we decided, why, and what we measured." },
];

const LIFECYCLE = [
  "Business question",
  "Data readiness",
  "POC",
  "Experiment",
  "Production decision",
  "Activation",
  "Monitoring",
  "Impact review",
];

const SECTION_ICON = { predictive: BrainCircuit, recommendation: Target, generative: PenLine } as const;

function ModelGrid({ items }: { items: ModelItem[] }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((m) => (
        <div key={m.name} className="rounded-xl border border-border bg-surface p-3 transition-shadow hover:shadow-card">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink">{m.name}</span>
            <Badge tone={m.tone}>{m.status}</Badge>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-ink-secondary">{m.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function AIWorkbench() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Analytics Workbench"
        businessQuestion="How can AI assist analytics while keeping decisions evidence-based, explainable, and human-approved?"
        subtitle="The model portfolio across prediction, recommendation, and generative assist — wrapped in a governance layer and a clear model lifecycle from business question to impact review."
        badge={{ label: "Governed", tone: "ocean" }}
        actions={
          <Link to="/ai-registry">
            <Button variant="outline" size="sm"><Sparkles className="h-4 w-4" /> Opportunity registry</Button>
          </Link>
        }
      />

      {/* Principle banner */}
      <Card className="border-sage/30 bg-gradient-to-br from-sage-soft/50 to-surface">
        <CardContent className="flex items-start gap-3 pt-5">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-sage" />
          <div>
            <div className="text-[15px] font-semibold text-ink">A clear principle for AI in commercial decisions</div>
            <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-ink-secondary">
              AI should accelerate analysis, surface patterns, and recommend actions — but major commercial decisions
              should remain <span className="font-medium text-ink">evidence-based, testable, and human-approved</span>.
              Every model output carries confidence, sources, and a path to experimentation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="How does a model move from idea to impact?" hint="The governed lifecycle every use case follows." />
          <div className="flex flex-wrap items-center gap-2">
            {LIFECYCLE.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/40 px-3 py-1.5">
                  <span className="tabular flex h-5 w-5 items-center justify-center rounded-full bg-sage text-[11px] font-semibold text-white">{i + 1}</span>
                  <span className="text-[12.5px] font-medium text-ink">{stage}</span>
                </div>
                {i < LIFECYCLE.length - 1 && <span className="text-ink-muted">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model sections */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center gap-2">
              <SECTION_ICON.predictive className="h-4 w-4 text-sage" />
              <h3 className="text-[15px] font-semibold text-ink">Predictive models</h3>
            </div>
            <ModelGrid items={PREDICTIVE} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center gap-2">
              <SECTION_ICON.recommendation className="h-4 w-4 text-ocean" />
              <h3 className="text-[15px] font-semibold text-ink">Recommendation models</h3>
            </div>
            <ModelGrid items={RECOMMENDATION} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center gap-2">
            <SECTION_ICON.generative className="h-4 w-4 text-clay" />
            <h3 className="text-[15px] font-semibold text-ink">Generative AI assist</h3>
            <Badge tone="warning" className="ml-1">Human-reviewed</Badge>
          </div>
          <ModelGrid items={GENERATIVE} />
        </CardContent>
      </Card>

      {/* Governance layer */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader question="What keeps this trustworthy?" hint="The governance layer applied to every model and recommendation." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GOVERNANCE.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.label} className="rounded-xl border border-border bg-surface-2/30 p-3.5">
                  <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-surface shadow-sm">
                    <Icon className="h-4 w-4 text-sage" />
                  </div>
                  <div className="text-[13px] font-semibold text-ink">{g.label}</div>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink-secondary">{g.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-2/40 p-3 text-[12px] text-ink-secondary">
            <FileText className="h-4 w-4 shrink-0 text-ink-muted" />
            Generative outputs cite every figure and are drafted for human review — never auto-published. Synthetic data
            only; no proprietary data and no PII used in modeling.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
