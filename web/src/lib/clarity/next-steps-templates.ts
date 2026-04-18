import type { ConcernTag, NextStepItem } from "@/types/clarity";

const BASE: NextStepItem[] = [
  {
    id: "ns-breathe",
    title: "Two-minute grounding",
    description:
      "Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste. No performance — just presence.",
    category: "self_care",
  },
  {
    id: "ns-journal",
    title: "One line for your therapist",
    description:
      "Write a single honest sentence you’d want to say in the first session. Bring it on your prep sheet.",
    category: "self_care",
  },
  {
    id: "ns-988",
    title: "If things spike",
    description:
      "In the U.S., call or text 988 for the Suicide & Crisis Lifeline. If you’re in immediate danger, call 911.",
    category: "professional",
  },
];

const BY_TAG: Partial<Record<ConcernTag, NextStepItem[]>> = {
  anxiety: [
    {
      id: "ns-anx-edu",
      title: "Learn about anxiety loops",
      description:
        "NIMH has plain-language overviews of anxiety signs and when professional support helps.",
      category: "education",
    },
    {
      id: "ns-anx-body",
      title: "Gentle movement",
      description:
        "A 10-minute walk or stretch can lower arousal enough to think more clearly — not a fix, a bridge.",
      category: "self_care",
    },
  ],
  depression: [
    {
      id: "ns-dep-edu",
      title: "Depression vs. “feeling sad”",
      description:
        "NAMI’s basics can help you name patterns — useful language for a first therapy visit.",
      category: "education",
    },
    {
      id: "ns-dep-pro",
      title: "Consider a consult",
      description:
        "If low mood persists most days for two weeks or more, a licensed clinician can help you sort next steps.",
      category: "professional",
    },
  ],
  sleep: [
    {
      id: "ns-sleep-hygiene",
      title: "Sleep window experiment",
      description:
        "Pick a fixed wake time for 5 days and keep lights low before bed — small data for your therapist.",
      category: "self_care",
    },
  ],
  stress: [
    {
      id: "ns-stress-boundary",
      title: "One boundary to try",
      description:
        "Choose one small “no” or delay this week. Note what you felt — great fodder for therapy.",
      category: "self_care",
    },
  ],
  relationships: [
    {
      id: "ns-rel-pattern",
      title: "Name one recurring pattern",
      description:
        "Without blame, describe what keeps happening between you and one important person.",
      category: "self_care",
    },
  ],
  substance: [
    {
      id: "ns-sub-pro",
      title: "Specialized support",
      description:
        "If substance use feels hard to control, consider a clinician trained in harm reduction or addiction medicine.",
      category: "professional",
    },
  ],
  self_harm_ideation: [
    {
      id: "ns-sh-988",
      title: "Reach out now",
      description:
        "988 is available 24/7 in the U.S. You don’t need to be “sure” it’s a crisis to call.",
      category: "professional",
    },
  ],
  other: [],
};

export function buildNextSteps(tags: ConcernTag[]): NextStepItem[] {
  const seen = new Set<string>();
  const out: NextStepItem[] = [];

  function push(items: NextStepItem[]) {
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }

  push(BASE);
  for (const tag of tags) {
    const extra = BY_TAG[tag];
    if (extra?.length) push(extra);
  }

  return out.slice(0, 8);
}
