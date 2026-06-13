import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  businessQuestion,
  subtitle,
  badge,
  actions,
  className,
}: {
  eyebrow: string;
  businessQuestion: string;
  subtitle: string;
  badge?: { label: string; tone?: BadgeTone };
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{eyebrow}</span>
            {badge && <Badge tone={badge.tone ?? "neutral"}>{badge.label}</Badge>}
          </div>
          <h1 className="font-display text-[28px] font-semibold leading-[1.12] text-ink sm:text-[32px]">
            {businessQuestion}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">{subtitle}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
