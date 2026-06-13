import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Compass, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useGuidedDemo } from "@/hooks/useGuidedDemo";
import { cn } from "@/lib/utils";

export function GuidedDemo() {
  const { open, step, steps, closeDemo, goToStep, next, prev } = useGuidedDemo();
  const navigate = useNavigate();
  const current = steps[step];
  const isLast = step === steps.length - 1;

  // Drive the underlying page as the user steps through the story.
  useEffect(() => {
    if (open && current) navigate(current.page);
  }, [open, step, current, navigate]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex justify-center p-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:justify-end sm:p-0">
      <div className="pointer-events-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-surface shadow-float animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-sage px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            <span className="text-[13px] font-semibold">Guided Demo</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
              Austin storyline
            </span>
          </div>
          <button onClick={closeDemo} className="rounded-md p-1 hover:bg-white/15" aria-label="Close guided demo">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper dots */}
        <div className="flex items-center gap-1 px-4 pt-3.5">
          {steps.map((s, i) => (
            <button
              key={s.page + i}
              onClick={() => goToStep(i)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i < step ? "bg-sage" : i === step ? "bg-clay" : "bg-surface-2",
              )}
              aria-label={`Step ${i + 1}: ${s.pageName}`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="px-4 py-3.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="tabular text-[11px] font-semibold text-ink-muted">
              Step {step + 1} of {steps.length}
            </span>
            <Badge tone="clay" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {current.pageName}
            </Badge>
          </div>
          <h3 className="text-[16px] font-semibold leading-snug text-ink">{current.title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">{current.narrative}</p>
          <div className="mt-3 flex gap-2 rounded-lg bg-sage-soft/70 p-2.5">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-deep" />
            <p className="text-[12.5px] font-medium leading-snug text-sage-deep">{current.takeaway}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <span className="text-[11px] text-ink-muted">The page behind updates as you step</span>
          {isLast ? (
            <Button size="sm" onClick={closeDemo}>
              <Check className="h-3.5 w-3.5" />
              Finish
            </Button>
          ) : (
            <Button size="sm" onClick={next}>
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
