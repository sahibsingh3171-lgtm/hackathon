/**
 * **Crisis heuristics + copy + panel state** (not clinical triage).
 */
export {
  crisisLevelFromPhq9Item9,
  evaluateCrisisText,
  evaluateSessionCrisisLevel,
} from "@/lib/clarity/crisis-heuristics";
export * from "@/lib/clarity/crisis-copy";
export {
  crisisSupportPanelState,
  type CrisisSupportPanelVariant,
} from "@/lib/clarity/crisis-support-panel-state";
