import { useMemo } from "react";
import { computeScenario, type ScenarioOutputs } from "@/data/calculations";
import { useApp } from "./AppProvider";

/** Access the active scenario, its inputs, and computed outputs. */
export function useScenario(): {
  scenario: ReturnType<typeof useApp>["scenario"];
  scenarioInputs: ReturnType<typeof useApp>["scenarioInputs"];
  selectScenario: ReturnType<typeof useApp>["selectScenario"];
  setScenarioInput: ReturnType<typeof useApp>["setScenarioInput"];
  resetScenario: () => void;
  isCustomScenario: boolean;
  outputs: ScenarioOutputs;
} {
  const {
    scenario,
    scenarioInputs,
    selectScenario,
    setScenarioInput,
    resetScenario,
    isCustomScenario,
  } = useApp();
  const outputs = useMemo(() => computeScenario(scenarioInputs), [scenarioInputs]);
  return {
    scenario,
    scenarioInputs,
    selectScenario,
    setScenarioInput,
    resetScenario,
    isCustomScenario,
    outputs,
  };
}
