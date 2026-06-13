import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowRight, Bell, Eye, TrendingUp } from "lucide-react";
import { Card } from "./Card";
import { Badge, type BadgeTone } from "./Badge";
import { Button } from "./Button";
import { Drawer } from "./Drawer";
import type { AlertSeverity, ExecutiveAlert } from "@/data/types";
import { cn } from "@/lib/utils";

const SEV: Record<AlertSeverity, { tone: BadgeTone; icon: React.ComponentType<{ className?: string }>; bar: string }> = {
  Opportunity: { tone: "sage", icon: TrendingUp, bar: "bg-sage" },
  "Revenue at Risk": { tone: "negative", icon: AlertTriangle, bar: "bg-negative" },
  Watch: { tone: "warning", icon: Eye, bar: "bg-warning" },
  Anomaly: { tone: "warning", icon: Activity, bar: "bg-warning" },
};

export function ExecutiveAlerts({ alerts }: { alerts: ExecutiveAlert[] }) {
  const [active, setActive] = useState<ExecutiveAlert | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-clay" />
        <h2 className="text-base font-semibold text-ink">Executive alerts</h2>
        <Badge tone="neutral">{alerts.length} active</Badge>
        <span className="ml-1 text-[12px] text-ink-secondary">Urgent or high-value changes, auto-surfaced</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {alerts.map((a) => {
          const s = SEV[a.severity];
          const Icon = s.icon;
          return (
            <Card key={a.alertId} hover className="relative overflow-hidden p-4">
              <span className={cn("absolute left-0 top-0 h-full w-1", s.bar)} />
              <div className="flex items-center justify-between gap-2 pl-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  <Icon className="h-3.5 w-3.5" /> {a.type}
                </span>
                <Badge tone={s.tone}>{a.severity}</Badge>
              </div>
              <h3 className="mt-1.5 pl-1.5 text-[14px] font-semibold leading-snug text-ink">{a.title}</h3>
              <div className="mt-2 flex items-center justify-between gap-2 pl-1.5">
                <span className="text-[12.5px] font-semibold text-sage-deep">{a.businessImpact}</span>
                <button onClick={() => setActive(a)} className="text-[12px] font-medium text-ocean hover:underline">
                  Evidence
                </button>
              </div>
              <p className="mt-1.5 pl-1.5 text-[12px] leading-snug text-ink-secondary">
                <span className="font-medium text-ink-secondary/90">Action — </span>{a.recommendedAction}
              </p>
              <div className="mt-1.5 pl-1.5 text-[11px] text-ink-muted">{a.owner}</div>
            </Card>
          );
        })}
      </div>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.title ?? ""} subtitle={active?.type} width="max-w-md">
        {active && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone={SEV[active.severity].tone} dot>{active.severity}</Badge>
              <span className="text-[13px] font-semibold text-sage-deep">{active.businessImpact}</span>
            </div>
            <Section title="Root cause"><p className="text-[13px] leading-relaxed text-ink-secondary">{active.rootCause}</p></Section>
            <Section title="Recommended action"><p className="text-[13px] leading-relaxed text-ink-secondary">{active.recommendedAction}</p></Section>
            <Section title="Owner"><p className="text-[13px] text-ink-secondary">{active.owner}</p></Section>
            <Section title="Evidence">
              <ul className="space-y-1.5">
                {active.evidence.map((e) => (
                  <li key={e} className="flex gap-2 text-[13px] leading-snug text-ink-secondary">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage" />{e}
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Measurement plan">
              <p className="rounded-lg bg-ocean-soft/40 p-3 text-[13px] leading-relaxed text-ink-secondary">{active.measurementPlan}</p>
            </Section>
            <Link to={active.page} onClick={() => setActive(null)}>
              <Button variant="outline" size="sm" className="w-full">Go to source <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{title}</div>
      {children}
    </div>
  );
}
