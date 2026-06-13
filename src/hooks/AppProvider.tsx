import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_FILTERS,
  SCENARIO_PRESETS,
  type Filters,
  type ScenarioInputs,
} from "@/data/calculations";
import type { ScenarioName } from "@/data/types";

export interface BriefItem {
  id: string;
  title: string;
  detail: string;
  source: string;
  impact?: string;
  confidence?: number;
}

interface AppState {
  // Filters
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;

  // Scenario
  scenario: ScenarioName;
  scenarioInputs: ScenarioInputs;
  selectScenario: (name: ScenarioName) => void;
  setScenarioInput: (key: keyof ScenarioInputs, value: number) => void;
  resetScenario: () => void;
  isCustomScenario: boolean;

  // Guided demo
  demoOpen: boolean;
  demoStep: number;
  openDemo: () => void;
  closeDemo: () => void;
  setDemoStep: (step: number) => void;

  // Send to Brief
  briefItems: BriefItem[];
  addToBrief: (item: BriefItem) => void;
  removeFromBrief: (id: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [scenario, setScenario] = useState<ScenarioName>("Base Case");
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInputs>(SCENARIO_PRESETS["Base Case"]);
  const [isCustomScenario, setIsCustom] = useState(false);

  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStepState] = useState(0);

  const [briefItems, setBriefItems] = useState<BriefItem[]>([]);

  const setFilter = useCallback<AppState["setFilter"]>((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Keep country/market loosely consistent: changing country resets market.
      if (key === "country") next.market = "All";
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = useMemo(
    () =>
      (Object.keys(filters) as (keyof Filters)[]).filter(
        (k) => k !== "dateRange" && filters[k] !== "All",
      ).length,
    [filters],
  );

  const selectScenario = useCallback((name: ScenarioName) => {
    setScenario(name);
    setScenarioInputs(SCENARIO_PRESETS[name]);
    setIsCustom(false);
  }, []);

  const setScenarioInput = useCallback((key: keyof ScenarioInputs, value: number) => {
    setScenarioInputs((prev) => ({ ...prev, [key]: value }));
    setIsCustom(true);
  }, []);

  const resetScenario = useCallback(() => {
    setScenarioInputs(SCENARIO_PRESETS[scenario]);
    setIsCustom(false);
  }, [scenario]);

  const openDemo = useCallback(() => {
    setDemoStepState(0);
    setDemoOpen(true);
  }, []);
  const closeDemo = useCallback(() => setDemoOpen(false), []);
  const setDemoStep = useCallback((step: number) => setDemoStepState(step), []);

  const addToBrief = useCallback((item: BriefItem) => {
    setBriefItems((prev) => (prev.some((b) => b.id === item.id) ? prev : [...prev, item]));
  }, []);
  const removeFromBrief = useCallback(
    (id: string) => setBriefItems((prev) => prev.filter((b) => b.id !== id)),
    [],
  );

  const value = useMemo<AppState>(
    () => ({
      filters,
      setFilter,
      resetFilters,
      activeFilterCount,
      scenario,
      scenarioInputs,
      selectScenario,
      setScenarioInput,
      resetScenario,
      isCustomScenario,
      demoOpen,
      demoStep,
      openDemo,
      closeDemo,
      setDemoStep,
      briefItems,
      addToBrief,
      removeFromBrief,
    }),
    [
      filters, setFilter, resetFilters, activeFilterCount, scenario, scenarioInputs,
      selectScenario, setScenarioInput, resetScenario, isCustomScenario, demoOpen,
      demoStep, openDemo, closeDemo, setDemoStep, briefItems, addToBrief, removeFromBrief,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
