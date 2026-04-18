/**
 * Arlington Heights, IL area public directory rows → `MockTherapistProfile`.
 * Listing sources vary (practice sites, Psychology Today, etc.) — Clarity does not verify availability,
 * rates, or credentials; users must confirm with providers directly.
 */

import type {
  MockApproach,
  MockIdentityFocus,
  MockStyleTag,
  MockTherapistModality,
  MockTherapistProfile,
} from "./mock-therapist-profiles-types";

type RawRow = {
  name: string;
  credentials: string;
  specialties: string;
  price: string;
  format: string;
  url: string;
};

function parseFormat(format: string): {
  inPerson: boolean;
  telehealth: boolean;
  modalities: MockTherapistModality[];
} {
  const s = format.toLowerCase();
  const ip = s.includes("in-person") || s.includes("in person");
  const tel =
    s.includes("telehealth") ||
    s.includes("online") ||
    s.includes("virtual") ||
    s.includes("remote");
  if (ip && !tel) {
    return { inPerson: true, telehealth: false, modalities: ["in_person"] };
  }
  if (tel && !ip) {
    return { inPerson: false, telehealth: true, modalities: ["telehealth"] };
  }
  return { inPerson: true, telehealth: true, modalities: ["in_person", "telehealth"] };
}

function parsePrice(price: string): { min: number; max: number } {
  const m = price.match(/\$(\d+)/);
  if (m) {
    const n = Number(m[1]);
    return { min: n, max: n };
  }
  const pl = price.toLowerCase();
  if (pl.includes("accepts") && pl.includes("insurance")) {
    return { min: 120, max: 200 };
  }
  if (pl.includes("accepts")) {
    return { min: 130, max: 220 };
  }
  return { min: 150, max: 250 };
}

function insuranceFromPrice(price: string): string[] {
  const pl = price.toLowerCase();
  const out: string[] = [];
  if (pl.includes("aetna")) out.push("Aetna");
  if (pl.includes("bcbs") || pl.includes("blue cross") || pl.includes("bluecross")) {
    out.push("Blue Cross Blue Shield");
  }
  if (pl.includes("cigna")) out.push("Cigna");
  if (pl.includes("insurance") && out.length === 0) out.push("Insurance — verify with office");
  if (out.length === 0) out.push("Self-pay / verify coverage");
  out.push("Out-of-network");
  return Array.from(new Set(out));
}

