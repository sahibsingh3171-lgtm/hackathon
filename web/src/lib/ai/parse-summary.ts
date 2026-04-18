import type { AiSummaryResult, ConcernTag, TherapyReadiness } from "@/types/clarity";

const TAGS: ConcernTag[] = [
  "anxiety",
  "depression",
  "sleep",
  "stress",
  "relationships",
  "substance",
  "self_harm_ideation",
  "other",
];

const READINESS: TherapyReadiness[] = ["unclear", "worth_exploring", "strongly_consider"];

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isTags(v: unknown): v is ConcernTag[] {
  if (!Array.isArray(v)) return false;
  return v.every((x) => typeof x === "string" && (TAGS as string[]).includes(x));
}

/** Best-effort parse of model JSON into our summary shape. */
export function parseAiSummaryResult(raw: unknown): AiSummaryResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const headline = typeof o.headline === "string" ? o.headline : null;
  const keyThemes = isStringArray(o.keyThemes) ? o.keyThemes : null;
  const rationaleBullets = isStringArray(o.rationaleBullets) ? o.rationaleBullets : null;
  const limitations = isStringArray(o.limitations) ? o.limitations : null;
  const tags = isTags(o.tags) ? o.tags : null;
  const tr = o.therapyReadiness;
  const therapyReadiness =
    typeof tr === "string" && (READINESS as string[]).includes(tr)
      ? (tr as TherapyReadiness)
      : null;

  if (!headline || !keyThemes || !rationaleBullets || !limitations || !tags || !therapyReadiness) {
    return null;
  }

  return {
    headline,
    keyThemes,
    therapyReadiness,
    rationaleBullets,
    limitations,
    tags,
    generatedAt: new Date().toISOString(),
  };
}
