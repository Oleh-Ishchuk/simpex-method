import { useMemo } from "react";

export function useStepHistory(result, varNames = []) {
  return useMemo(() => {
    if (!result?.steps) return [];
    return result.steps.map((step, i) => ({
      id: i,
      label: i === 0 ? "Initial" : `Iteration ${i}`,
      hasPivot: !!step.pivot,
    }));
  }, [result, varNames]);
}
