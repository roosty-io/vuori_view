import {
  Beaker,
  Database,
  GitBranch,
  Layers,
  ListChecks,
  ShieldAlert,
  Sigma,
} from "lucide-react";
import { Drawer } from "./Drawer";
import { Progress } from "./Progress";
import { confidenceLabel } from "@/lib/formatters";

export interface EvidencePayload {
  title: string;
  subtitle?: string;
  confidence?: number;
  sourceSignals: string[];
  supportingMetrics: { label: string; value: string }[];
  assumptions: string[];
  modelLogic: string;
  confidenceRationale: string;
  recommendedExperiment: string;
  risks: string[];
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-sage" />
        <h4 className="text-[13px] font-semibold uppercase tracking-wide text-ink-secondary">{title}</h4>
      </div>
      {children}
    </section>
  );
}

export function EvidenceDrawer({
  open,
  onClose,
  payload,
}: {
  open: boolean;
  onClose: () => void;
  payload: EvidencePayload | null;
}) {
  if (!payload) return null;
  return (
    <Drawer open={open} onClose={onClose} title="Evidence & methodology" subtitle={payload.title} width="max-w-lg">
      {payload.confidence != null && (
        <Section icon={Sigma} title="Confidence">
          <div className="flex items-center gap-3">
            <Progress
              value={payload.confidence}
              tone={payload.confidence >= 80 ? "positive" : payload.confidence >= 70 ? "sage" : "warning"}
            />
            <span className="tabular text-sm font-semibold text-ink">
              {payload.confidence}% · {confidenceLabel(payload.confidence)}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">{payload.confidenceRationale}</p>
        </Section>
      )}

      <Section icon={Database} title="Source signals">
        <div className="flex flex-wrap gap-1.5">
          {payload.sourceSignals.map((s) => (
            <span key={s} className="rounded-md border border-border bg-surface-2/70 px-2 py-1 text-[12px] text-ink-secondary">
              {s}
            </span>
          ))}
        </div>
      </Section>

      <Section icon={Layers} title="Supporting metrics">
        <dl className="grid grid-cols-2 gap-2">
          {payload.supportingMetrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-border bg-surface-2/40 p-2.5">
              <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{m.label}</dt>
              <dd className="tabular mt-0.5 text-sm font-semibold text-ink">{m.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section icon={GitBranch} title="Model / scoring logic">
        <p className="text-[13px] leading-relaxed text-ink-secondary">{payload.modelLogic}</p>
      </Section>

      <Section icon={ListChecks} title="Assumptions">
        <ul className="space-y-1.5">
          {payload.assumptions.map((a) => (
            <li key={a} className="flex gap-2 text-[13px] leading-relaxed text-ink-secondary">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
              {a}
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={Beaker} title="Recommended experiment">
        <p className="rounded-lg bg-sage-soft/60 p-3 text-[13px] leading-relaxed text-sage-deep">
          {payload.recommendedExperiment}
        </p>
      </Section>

      <Section icon={ShieldAlert} title="Risks & caveats">
        <ul className="space-y-1.5">
          {payload.risks.map((r) => (
            <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-ink-secondary">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay" />
              {r}
            </li>
          ))}
        </ul>
      </Section>
    </Drawer>
  );
}
