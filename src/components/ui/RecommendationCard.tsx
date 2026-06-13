import { useState } from "react";
import { Clock, Sparkles, UserCheck } from "lucide-react";
import { Card } from "./Card";
import { Badge, StatusBadge } from "./Badge";
import { Button } from "./Button";
import { Progress } from "./Progress";
import { EvidenceDrawer, type EvidencePayload } from "./EvidenceDrawer";
import type { Recommendation } from "@/data/types";
import { confidenceLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function RecommendationCard({
  rec,
  evidence,
  className,
}: {
  rec: Recommendation;
  evidence?: EvidencePayload;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card hover className={cn("flex flex-col p-5", className)}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-clay" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            Model-supported recommendation · {rec.module}
          </span>
        </div>
        <StatusBadge status={rec.status} />
      </div>

      <h3 className="text-[15px] font-semibold leading-snug text-ink">{rec.title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{rec.recommendation}</p>

      <div className="mt-3.5 grid gap-3 rounded-xl bg-surface-2/40 p-3 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Expected impact</div>
          <div className="mt-0.5 text-[13px] font-semibold text-sage-deep">{rec.expectedImpact}</div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            <span>Confidence</span>
            <span className="tabular text-ink-secondary">
              {rec.confidenceScore}% · {confidenceLabel(rec.confidenceScore)}
            </span>
          </div>
          <Progress
            value={rec.confidenceScore}
            tone={rec.confidenceScore >= 80 ? "positive" : rec.confidenceScore >= 70 ? "sage" : "warning"}
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Source signals</div>
        <div className="flex flex-wrap gap-1.5">
          {rec.sourceSignals.map((s) => (
            <span key={s} className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-ink-secondary">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Activation path</div>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-ink-secondary">
          {rec.activationPath.map((step, i) => (
            <li key={step} className="flex items-center gap-1.5">
              <span className="tabular flex h-4 w-4 items-center justify-center rounded-full bg-sage-soft text-[10px] font-semibold text-sage-deep">
                {i + 1}
              </span>
              {step}
              {i < rec.activationPath.length - 1 && <span className="text-ink-muted">→</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Badge tone="neutral" className="gap-1">
          <Clock className="h-3 w-3" /> {rec.timeToValue}
        </Badge>
        <Badge tone="neutral" className="gap-1">
          <UserCheck className="h-3 w-3" /> {rec.owner}
        </Badge>
        {rec.humanApprovalRequired && <Badge tone="warning">Human approval required</Badge>}
        <div className="ml-auto">
          {evidence && (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              View evidence
            </Button>
          )}
        </div>
      </div>

      {evidence && <EvidenceDrawer open={open} onClose={() => setOpen(false)} payload={evidence} />}
    </Card>
  );
}
