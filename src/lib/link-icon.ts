/**
 * Recognise common collaboration tools by URL host so we can pick a fitting
 * icon and accent color for workshop-level links. Unknown hosts fall back to
 * a generic link icon.
 */
export type LinkKind =
  | "miro"
  | "figma"
  | "notion"
  | "google-doc"
  | "google-slide"
  | "google-sheet"
  | "google-drive"
  | "loom"
  | "youtube"
  | "vimeo"
  | "mural"
  | "klaxoon"
  | "menti"
  | "dropbox"
  | "generic";

export type LinkKindMeta = {
  kind: LinkKind;
  label: string;
  accent: string;
};

const RULES: Array<{ test: (host: string, path: string) => boolean; meta: LinkKindMeta }> = [
  {
    test: (h) => h.includes("miro.com"),
    meta: { kind: "miro", label: "Miro", accent: "oklch(0.78 0.18 50)" },
  },
  {
    test: (h) => h.includes("figma.com"),
    meta: { kind: "figma", label: "Figma", accent: "oklch(0.72 0.20 25)" },
  },
  {
    test: (h) => h.includes("notion.so") || h.includes("notion.site"),
    meta: { kind: "notion", label: "Notion", accent: "oklch(0.70 0.04 280)" },
  },
  {
    test: (_h, p) => p.includes("/document/"),
    meta: { kind: "google-doc", label: "Google Doc", accent: "oklch(0.72 0.18 230)" },
  },
  {
    test: (_h, p) => p.includes("/presentation/"),
    meta: { kind: "google-slide", label: "Google Slides", accent: "oklch(0.78 0.16 75)" },
  },
  {
    test: (_h, p) => p.includes("/spreadsheets/"),
    meta: { kind: "google-sheet", label: "Google Sheet", accent: "oklch(0.74 0.16 145)" },
  },
  {
    test: (h) => h.includes("drive.google.com"),
    meta: { kind: "google-drive", label: "Google Drive", accent: "oklch(0.72 0.18 230)" },
  },
  {
    test: (h) => h.includes("loom.com"),
    meta: { kind: "loom", label: "Loom", accent: "oklch(0.72 0.20 295)" },
  },
  {
    test: (h) => h.includes("youtube.com") || h.includes("youtu.be"),
    meta: { kind: "youtube", label: "YouTube", accent: "oklch(0.72 0.20 25)" },
  },
  {
    test: (h) => h.includes("vimeo.com"),
    meta: { kind: "vimeo", label: "Vimeo", accent: "oklch(0.74 0.14 200)" },
  },
  {
    test: (h) => h.includes("mural.co") || h.includes("mural.ly"),
    meta: { kind: "mural", label: "Mural", accent: "oklch(0.74 0.18 340)" },
  },
  {
    test: (h) => h.includes("klaxoon.com"),
    meta: { kind: "klaxoon", label: "Klaxoon", accent: "oklch(0.72 0.20 295)" },
  },
  {
    test: (h) => h.includes("menti.com") || h.includes("mentimeter.com"),
    meta: { kind: "menti", label: "Mentimeter", accent: "oklch(0.74 0.16 145)" },
  },
  {
    test: (h) => h.includes("dropbox.com"),
    meta: { kind: "dropbox", label: "Dropbox", accent: "oklch(0.72 0.18 230)" },
  },
];

export function detectLinkKind(rawUrl: string): LinkKindMeta {
  try {
    const u = new URL(rawUrl);
    const host = u.host.toLowerCase();
    const path = u.pathname.toLowerCase();
    for (const r of RULES) {
      if (r.test(host, path)) return r.meta;
    }
  } catch {
    // ignore
  }
  return { kind: "generic", label: "Link", accent: "oklch(0.70 0.04 280)" };
}

export function safeHost(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}
