import {
  Search,
  Layers,
  Star,
  Activity,
  User,
  ChevronDown,
} from "lucide-react";
import { SectionHeader, Variant } from "./dashboard-mockups";

const TOOLS = [
  { name: "Miro", count: 23, color: "oklch(0.75 0.20 45)" },
  { name: "Figma", count: 14, color: "oklch(0.65 0.22 280)" },
  { name: "Notion", count: 8, color: "oklch(0.30 0.01 0)" },
  { name: "Google", count: 12, color: "oklch(0.70 0.22 25)" },
  { name: "Loom", count: 4, color: "oklch(0.65 0.22 295)" },
];

const TAGS = [
  { tag: "Strategie", weight: 14 },
  { tag: "Onboarding", weight: 11 },
  { tag: "Retro", weight: 9 },
  { tag: "Ideation", weight: 7 },
  { tag: "Workshop", weight: 6 },
  { tag: "Vision", weight: 5 },
  { tag: "Q1", weight: 4 },
  { tag: "Klausur", weight: 3 },
];

export function BoardFilterMockups() {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Boards · Filter"
        title="Filter-Bar Boards"
        subtitle="Boards stapeln sich schnell. Drei Konzepte für besseres Wiederfinden — visuell, nach Aktivität oder durch Tags."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Variant
          label="A — Tool-Type Cards"
          description="Tool-Typ als prominente Karten oben — »Miro«, »Figma«, »Notion«. Brand-Farben des Tools, schneller visueller Filter."
        >
          <BoardFilterA />
        </Variant>
        <Variant
          label="B — Activity Timeline"
          description="Timeline-basiertes Filtering: »Heute · 7 Tage · 30 Tage · Inaktiv«. Plus Master-Toggle hervorgehoben."
        >
          <BoardFilterB />
        </Variant>
        <Variant
          label="C — Tag-Cloud"
          description="Tag-Cloud mit Größe = Häufigkeit. Visuell auf einen Blick wofür Boards genutzt werden. Suche bleibt prominent."
        >
          <BoardFilterC />
        </Variant>
      </div>
    </section>
  );
}

// A — Tool-Type Cards
function BoardFilterA() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5">
        {TOOLS.map((t, i) => (
          <button
            key={t.name}
            className={`relative overflow-hidden rounded-lg border px-2 py-3 transition-all hover:-translate-y-0.5 ${
              i === 0
                ? "border-foreground/30 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)]"
                : "border-border/60 hover:border-foreground/20"
            }`}
            style={{
              background: i === 0
                ? `linear-gradient(135deg, color-mix(in oklch, ${t.color} 18%, transparent), color-mix(in oklch, ${t.color} 5%, transparent))`
                : undefined,
            }}
          >
            <div
              className="mx-auto mb-1 flex size-7 items-center justify-center rounded-md text-[10px] font-bold uppercase tabular-nums"
              style={{
                background: `color-mix(in oklch, ${t.color} 18%, transparent)`,
                color: t.color,
              }}
            >
              {t.name.slice(0, 2)}
            </div>
            <div className="text-center text-[10px] font-medium leading-tight" style={{ color: i === 0 ? t.color : undefined }}>
              {t.name}
            </div>
            <div className="text-center text-[9px] tabular-nums text-muted-foreground/60">
              {t.count}
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            placeholder="Board, Tag, URL …"
            className="h-8 w-full rounded-lg border border-border/60 bg-background/40 pl-8 pr-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none"
            readOnly
          />
        </div>
        <button className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-600">
          <Star className="size-3 fill-current" />
          Master
        </button>
      </div>
    </div>
  );
}

// B — Activity Timeline
function BoardFilterB() {
  const buckets = [
    { label: "Heute", count: 3, active: false },
    { label: "Letzte 7 Tage", count: 8, active: true },
    { label: "Letzte 30 Tage", count: 14, active: false },
    { label: "Älter / Inaktiv", count: 22, active: false },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-background/40 p-2">
        <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Activity className="size-3" />
          Aktivität
        </div>
        <div className="grid grid-cols-4 gap-1">
          {buckets.map((b) => (
            <button
              key={b.label}
              className={`rounded-lg px-2 py-2 text-center transition-all ${
                b.active
                  ? "bg-gradient-to-br from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.3)]"
                  : "text-muted-foreground hover:bg-accent/40"
              }`}
            >
              <div className="text-base font-semibold tabular-nums leading-none">
                {b.count}
              </div>
              <div className="mt-0.5 text-[9px] font-medium leading-tight">
                {b.label}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            placeholder="Suchen …"
            className="h-8 w-full rounded-lg border border-border/60 bg-background/40 pl-8 pr-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none"
            readOnly
          />
        </div>
        <button className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
          <Star className="size-3 fill-current" />
          Nur Master
        </button>
        <button className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground">
          <User className="size-3" />
          Trainer
          <ChevronDown className="size-3" />
        </button>
      </div>
    </div>
  );
}

// C — Tag-Cloud
function BoardFilterC() {
  const max = Math.max(...TAGS.map((t) => t.weight));
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <input
          placeholder="Board, Tag, URL durchsuchen …"
          className="h-10 w-full rounded-xl border border-border/60 bg-background/40 pl-10 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-[var(--neon-violet)]/40 focus:outline-none"
          readOnly
        />
      </div>
      <div className="rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">
            Beliebte Tags
          </span>
          <span className="text-muted-foreground/60">Klick = filter</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {TAGS.map((t, i) => {
            const scale = t.weight / max; // 0.0 - 1.0
            const fontSize = 11 + scale * 9; // 11px - 20px
            const opacity = 0.5 + scale * 0.5;
            return (
              <button
                key={t.tag}
                className={`rounded font-medium transition-all hover:scale-110 ${
                  i === 0 ? "text-[var(--neon-violet)]" : "text-foreground hover:text-[var(--neon-violet)]"
                }`}
                style={{
                  fontSize,
                  opacity,
                }}
              >
                #{t.tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
