import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  X,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import { SectionHeader, Variant } from "./dashboard-mockups";

const THEMES = [
  { key: "Strategie", count: 8, accent: "oklch(0.72 0.18 230)" },
  { key: "Retrospektive", count: 12, accent: "oklch(0.74 0.14 200)" },
  { key: "Innovation", count: 6, accent: "oklch(0.78 0.18 50)" },
  { key: "Onboarding", count: 4, accent: "oklch(0.78 0.16 75)" },
  { key: "Konflikt", count: 3, accent: "oklch(0.72 0.16 10)" },
  { key: "Leadership", count: 5, accent: "oklch(0.72 0.20 295)" },
];

export function TemplateFilterMockups() {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Vorlagen · Filter"
        title="Filter-Bar Vorlagen"
        subtitle="Wie soll man durch 38+ Vorlagen scannen? Drei Konzepte mit unterschiedlichem Fokus auf Suche, Theme oder Bewertung."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Variant
          label="A — Theme-First Tabs"
          description="Themes als prominente Tabs oben mit Counter — primäres Navigations­element. Filter-Bar darunter sekundär."
        >
          <TemplateFilterA />
        </Variant>
        <Variant
          label="B — Smart-Search Bar"
          description="Eine zentrale Such-Zeile mit Inline-Filter-Chips die als Tags angefügt werden. Power-User-feeling, dichter."
        >
          <TemplateFilterB />
        </Variant>
        <Variant
          label="C — Visual Picker"
          description="Theme-Karten als visuelle Picker mit Akzent-Farbe + Counter, darunter ein zusammengefalteter Erweitert-Bereich."
        >
          <TemplateFilterC />
        </Variant>
      </div>
    </section>
  );
}

// A — Theme-First Tabs
function TemplateFilterA() {
  return (
    <div className="space-y-3">
      {/* Primary: theme tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 px-3 py-1.5 text-xs font-medium text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]">
          Alle <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">38</span>
        </button>
        {THEMES.slice(0, 4).map((t) => (
          <button
            key={t.key}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            <span className="size-1.5 rounded-full" style={{ background: t.accent }} />
            {t.key}
            <span className="rounded-full bg-muted/60 px-1.5 text-[10px] tabular-nums text-muted-foreground">{t.count}</span>
          </button>
        ))}
        <button className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground hover:bg-accent/40">
          +2 <ChevronDown className="size-3" />
        </button>
      </div>
      {/* Secondary: search + sort */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            placeholder="Suchen …"
            className="h-8 w-full rounded-lg border border-border/60 bg-background/40 pl-8 pr-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none"
            readOnly
          />
        </div>
        <select className="h-8 rounded-lg border border-border/60 bg-background/40 px-2 text-xs text-muted-foreground focus:outline-none">
          <option>Top-Rated</option>
        </select>
      </div>
    </div>
  );
}

// B — Smart-Search Bar
function TemplateFilterB() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--neon-violet)]/30 bg-background/60 p-2">
        <div className="flex items-center gap-2">
          <Search className="size-4 shrink-0 text-[var(--neon-violet)]" />
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {/* Inline filter chips as tokens */}
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--neon-violet)]/15 px-1.5 py-0.5 text-[11px] font-medium text-[var(--neon-violet)]">
              theme:Strategie
              <X className="size-2.5 opacity-60 hover:opacity-100" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--neon-cyan)]/15 px-1.5 py-0.5 text-[11px] font-medium text-[var(--neon-cyan)]">
              dauer:&lt;3h
              <X className="size-2.5 opacity-60 hover:opacity-100" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-500">
              ★ ≥4
              <X className="size-2.5 opacity-60 hover:opacity-100" />
            </span>
            <input
              placeholder="filter:wert oder text…"
              className="min-w-32 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
              readOnly
            />
          </div>
          <button className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3" />
            +
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span>3 Filter aktiv · 12 Treffer</span>
        <button className="text-[var(--neon-violet)] hover:underline">Filter zurücksetzen</button>
      </div>
    </div>
  );
}

// C — Visual Picker
function TemplateFilterC() {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
          Theme wählen
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {THEMES.slice(0, 6).map((t, i) => (
            <button
              key={t.key}
              className={`relative overflow-hidden rounded-lg border px-2 py-2 text-left transition-all hover:-translate-y-0.5 ${
                i === 0 ? "border-foreground/30 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)]" : "border-border/60"
              }`}
              style={{
                background: i === 0
                  ? `linear-gradient(135deg, color-mix(in oklch, ${t.accent} 25%, transparent), color-mix(in oklch, ${t.accent} 8%, transparent))`
                  : undefined,
              }}
            >
              <div
                className="absolute right-0 top-0 size-12 rounded-full opacity-30 blur-2xl"
                style={{ background: t.accent }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-tight" style={{ color: i === 0 ? t.accent : undefined }}>
                    {t.key}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground/70">{t.count}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <details className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-[11px] open:bg-background/60">
        <summary className="flex cursor-pointer items-center gap-2 text-muted-foreground [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="size-3" />
          Erweitert (Suche · Dauer · Bewertung)
          <ChevronDown className="ml-auto size-3 transition-transform group-open:rotate-180" />
        </summary>
      </details>
    </div>
  );
}
