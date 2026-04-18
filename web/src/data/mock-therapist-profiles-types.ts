/** Shared types for mock / directory therapist rows (used by matcher + UI). */

export type MockTherapistModality = "in_person" | "telehealth";

/** Identity / cultural lenses a therapist self-identifies as fluent with (sample data). */
export type MockIdentityFocus =
  | "LGBTQ+ affirming"
  | "BIPOC"
  | "Culturally responsive"
  | "Neurodivergent-affirming"
  | "Men’s mental health"
  | "Women’s mental health"
  | "Faith-sensitive";

/** Short descriptors of session style (sample data — not a professional taxonomy). */
export type MockStyleTag =
  | "Warm"
  | "Direct"
  | "Structured"
  | "Reflective"
  | "Practical"
  | "Gentle pacing"
  | "Humor welcome"
  | "Trauma-informed";

/** High-level clinical approaches the therapist uses (sample data). */
export type MockApproach =
  | "CBT"
  | "ACT"
  | "EMDR"
  | "IFS"
  | "Gottman"
  | "EFT"
  | "Narrative"
  | "Schema"
  | "Mindfulness"
  | "Behavioral activation";

export interface MockTherapistProfile {
  id: string;
  name: string;
  credentials: string;
  specialties: string[];
  modalities: MockTherapistModality[];
  telehealth: boolean;
  inPerson: boolean;
  bio: string;
  location: string;
  priceRange: { min: number; max: number };
  insuranceAccepted: string[];
  /** Average sample rating (0–5). */
  rating: number;
  reviewCount: number;
  reviewSummary: string;
  /** Short synthetic “reviewer voice” lines for demo UI when users filter by area (not real quotes). */
  reviewerVoices: readonly string[];
  tags: string[];
  idealFor: string;
  bookingUrl: string;
  profileImage: string;
  /** New (optional on purpose — legacy fixtures still work). */
  identityFocus?: readonly MockIdentityFocus[];
  styleTags?: readonly MockStyleTag[];
  approaches?: readonly MockApproach[];
  languages?: readonly string[];
  /** Sliding scale / reduced-fee availability noted in sample profile. */
  slidingScale?: boolean;
  /** Sample “accepting new clients” flag for curated highlights. */
  acceptingNewClients?: boolean;
}
