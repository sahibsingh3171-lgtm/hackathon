/**
 * Therapist directory for Clarity MVP matching + cards.
 *
 * **Current dataset:** Arlington Heights, IL area public listings (names, credentials, specialties,
 * pricing notes, format, and booking links) assembled for demo filtering — not verified by Clarity,
 * not real-time availability, and not a substitute for checking credentials and fit directly with
 * each practice.
 */

export type {
  MockApproach,
  MockIdentityFocus,
  MockStyleTag,
  MockTherapistModality,
  MockTherapistProfile,
} from "./mock-therapist-profiles-types";

import { buildArlingtonProfiles } from "./arlington-heights-build";

export { buildArlingtonProfiles };
import type {
  MockApproach,
  MockIdentityFocus,
  MockStyleTag,
  MockTherapistProfile,
} from "./mock-therapist-profiles-types";

function img(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}

export const MOCK_THERAPIST_PROFILES: MockTherapistProfile[] = buildArlingtonProfiles(img);

// —— Derived option lists (single source of truth for filter chips) ——————————————

export const ALL_IDENTITY_FOCUS: readonly MockIdentityFocus[] = Array.from(
  new Set(MOCK_THERAPIST_PROFILES.flatMap((p) => p.identityFocus ?? []))
).sort() as readonly MockIdentityFocus[];

export const ALL_STYLE_TAGS: readonly MockStyleTag[] = Array.from(
  new Set(MOCK_THERAPIST_PROFILES.flatMap((p) => p.styleTags ?? []))
).sort() as readonly MockStyleTag[];

export const ALL_APPROACHES: readonly MockApproach[] = Array.from(
  new Set(MOCK_THERAPIST_PROFILES.flatMap((p) => p.approaches ?? []))
).sort() as readonly MockApproach[];

export const ALL_LANGUAGES: readonly string[] = Array.from(
  new Set(MOCK_THERAPIST_PROFILES.flatMap((p) => p.languages ?? []))
).sort();
