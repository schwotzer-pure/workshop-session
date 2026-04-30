/**
 * Curated list of workshop themes used for grouping templates.
 * The first match in `THEMES` is the default ordering on the templates page.
 *
 * Each theme has an OKLCH accent color used as a left-border strip and badge tint
 * on template cards. Hues are spread across the wheel so adjacent themes are
 * visually distinct.
 */
export type Theme = {
  key: string;
  label: string;
  description?: string;
  accent: string;
};

export const THEMES: Theme[] = [
  { key: "Strategie", label: "Strategie", description: "Vision, Roadmap, OKRs", accent: "oklch(0.72 0.18 230)" },
  { key: "Team-Building", label: "Team-Building", description: "Vertrauen, Zusammenhalt", accent: "oklch(0.74 0.16 145)" },
  { key: "Leadership", label: "Leadership", description: "Führung, Coaching", accent: "oklch(0.72 0.20 295)" },
  { key: "Onboarding", label: "Onboarding", description: "Einarbeitung, Welcome", accent: "oklch(0.78 0.16 75)" },
  { key: "Innovation", label: "Innovation", description: "Ideenfindung, neue Wege", accent: "oklch(0.78 0.18 50)" },
  { key: "Kultur", label: "Kultur", description: "Werte, Mission, Identität", accent: "oklch(0.74 0.18 340)" },
  { key: "Retrospektive", label: "Retrospektive", description: "Reflexion, Lernen", accent: "oklch(0.74 0.14 200)" },
  { key: "Change", label: "Change Management", description: "Wandel, Transformation", accent: "oklch(0.72 0.20 25)" },
  { key: "Design Thinking", label: "Design Thinking", description: "User-zentriert", accent: "oklch(0.76 0.18 175)" },
  { key: "Konflikt", label: "Konflikt-Lösung", description: "Mediation, Klärung", accent: "oklch(0.72 0.16 10)" },
  { key: "Sonstige", label: "Sonstige", description: "Alles andere", accent: "oklch(0.70 0.04 280)" },
];

export const THEME_KEYS = THEMES.map((t) => t.key);

export function getThemeAccent(key: string): string {
  return THEMES.find((t) => t.key === key)?.accent ?? "oklch(0.70 0.04 280)";
}
