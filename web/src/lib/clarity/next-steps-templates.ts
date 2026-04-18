import type { ConcernTag, NextStepItem } from "@/types/clarity";

const BASE: NextStepItem[] = [
  {
    id: "ns-breathe",
    title: "Two-minute grounding",
    description:
      "Notice five things you see, four you feel, three you hear, two you smell, one you taste. No need to do it perfectly.",
    category: "self_care",
  },
  {
    id: "ns-journal",
    title: "One line for later",
    description:
      "Write one honest sentence you might want to say in a first session. You can tuck it into your prep sheet.",
    category: "self_care",
  },
  {
    id: "ns-988",
    title: "If things feel urgent",
    description:
      "In the U.S., call or text 988 for the Suicide and Crisis Lifeline. If you are in immediate danger, call your local emergency number.",
    category: "professional",
  },
];

const BY_TAG: Partial<Record<ConcernTag, NextStepItem[]>> = {
  anxiety: [
    {
      id: "ns-anx-edu",
      title: "Read a little about anxiety",
      description:
        "NIMH offers plain-language overviews of anxiety and when professional support tends to help.",
      category: "education",
    },
    {
      id: "ns-anx-body",
      title: "Gentle movement",
      description:
        "A short walk or stretch can lower some of the physical buzz — not a cure, sometimes a bridge.",
      category: "self_care",
    },
  ],
  depression: [
    {
      id: "ns-dep-edu",
      title: "Low mood in plain language",
      description:
        "NAMI’s basics can help you name patterns — sometimes useful language for a first therapy visit.",
      category: "education",
    },
    {
      id: "ns-dep-pro",
      title: "Consider a consult",
      description:
        "If low mood has stayed most days for two weeks or more, a licensed clinician can help you think through next steps.",
      category: "professional",
    },
  ],
  sleep: [
    {
      id: "ns-sleep-hygiene",
      title: "Sleep window experiment",
      description:
        "Try a steady wake time for a few days and dim light before bed — small notes you can bring to therapy if you want.",
      category: "self_care",
    },
  ],
  stress: [
    {
      id: "ns-stress-boundary",
      title: "One boundary to try",
      description:
        "Choose one small no or delay this week. Notice how it felt — useful to share in therapy if it fits.",
      category: "self_care",
    },
  ],
  relationships: [
    {
      id: "ns-rel-pattern",
      title: "Name one recurring pattern",
      description:
        "Without blame, describe what tends to happen between you and one important person.",
      category: "self_care",
    },
  ],
  substance: [
    {
      id: "ns-sub-pro",
      title: "Specialized support",
      description:
        "If substance use feels hard to steer on your own, a clinician trained in harm reduction or addiction care may help.",
      category: "professional",
    },
  ],
  self_harm_ideation: [
    {
      id: "ns-sh-988",
      title: "Reach out now",
      description:
        "988 is available 24/7 in the U.S. You do not have to be certain it is a crisis to use it.",
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
