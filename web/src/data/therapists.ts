import type { Therapist } from "@/types/clarity";

/** Demo-only therapist directory — not real providers. */
export const MOCK_THERAPISTS: Therapist[] = [
  {
    id: "t1",
    name: "Dr. Maya Chen",
    specialties: ["Anxiety", "Burnout", "Sleep"],
    modalities: ["telehealth", "in_person"],
    priceFromUsd: 140,
    insuranceTags: ["Aetna", "Cigna", "Out-of-network"],
    reviewScore: 4.9,
    reviewCount: 127,
    bioShort: "Warm, structured CBT with space for humor. Evenings available.",
  },
  {
    id: "t2",
    name: "Jordan Ellis, LCSW",
    specialties: ["Depression", "Life transitions", "LGBTQ+ affirming"],
    modalities: ["telehealth"],
    priceFromUsd: 95,
    insuranceTags: ["Medicaid", "Oscar", "Sliding scale"],
    reviewScore: 4.8,
    reviewCount: 89,
    bioShort: "Affirming, collaborative therapy — you set the pace.",
  },
  {
    id: "t3",
    name: "Sam Rivera, LMFT",
    specialties: ["Relationships", "Communication", "Stress"],
    modalities: ["in_person", "telehealth"],
    priceFromUsd: 165,
    insuranceTags: ["UnitedHealthcare", "Out-of-network"],
    reviewScore: 4.7,
    reviewCount: 54,
    bioShort: "Systems-trained; great for couples and family-of-origin stress.",
  },
  {
    id: "t4",
    name: "Dr. Priya Nair",
    specialties: ["Trauma-informed", "Anxiety", "EMDR"],
    modalities: ["telehealth"],
    priceFromUsd: 175,
    insuranceTags: ["Blue Cross", "Self-pay"],
    reviewScore: 5,
    reviewCount: 41,
    bioShort: "Trauma-informed care with EMDR when appropriate.",
  },
  {
    id: "t5",
    name: "Alex Park, LPC",
    specialties: ["ADHD adults", "Executive function", "Stress"],
    modalities: ["telehealth", "in_person"],
    priceFromUsd: 120,
    insuranceTags: ["Cigna", "Sliding scale"],
    reviewScore: 4.85,
    reviewCount: 203,
    bioShort: "Practical tools for brains that move fast and get overwhelmed.",
  },
  {
    id: "t6",
    name: "Riley Brooks, PsyD",
    specialties: ["Depression", "Sleep", "Mindfulness"],
    modalities: ["in_person"],
    priceFromUsd: 200,
    insuranceTags: ["Out-of-network", "Superbill"],
    reviewScore: 4.75,
    reviewCount: 33,
    bioShort: "Integrative approach — skills + depth when you want it.",
  },
  {
    id: "t7",
    name: "Taylor Morgan, LMHC",
    specialties: ["Substance use", "Harm reduction", "Anxiety"],
    modalities: ["telehealth"],
    priceFromUsd: 110,
    insuranceTags: ["Medicaid", "Medicare", "Sliding scale"],
    reviewScore: 4.9,
    reviewCount: 76,
    bioShort: "Nonjudgmental, harm-reduction aligned support.",
  },
  {
    id: "t8",
    name: "Dr. Naomi Okonkwo",
    specialties: ["Work stress", "Burnout", "Identity"],
    modalities: ["telehealth"],
    priceFromUsd: 155,
    insuranceTags: ["Aetna", "UnitedHealthcare"],
    reviewScore: 4.82,
    reviewCount: 62,
    bioShort: "Corporate burnout and “high functioning” anxiety are welcome here.",
  },
];

export const ALL_SPECIALTIES = Array.from(
  new Set(MOCK_THERAPISTS.flatMap((t) => t.specialties))
).sort();

export const ALL_INSURANCE = Array.from(
  new Set(MOCK_THERAPISTS.flatMap((t) => t.insuranceTags))
).sort();
