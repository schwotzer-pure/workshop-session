/**
 * Curated list of workshop themes used for grouping templates.
 * The first match in `THEMES` is the default ordering on the templates page.
 */
export const THEMES: Array<{ key: string; label: string; description?: string }> = [
  { key: "Strategie", label: "Strategie", description: "Vision, Roadmap, OKRs" },
  { key: "Team-Building", label: "Team-Building", description: "Vertrauen, Zusammenhalt" },
  { key: "Leadership", label: "Leadership", description: "Führung, Coaching" },
  { key: "Onboarding", label: "Onboarding", description: "Einarbeitung, Welcome" },
  { key: "Innovation", label: "Innovation", description: "Ideenfindung, neue Wege" },
  { key: "Kultur", label: "Kultur", description: "Werte, Mission, Identität" },
  { key: "Retrospektive", label: "Retrospektive", description: "Reflexion, Lernen" },
  { key: "Change", label: "Change Management", description: "Wandel, Transformation" },
  { key: "Design Thinking", label: "Design Thinking", description: "User-zentriert" },
  { key: "Konflikt", label: "Konflikt-Lösung", description: "Mediation, Klärung" },
  { key: "Sonstige", label: "Sonstige", description: "Alles andere" },
];

export const THEME_KEYS = THEMES.map((t) => t.key);
