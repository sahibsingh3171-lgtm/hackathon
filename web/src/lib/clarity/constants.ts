/** Linear flow for Clarity MVP — paths and labels only. */

export const CLARITY_STORAGE_KEY = "clarity_session_v1";

export const FLOW_STEPS = [
  { path: "/intake", label: "Check-in", short: "1" },
  { path: "/lifestyle", label: "Daily rhythms", short: "2" },
  { path: "/brain-dump", label: "Brain dump", short: "3" },
  { path: "/summary", label: "Reflection", short: "4" },
  { path: "/next-steps", label: "Next steps", short: "5" },
  { path: "/prep-sheet", label: "Prep sheet", short: "6" },
  { path: "/matches", label: "Matches", short: "7" },
] as const;

export type FlowPath = (typeof FLOW_STEPS)[number]["path"];

export function stepIndexForPath(path: string): number {
  const i = FLOW_STEPS.findIndex((s) => s.path === path);
  return i === -1 ? 0 : i;
}
