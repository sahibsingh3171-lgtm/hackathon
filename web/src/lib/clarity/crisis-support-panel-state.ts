import type { CrisisLevel } from "@/types/clarity";

export type CrisisSupportPanelVariant = "urgent" | "elevated";

/**
 * In-page crisis panel: urgent when the model sets `crisisFlag` or heuristics match urgent;
 * elevated for heuristic-only concern (not a clinical tier).
 */
export function crisisSupportPanelState(opts: {
  crisisLevel: CrisisLevel;
  crisisFlag: boolean | null | undefined;
}): CrisisSupportPanelVariant | null {
  const urgent = opts.crisisFlag === true || opts.crisisLevel === "urgent";
  if (urgent) return "urgent";
  if (opts.crisisLevel === "elevated") return "elevated";
  return null;
}
