import { Menu, PlayCircle, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { useApp } from "@/hooks/AppProvider";
import { useFilters } from "@/hooks/useFilters";
import {
  COUNTRIES,
  DATE_RANGE_OPTIONS,
  FILTER_OPTIONS,
  type DateRangeKey,
  type Filters,
} from "@/data/calculations";
import { marketNames, personaNames } from "@/data/syntheticData";
import type { ScenarioName } from "@/data/types";

const SCENARIOS: ScenarioName[] = [
  "Base Case",
  "Aggressive Growth",
  "Margin Protection",
  "Inventory Constrained",
  "Localized Activation Push",
];

function FilterBar() {
  const { filters, setFilter, resetFilters, activeFilterCount } = useFilters();
  const { scenario, selectScenario } = useApp();

  const set = <K extends keyof Filters>(key: K) => (v: string) => setFilter(key, v as Filters[K]);

  return (
    <div className="flex items-center gap-2.5 border-t border-border bg-surface/80 px-4 py-2.5 backdrop-blur lg:px-6">
      <div className="flex shrink-0 items-center gap-1.5 text-ink-muted">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide sm:inline">Filters</span>
        {activeFilterCount > 0 && (
          <Badge tone="sage" className="px-1.5 py-0">
            {activeFilterCount}
          </Badge>
        )}
      </div>

      <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
        <Select
          size="sm"
          value={filters.dateRange}
          onChange={(v) => setFilter("dateRange", v as DateRangeKey)}
          options={DATE_RANGE_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
        />
        <Select size="sm" value={filters.market} onChange={set("market")} options={["All", ...marketNames]} />
        <Select size="sm" value={filters.country} onChange={set("country")} options={["All", ...COUNTRIES]} />
        <Select size="sm" value={filters.channel} onChange={set("channel")} options={FILTER_OPTIONS.channels} />
        <Select size="sm" value={filters.category} onChange={set("category")} options={FILTER_OPTIONS.categories} />
        <Select size="sm" value={filters.productLine} onChange={set("productLine")} options={FILTER_OPTIONS.productLines} />
        <Select size="sm" value={filters.persona} onChange={set("persona")} options={["All", ...personaNames]} />
        <Select
          size="sm"
          value={filters.newVsRepeat}
          onChange={(v) => setFilter("newVsRepeat", v as Filters["newVsRepeat"])}
          options={FILTER_OPTIONS.newVsRepeat as unknown as string[]}
        />
        <Select size="sm" value={filters.device} onChange={set("device")} options={FILTER_OPTIONS.devices} />
        <div className="ml-1 flex items-center gap-1.5 border-l border-border pl-3">
          <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-ink-muted md:inline">
            Scenario
          </span>
          <Select size="sm" value={scenario} onChange={(v) => selectScenario(v as ScenarioName)} options={SCENARIOS} />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="shrink-0">
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      )}
    </div>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { openDemo } = useApp();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md print:hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 lg:px-6">
        <button
          onClick={onMenu}
          className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-2 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <span className="text-[13px] font-medium text-ink-secondary">Commercial Intelligence for DTC Growth</span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <Tooltip
            content="Portfolio demo using synthetic data. Not affiliated with Vuori and does not use proprietary Vuori data."
            side="bottom"
          >
            <span className="hidden cursor-help items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-2.5 py-1 text-[11px] font-medium text-ink-muted sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-clay" />
              Synthetic demo
            </span>
          </Tooltip>
          <Button size="sm" onClick={openDemo} className="gap-1.5">
            <PlayCircle className="h-4 w-4" />
            Guided Demo
          </Button>
        </div>
      </div>
      <FilterBar />
    </header>
  );
}
