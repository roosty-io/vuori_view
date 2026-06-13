import { useMemo } from "react";
import { computeFiltered, type FilteredResult } from "@/data/calculations";
import { useApp } from "./AppProvider";

/** Access global filters plus the memoized filtered metric result. */
export function useFilters(): {
  filters: ReturnType<typeof useApp>["filters"];
  setFilter: ReturnType<typeof useApp>["setFilter"];
  resetFilters: () => void;
  activeFilterCount: number;
  result: FilteredResult;
} {
  const { filters, setFilter, resetFilters, activeFilterCount } = useApp();
  const result = useMemo(() => computeFiltered(filters), [filters]);
  return { filters, setFilter, resetFilters, activeFilterCount, result };
}
