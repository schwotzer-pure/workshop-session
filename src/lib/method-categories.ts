/**
 * Curated list of method categories used as filter chips and accent colors
 * on the methods library page. The `key` is what is stored on Method.category
 * in the DB — it intentionally matches the seeded English values so existing
 * methods don't need re-mapping. The `label` is the German UI text.
 */
export type MethodCategory = {
  key: string;
  label: string;
  description?: string;
  accent: string;
};

export const METHOD_CATEGORIES: MethodCategory[] = [
  {
    key: "Opening",
    label: "Eröffnung",
    description: "Check-in, Erwartungen, Kennenlernen",
    accent: "oklch(0.78 0.16 75)",
  },
  {
    key: "Energizer",
    label: "Energizer",
    description: "Aktivierung, Pause-Booster",
    accent: "oklch(0.78 0.18 50)",
  },
  {
    key: "Idea Generation",
    label: "Ideenfindung",
    description: "Brainstorming, neue Wege",
    accent: "oklch(0.72 0.20 295)",
  },
  {
    key: "Discussion",
    label: "Diskussion",
    description: "Austausch, Dialog",
    accent: "oklch(0.72 0.18 230)",
  },
  {
    key: "Decision Making",
    label: "Entscheidung",
    description: "Priorisierung, Voting",
    accent: "oklch(0.72 0.20 25)",
  },
  {
    key: "Retrospective",
    label: "Retrospektive",
    description: "Reflexion, Feedback",
    accent: "oklch(0.74 0.14 200)",
  },
  {
    key: "Closing",
    label: "Abschluss",
    description: "Check-out, Commitments",
    accent: "oklch(0.74 0.16 145)",
  },
  {
    key: "Sonstige",
    label: "Sonstige",
    description: "Alles andere",
    accent: "oklch(0.70 0.04 280)",
  },
];

export const METHOD_CATEGORY_KEYS = METHOD_CATEGORIES.map((c) => c.key);

export function getMethodCategoryAccent(key: string | null | undefined): string {
  if (!key) return "oklch(0.70 0.04 280)";
  return (
    METHOD_CATEGORIES.find((c) => c.key === key)?.accent ?? "oklch(0.70 0.04 280)"
  );
}

export function getMethodCategoryLabel(key: string | null | undefined): string {
  if (!key) return "Sonstige";
  return METHOD_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
