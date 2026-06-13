import { useState } from "react";
import { Activity, ArrowRight, BookmarkCheck, BookmarkPlus, FlaskConical, Target, User } from "lucide-react";
import { Card } from "./Card";
import { StatusBadge } from "./Badge";
import { Button } from "./Button";
import { Progress } from "./Progress";
import { EvidenceDrawer, type EvidencePayload } from "./EvidenceDrawer";
import { useApp, type BriefItem } from "@/hooks/AppProvider";
import { confidenceLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface InsightCardProps {
  title: string;
  whatHappened: string;
  whyItMatters: string;
  recommendedAction: string;
  estimatedImpact: string;
  confidence: number;
  status: string;
  owner: string;
  testDesign?: string;
  evidence?: EvidencePayload;
  briefItem?: BriefItem;
  className?: string;
  compact?: boolean;
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-[13px] leading-snug text-ink">{children}</div>
    </div>
  );
}

export function InsightCard(props: InsightCardProps) {
  const { evidence, briefItem } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { addToBrief, briefItems } = useApp();
  const inBrief = briefItem ? briefItems.some((b) => b.id === briefItem.id) : false;

  return (
    <Card hover className={cn("flex flex-col p-5", props.className)}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">{props.title}</h3>
        <StatusBadge status={props.status} />
      </div>

      <div className="space-y-2.5">
        <p className="text-[13px] leading-relaxed text-ink-secondary">
          <span className="font-medium text-ink-secondary/90">What happened — </span>
          {props.whatHappened}
        </p>
        <p className="text-[13px] leading-relaxed text-ink-secondary">
          <span className="font-medium text-ink-secondary/90">Why it matters — </span>
          {props.whyItMatters}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3.5">
        <Field icon={Target} label="Recommended action">
          {props.recommendedAction}
        </Field>
        <Field icon={Activity} label="Estimated impact">
          <span className="font-semibold text-sage-deep">{props.estimatedImpact}</span>
        </Field>
        <Field icon={User} label="Owner">
          {props.owner}
        </Field>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            <span>Confidence</span>
            <span className="tabular text-ink-secondary">
              {props.confidence}% · {confidenceLabel(props.confidence)}
            </span>
          </div>
          <Progress
            value={props.confidence}
            tone={props.confidence >= 80 ? "positive" : props.confidence >= 70 ? "sage" : "warning"}
          />
        </div>
      </div>

      {props.testDesign && (
        <div className="mt-3 flex gap-2 rounded-lg bg-surface-2/50 p-2.5 text-[12px] leading-snug text-ink-secondary">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-ocean" />
          <span>
            <span className="font-medium text-ink-secondary/90">Measurement plan — </span>
            {props.testDesign}
          </span>
        </div>
      )}

      {(evidence || briefItem) && (
        <div className="mt-4 flex items-center gap-2">
          {evidence && (
            <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
              View evidence
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {briefItem && (
            <Button
              variant={inBrief ? "subtle" : "ghost"}
              size="sm"
              onClick={() => addToBrief(briefItem)}
              disabled={inBrief}
            >
              {inBrief ? <BookmarkCheck className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              {inBrief ? "In brief" : "Send to brief"}
            </Button>
          )}
        </div>
      )}

      {evidence && <EvidenceDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} payload={evidence} />}
    </Card>
  );
}
