import type { Therapist } from "@/types/clarity";

import {
  MOCK_THERAPIST_PROFILES,
  type MockTherapistProfile,
} from "./mock-therapist-profiles";

export type { MockTherapistProfile } from "./mock-therapist-profiles";
export { MOCK_THERAPIST_PROFILES } from "./mock-therapist-profiles";

function bioShortFrom(bio: string, max = 158): string {
  const t = bio.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/** Maps rich MVP profiles to the lean `Therapist` type used by match + cards. */
export function therapistFromMockProfile(p: MockTherapistProfile): Therapist {
  const modalities =
    p.modalities.length > 0
      ? p.modalities
      : p.telehealth
        ? (["telehealth"] as const)
        : (["in_person"] as const);

  return {
    id: p.id,
    name: `${p.name}, ${p.credentials}`,
    specialties: p.specialties,
    modalities: [...modalities],
    priceFromUsd: p.priceRange.min,
    insuranceTags: p.insuranceAccepted,
    reviewScore: p.rating,
    reviewCount: p.reviewCount,
    bioShort: bioShortFrom(p.bio),
  };
}

/** Demo-only therapist directory — not real providers. */
export const MOCK_THERAPISTS: Therapist[] =
  MOCK_THERAPIST_PROFILES.map(therapistFromMockProfile);

export const ALL_SPECIALTIES = Array.from(
  new Set(MOCK_THERAPISTS.flatMap((t) => t.specialties))
).sort();

export const ALL_INSURANCE = Array.from(
  new Set(MOCK_THERAPISTS.flatMap((t) => t.insuranceTags))
).sort();