function specialtyList(s: string): string[] {
  return s
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function tagsFromSpecialties(specs: string[]): string[] {
  const t = new Set<string>();
  for (const s of specs) {
    for (const w of s.toLowerCase().split(/[\s/]+/)) {
      const clean = w.replace(/[^a-z0-9+-]/g, "");
      if (clean.length > 2) t.add(clean);
    }
  }
  t.add("arlington heights");
  return Array.from(t).slice(0, 12);
}

function inferFit(specs: string[]): {
  identityFocus?: readonly MockIdentityFocus[];
  styleTags?: readonly MockStyleTag[];
  approaches?: readonly MockApproach[];
} {
  const hay = specs.join(" ").toLowerCase();
  const identity: MockIdentityFocus[] = [];
  if (hay.includes("men") && hay.includes("mental")) identity.push("Men’s mental health");
  if (hay.includes("lgbt") || hay.includes("queer")) identity.push("LGBTQ+ affirming");
  if (hay.includes("couples") || hay.includes("family")) identity.push("Culturally responsive");
  const style: MockStyleTag[] = [];
  if (hay.includes("trauma") || hay.includes("ptsd")) style.push("Trauma-informed");
  if (hay.includes("child") || hay.includes("adolescent")) style.push("Gentle pacing");
  if (hay.includes("ocd") || hay.includes("anxiety")) style.push("Structured");
  if (style.length === 0) style.push("Warm", "Reflective");
  const approaches: MockApproach[] = [];
  if (hay.includes("cbt") || hay.includes("anxiety")) approaches.push("CBT");
  if (hay.includes("trauma") || hay.includes("ptsd")) approaches.push("EMDR");
  if (hay.includes("couples") || hay.includes("family")) approaches.push("EFT");
  if (approaches.length === 0) approaches.push("Mindfulness", "Narrative");
  return {
    identityFocus: identity.length ? identity : undefined,
    styleTags: style,
    approaches,
  };
}

function ptSearchUrl(name: string): string {
  const q = encodeURIComponent(name).replace(/%20/g, "+");
  return `https://www.psychologytoday.com/us/therapists/il/arlington-heights?search=${q}`;
}

/** Rows 1–18 and custom rows; 19–60 generated below from names. */
const RAW_FIXED: RawRow[] = [
  {
    name: "Jonathan Anderson",
    credentials: "Counselor, MDiv, MA, LCPC",
    specialties: "Child, Anxiety, Trauma and PTSD",
    price: "$195 per session",
    format: "In-person and Online",
    url: "https://www.jonathanandersoncounseling.com/",
  },
  {
    name: "Dr. Christopher Watson",
    credentials: "Psy.D., ABPP",
    specialties:
      "Child and Adolescent Psychologist, Neuropsychological assessment, Asperger's Syndrome, Anxiety, OCD, ADHD",
    price: "Contact for rates",
    format: "In-person",
    url: "https://www.nwbhs.com/appointment-request",
  },
  {
    name: "Dr. Peter Dodzik",
    credentials: "Psy.D., ABPdN, ABN",
    specialties:
      "Pediatric and Adult Neuropsychology, Dementing disorders, ADHD, Sleep Disorders, Dyslexia, Autism",
    price: "Contact for rates",
    format: "In-person",
    url: "https://www.nwbhs.com/appointment-request",
  },
  {
    name: "Dr. Dana McKennon",
    credentials: "Psy.D., Ed.S., LCLPC",
    specialties: "Anxiety disorders, Selective mutism, Social anxiety, OCD, Trichotillomania",
    price: "Contact for rates",
    format: "In-person",
    url: "https://www.nwbhs.com/appointment-request",
  },
  {
    name: "Dr. Whitney Tschan",
    credentials: "Psy.D.",
    specialties:
      "Neuropsychological assessment, Anxiety, Depression, Eating disorders, Body image concerns",
    price: "Contact for rates",
    format: "In-person",
    url: "https://www.nwbhs.com/appointment-request",
  },
  {
    name: "Anthony Mule",
    credentials: "MA, LCPC",
    specialties:
      "Children, Adolescents, Autism, Anxiety, Depression, Couples and Family Therapy",
    price: "Contact for rates",
    format: "In-person",
    url: "https://www.nwbhs.com/appointment-request",
  },
  {
    name: "Stacey Watson",
    credentials: "MA, LCPC",
    specialties: "Special education, Transition to post-secondary education, Disabilities",
    price: "Contact for rates",
    format: "In-person",
    url: "https://www.nwbhs.com/appointment-request",
  },
  {
    name: "Noemi Chalcakova",
    credentials: "LPC, Psychotherapist",
    specialties: "General Psychotherapy",
    price: "Accepts BlueCross BlueShield + 4 more",
    format: "In-person and Online",
    url: "https://www.psychologytoday.com/us/therapists/il/arlington-heights?search=Noemi+Chalcakova",
  },
  {
    name: "Jessica Sweet",
    credentials: "LMFT, LCPC, Psychotherapist",
    specialties: "General Psychotherapy",
    price: "Accepts Aetna, BCBS, Cigna + 4 more",
    format: "In-person and Online",
    url: "https://sweetjtherapy.com/contact-us/",
  },
  {
    name: "Dr. Tyler Demers",
    credentials: "PsyD, Psychotherapist",
    specialties: "General Psychotherapy",
    price: "Accepts Aetna, BCBS",
    format: "In-person and Online",
    url: "https://www.claritychi.com/locations/arlington-heights-il",
  },
  {
    name: "Dr. Ralph Whetstine",
    credentials: "PsyD, Psychologist",
    specialties: "General Psychology",
    price: "Accepts Aetna, BCBS + 37 more",
    format: "In-person and Online",
    url: "https://www.zocdoc.com/doctor/ralph-whetstine-psyd-210441",
  },
  {
    name: "Dr. Joseph O'Donnell",
    credentials: "PhD, Psychologist",
    specialties: "Anxiety disorders",
    price: "Accepts BCBS, Cigna + 1 more",
    format: "In-person",
    url: "https://www.zocdoc.com/doctor/joseph-odonnell-phd-210441",
  },
  {
    name: "Lynn Bednarz",
    credentials: "LCPC, Counselor",
    specialties: "General Counseling",
    price: "Accepts insurance",
    format: "In-person and Telehealth",
    url: "https://www.healthgrades.com/counseling-directory/il-illinois/arlington-heights",
  },
  {
    name: "Wendy Sherry",
    credentials: "LCSW, Counselor",
    specialties: "General Counseling",
    price: "Accepts insurance",
    format: "Telehealth",
    url: "https://www.healthgrades.com/counseling-directory/il-illinois/arlington-heights",
  },
  {
    name: "Tieshekia Fowlks",
    credentials: "LPC, Counselor",
    specialties: "Divorce, Dual diagnoses, Trauma, Men's mental health",
    price: "Accepts insurance",
    format: "In-person and Telehealth",
    url: "https://www.healthgrades.com/counseling-directory/il-illinois/arlington-heights",
  },
  {
    name: "Whitney Cunningham",
    credentials: "LCSW, Counselor",
    specialties: "Life transitions, Anxiety, Depression, Trauma",
    price: "Accepts insurance",
    format: "In-person and Telehealth",
    url: "https://www.healthgrades.com/counseling-directory/il-illinois/arlington-heights",
  },
  {
    name: "Heaven Lathan",
    credentials: "Therapist / Counselor",
    specialties: "Mental Health Counseling",
    price: "Contact for pricing",
    format: "In-person / Online",
    url: "https://sweetjtherapy.com/contact-us/",
  },
  {
    name: "Jamie Carlson",
    credentials: "Therapist / Counselor",
    specialties: "Mental Health Counseling",
    price: "Contact for pricing",
    format: "In-person / Online",
    url: "https://www.dynamicdirection.org/appointment-request",
  },
];

const PT_NAMES: readonly string[] = [
  "Stacey Cohn Siver",
  "Dr. Andreya DeLarco",
  "Leah Swanson",
  "Fawn Cooney",
  "Dr. Tim Franklin",
  "Lina Liu",
  "Allie Szeliga",
  "Christine Decker",
  "Liz Lucchese",
  "Kenya Walker",
  "Arlington Psychological Services",
  "Gregory Michael Rogers",
  "Luke N Rothschild",
  "Nirmeen Rajani",
  "Debra Dubin",
  "Amelie Morgan",
  "Christina Bell",
  "Rachael M Jones",
  "Alexandra E. Bosma",
  "Lindabeth Rivera",
  "Tim Ervin",
  "Jocelynne Moran",
  "Keith Harkleroad",
  "Mackenzie Sullivan",
  "Ray Kadkhodaian",
  "Maribeth Germino",
  "Carly Baric",
  "Mike Davison",
  "Kris Hernandez",
  "Nupur Sharma",
  "Kaila Zimmerman-Moscovitch",
  "Wolf Pack Therapy",
  "Dan Sneider",
  "Kelly Bucher",
  "Colin James Boland",
  "Amy De Salvo",
  "Lauren Steel",
  "Debbie Malitz",
  "Nikkie Evans",
  "Celeste L McGill",
  "Veesser Aminpour Pohn",
  "Alexandra Colaianni",
];

function rowToProfile(
  row: RawRow,
  indexZero: number,
  img: (seed: string) => string
): MockTherapistProfile {
  const id = `ah-${String(indexZero + 1).padStart(3, "0")}`;
  const specs = specialtyList(row.specialties);
  const { inPerson, telehealth, modalities } = parseFormat(row.format);
  const priceRange = parsePrice(row.price);
  const ins = insuranceFromPrice(row.price);
  const fit = inferFit(specs);
  const rating = 4.45 + (indexZero % 11) * 0.04;
  const reviewCount = 12 + (indexZero * 17) % 180;

  const bio = `${row.name} (${row.credentials}) lists the Arlington Heights, IL area. Focus areas include ${specs.slice(0, 4).join(", ") || "general mental health"}. Confirm session format, fees, and insurance directly with the practice — listings change.`;

  return {
    id,
    name: row.name,
    credentials: row.credentials,
    specialties: specs.length ? specs : ["General mental health"],
    modalities,
    telehealth,
    inPerson,
    bio,
    location: "Arlington Heights, IL area",
    priceRange,
    insuranceAccepted: ins,
    rating: Math.min(5, Math.round(rating * 100) / 100),
    reviewCount,
    reviewSummary:
      "Public directory listing for demo filtering in Clarity — not an endorsement or verified patient review summary.",
    reviewerVoices: [
      "Demo-only note: Arlington Heights and nearby suburbs show up often in local search; confirm office address and telehealth eligibility when you book.",
      "Northwest suburban clients sometimes mention convenient Metra-adjacent options — verify current locations with the provider.",
    ],
    tags: tagsFromSpecialties(specs),
    idealFor: `People browsing ${specs.slice(0, 2).join(" & ") || "support"} in the northwest suburbs.`,
    bookingUrl: row.url,
    profileImage: img(id),
    identityFocus: fit.identityFocus,
    styleTags: fit.styleTags,
    approaches: fit.approaches,
    languages: ["English"],
    slidingScale: row.price.toLowerCase().includes("contact"),
    acceptingNewClients: true,
  };
}

export function buildArlingtonProfiles(img: (seed: string) => string): MockTherapistProfile[] {
  const ptRows: RawRow[] = PT_NAMES.map((name) => ({
    name,
    credentials: "Therapist / Counselor",
    specialties: "Mental Health Counseling",
    price: "Contact for pricing",
    format: "In-person / Online",
    url: ptSearchUrl(name),
  }));

  const all: RawRow[] = [...RAW_FIXED, ...ptRows];
  return all.map((row, i) => rowToProfile(row, i, img));
}
