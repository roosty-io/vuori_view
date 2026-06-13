import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Badge, type BadgeTone } from "./Badge";
import { cn } from "@/lib/utils";

export interface HeroStat {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "positive" | "warning" | "negative";
}

export function HeroPanel({
  eyebrow = "Hero insight",
  title,
  body,
  stats,
  actions,
  badge,
  icon,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  body: ReactNode;
  stats?: HeroStat[];
  actions?: ReactNode;
  badge?: { label: string; tone?: BadgeTone };
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "hero-grain relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-sage-soft/70 via-surface to-ocean-soft/40 p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sage/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sage-deep">
              {icon ?? <Sparkles className="h-3.5 w-3.5" />}
              {eyebrow}
            </span>
            {badge && <Badge tone={badge.tone ?? "sage"}>{badge.label}</Badge>}
          </div>
          <h2 className="max-w-2xl text-[19px] font-semibold leading-snug text-ink sm:text-[21px]">{title}</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-secondary">{body}</p>
          {actions && <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div>}
        </div>

        {stats && stats.length > 0 && (
          <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-[340px] lg:grid-cols-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border/70 bg-surface/80 p-3 backdrop-blur">
                <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{s.label}</div>
                <div
                  className={cn(
                    "tabular mt-1 text-[20px] font-semibold leading-none",
                    s.tone === "positive" && "text-positive",
                    s.tone === "warning" && "text-warning",
                    s.tone === "negative" && "text-negative",
                    (!s.tone || s.tone === "default") && "text-ink",
                  )}
                >
                  {s.value}
                </div>
                {s.sub && <div className="mt-1 text-[11px] text-ink-muted">{s.sub}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
