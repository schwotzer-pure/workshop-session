import { Clock3, Tag, Plus, Hash, Zap, Lightbulb } from "lucide-react";
import { SectionHeader, Variant } from "./dashboard-mockups";

const METHODS = [
  {
    title: "Crazy 8s",
    category: "Idea Generation",
    accent: "oklch(0.78 0.18 50)",
    duration: 20,
    description: "8 Lösungs-Skizzen in 8 Minuten — alleine, schweigend. Perfekt um aus der Diskussions-Schleife auszubrechen.",
    tags: ["Sketching", "Divergent"],
    used: 12,
  },
  {
    title: "Sailboat-Retrospektive",
    category: "Retrospective",
    accent: "oklch(0.74 0.14 200)",
    duration: 40,
    description: "Visuelle Metapher: Wind treibt an, Anker hält fest, Felsen sind Risiken. Funktioniert auch remote sehr gut.",
    tags: ["Retro", "Visual"],
    used: 8,
  },
  {
    title: "Dot Voting",
    category: "Decision Making",
    accent: "oklch(0.72 0.20 25)",
    duration: 10,
    description: "Klebepunkte zur Priorisierung. Jede Person hat 3 Stimmen — kann verteilen oder bündeln.",
    tags: ["Voting", "Quick"],
    used: 24,
  },
  {
    title: "Check-in Runde",
    category: "Opening",
    accent: "oklch(0.74 0.16 145)",
    duration: 10,
    description: "Lockerer Einstieg mit einer Frage. »Wie kommst du heute in den Raum?« auf Skala 1–10 oder als ein Wort.",
    tags: ["Opening", "Icebreaker"],
    used: 31,
  },
];

export function MethodMockups() {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Methoden"
        title="Methoden-Library"
        subtitle="Methoden sind kleine Bausteine — die Library muss schnell scannbar sein. Drei Konzepte mit unterschiedlicher Dichte."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Variant
          label="A — Compact-Tile"
          description="Vier kleine Kacheln pro Reihe, Kategorie als Farbpunkt, alles auf einen Blick. Hohe Dichte für Power-User."
        >
          <MethodVariantA />
        </Variant>
        <Variant
          label="B — Card-with-Action"
          description="Mittlere Dichte, klarer »+ Einfügen«-Button. Ein-Klick-Interaktion direkt von der Card."
        >
          <MethodVariantB />
        </Variant>
        <Variant
          label="C — Hero-Method"
          description="Fokussierte Karten mit großer Kategorie-Bubble. Ideal für Methoden-Browsing und Inspiration."
        >
          <MethodVariantC />
        </Variant>
      </div>
    </section>
  );
}

// ─────────── Variant A: Compact-Tile ───────────

function MethodVariantA() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {METHODS.map((m, i) => (
        <div
          key={i}
          className="group relative rounded-xl border border-border/60 bg-card/60 p-3 transition-colors hover:border-foreground/30"
        >
          <div className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: m.accent }}
            />
            <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {m.category}
            </span>
          </div>
          <h3 className="mt-1.5 truncate text-sm font-semibold leading-tight tracking-tight">
            {m.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {m.description}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-2.5" />
              {m.duration} min
            </span>
            <span className="inline-flex items-center gap-1 text-[10px]">
              <Hash className="size-2.5" />
              {m.used}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────── Variant B: Card-with-Action ───────────

function MethodVariantB() {
  return (
    <div className="space-y-3">
      {METHODS.map((m, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_oklch(0.65_0.26_295/_0.2)]"
        >
          <div className="flex items-stretch">
            {/* Left: category color column */}
            <div
              className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 border-r border-border/40"
              style={{
                background: `color-mix(in oklch, ${m.accent} 10%, transparent)`,
              }}
            >
              <Lightbulb
                className="size-5"
                style={{ color: m.accent }}
              />
              <span className="text-[8px] font-bold uppercase tracking-wider tabular-nums" style={{ color: m.accent }}>
                {m.duration}m
              </span>
            </div>
            <div className="flex-1 space-y-1.5 p-4">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-semibold tracking-tight">{m.title}</h3>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {m.category}
                </span>
              </div>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {m.description}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {m.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center pr-3">
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 text-[var(--neon-violet)] transition-all hover:scale-105 hover:bg-[var(--neon-violet)]/20"
                aria-label="Einfügen"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────── Variant C: Hero-Method ───────────

function MethodVariantC() {
  return (
    <div className="space-y-3">
      {METHODS.map((m, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md"
        >
          <div className="relative space-y-3 p-5">
            {/* Big category bubble */}
            <div className="flex items-start justify-between gap-3">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-lg shadow-[inset_0_-2px_8px_rgba(0,0,0,0.05)]"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklch, ${m.accent} 25%, transparent), color-mix(in oklch, ${m.accent} 8%, transparent))`,
                  color: m.accent,
                }}
              >
                <Zap className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: m.accent }}>
                  {m.category}
                </span>
                <h3 className="mt-0.5 text-base font-semibold tracking-tight">
                  {m.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right">
                <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {m.duration} min
                </span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                  {m.used}× verwendet
                </span>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              {m.description}
            </p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <Tag className="size-3 text-muted-foreground/60" />
                {m.tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-muted-foreground/70">
                    #{tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 px-3 py-1 text-[11px] font-medium text-foreground transition-all hover:from-[var(--neon-cyan)]/25 hover:via-[var(--neon-violet)]/25 hover:to-[var(--neon-pink)]/25"
              >
                + Einfügen
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
