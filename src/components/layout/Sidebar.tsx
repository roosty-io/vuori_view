import { NavLink } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { NAV_GROUPS } from "./nav";
import { cn } from "@/lib/utils";

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage shadow-sm">
        <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none">
          <path d="M16 20 L32 46 L48 20" stroke="#F5F1E8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="22" r="3.4" fill="#B87955" />
        </svg>
      </div>
      <div>
        <div className="font-display text-[20px] font-semibold leading-none text-ink">Vuori View</div>
        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
          Commercial Intelligence
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:translate-x-0 print:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Wordmark />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-2 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/"}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
                            isActive
                              ? "bg-sage-soft text-sage-deep"
                              : "text-ink-secondary hover:bg-surface-2 hover:text-ink",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                isActive ? "text-sage" : "text-ink-muted group-hover:text-ink-secondary",
                              )}
                            />
                            <span className="truncate">{item.short}</span>
                            {item.tier1 && (
                              <Sparkles
                                className={cn(
                                  "ml-auto h-3 w-3 shrink-0",
                                  isActive ? "text-clay" : "text-border-strong group-hover:text-clay/70",
                                )}
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-5 py-3">
          <p className="text-[10.5px] leading-snug text-ink-muted">
            Portfolio demo using synthetic data. Not affiliated with Vuori and does not use proprietary
            Vuori data.
          </p>
        </div>
      </aside>
    </>
  );
}
