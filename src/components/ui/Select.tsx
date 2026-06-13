import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function Select({ value, onChange, options, label, className, size = "md" }: SelectProps) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <label className={cn("group relative inline-flex flex-col gap-1", className)}>
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-lg border border-border-strong bg-surface pr-8 font-medium text-ink transition-colors hover:border-ink-muted focus:border-sage focus:outline-none",
            size === "sm" ? "h-8 pl-2.5 text-[13px]" : "h-9 pl-3 text-sm",
          )}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
      </div>
    </label>
  );
}
