import { Star, Clock3, ListChecks, Sparkles, Users, ChevronRight } from "lucide-react";
import { SectionHeader, Variant } from "./dashboard-mockups";

const TEMPLATES = [
  {
    title: "Strategie-Klausur (Halbtag)",
    theme: "Strategie",
    accent: "oklch(0.72 0.18 230)",
    duration: "4h",
    blocks: 7,
    rating: 4.6,
    ratings: 5,
    uses: 7,
    author: "Christian",
    description: "Standortbestimmung, Vision-Skizze, Stoßrichtungen für Führungskreise von 6-12 Personen.",
    tags: ["Strategie", "Vision", "OKR"],
  },
  {
    title: "Quartals-Retrospektive",
    theme: "Retrospektive",
    accent: "oklch(0.74 0.14 200)",
    duration: "2h 30min",
    blocks: 7,
    rating: 4.8,
    ratings: 6,
    uses: 9,
    author: "Yannic",
    description: "Sailboat, Effort/Impact, Action Items mit klaren Verantwortlichen und Deadlines.",
    tags: ["Retrospektive", "Quartal", "Sailboat"],
  },
  {
    title: "Innovation-Sprint (1 Tag)",
    theme: "Innovation",
    accent: "oklch(0.78 0.18 50)",
    duration: "6h",
    blocks: 9,
    rating: 4.2,
    ratings: 3,
    uses: 2,
    author: "Christian",
    description: "Reframing, divergierende Ideenphase mit Crazy 8s, Konzept-Tracks im Breakout, finale Priorisierung.",
    tags: ["Innovation", "Ideation", "Crazy 8s"],
  },
];

export function TemplateMockups() {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Vorlagen"
        title="Vorlagen-Galerie"
        subtitle="Die Galerie ist der erste Touchpoint für Trainer:innen die schnell starten wollen — drei Stile mit unterschiedlich starkem Theme-Akzent."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Variant
          label="A — Theme-Color-Block"
          description="Großer farbiger Header je nach Theme. Sterne prominent. Schnelles visuelles Scannen nach Thema."
        >
          <TemplateVariantA />
        </Variant>
        <Variant
          label="B — Aurora-Layered"
          description="Glas-Karte mit übereinander geschichteten Aurora-Verläufen. Premium-Feel, weniger Lärm."
        >
          <TemplateVariantB />
        </Variant>
        <Variant
          label="C — Detail-Forward"
          description="Mehr Description sichtbar, Tags + Author + Stats inline. Listenartig statt kachelartig."
        >
          <TemplateVariantC />
        </Variant>
      </div>
    </section>
  );
}

// ─────────── Variant A: Theme-Color-Block ───────────

function TemplateVariantA() {
  return (
    <div className="space-y-3">
      {TEMPLATES.map((t, i) => (
        <div key={i} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_oklch(0.65_0.26_295/_0.3)]">
          {/* Theme color top */}
          <div
            className="relative h-16 px-4 pt-3"
            style={{
              background: `linear-gradient(135deg, color-mix(in oklch, ${t.accent} 35%, transparent), color-mix(in oklch, ${t.accent} 8%, transparent))`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: `color-mix(in oklch, ${t.accent} 25%, transparent)`,
                  color: t.accent,
                }}
              >
                {t.theme}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-medium tabular-nums backdrop-blur-sm">
                <Star className="size-3 fill-amber-500 text-amber-500" />
                {t.rating}
              </span>
            </div>
          </div>
          <div className="space-y-2 p-4">
            <h3 className="text-base font-semibold leading-tight tracking-tight">
              {t.title}
            </h3>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {t.description}
            </p>
            <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground tabular-nums">
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{t.duration}</span>
              <span className="inline-flex items-center gap-1"><ListChecks className="size-3" />{t.blocks}</span>
              <span className="inline-flex items-center gap-1"><Sparkles className="size-3" />{t.uses}× verwendet</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────── Variant B: Aurora-Layered ───────────

function TemplateVariantB() {
  return (
    <div className="space-y-3">
      {TEMPLATES.map((t, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-[var(--neon-cyan)]/[0.04] via-[var(--neon-violet)]/[0.04] to-[var(--neon-pink)]/[0.04] backdrop-blur-md"
        >
          <div
            className="pointer-events-none absolute -left-12 -top-12 size-44 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-90"
            style={{
              background: `radial-gradient(circle, ${t.accent} 0%, transparent 70%)`,
            }}
          />
          <div className="relative space-y-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.25em]"
                  style={{ color: t.accent }}
                >
                  {t.theme}
                </span>
                <h3 className="font-heading text-lg leading-tight tracking-tight">
                  {t.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right">
                <div className="inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums">
                  <Star className="size-3.5 fill-amber-500 text-amber-500" />
                  {t.rating}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {t.ratings} Bew.
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t.description}
            </p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3 tabular-nums">
                <span>{t.duration}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>{t.blocks} Blöcke</span>
              </div>
              <span className="inline-flex items-center gap-1 italic">
                von {t.author}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────── Variant C: Detail-Forward ───────────

function TemplateVariantC() {
  return (
    <div className="space-y-2">
      {TEMPLATES.map((t, i) => (
        <div
          key={i}
          className="group relative flex gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-foreground/30"
        >
          <div
            className="w-1 shrink-0 self-stretch rounded-full"
            style={{ background: t.accent }}
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold tracking-tight">
                  {t.title}
                </h3>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: t.accent }}>
                  {t.theme}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground/70 tabular-nums">
                <Star className="size-3 fill-amber-500 text-amber-500" />
                {t.rating}
                <span className="text-muted-foreground/60">({t.ratings})</span>
              </span>
              <span>·</span>
              <span className="tabular-nums">{t.duration}</span>
              <span>·</span>
              <span className="tabular-nums">{t.blocks} Blöcke</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3" />
                {t.uses}× verwendet
              </span>
              <span className="ml-auto italic">{t.author}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
