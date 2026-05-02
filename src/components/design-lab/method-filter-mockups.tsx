import {
  Search,
  Clock,
  Sparkles,
  Zap,
  MessageCircle,
  Lightbulb,
  Heart,
  Target,
  CornerDownLeft,
} from "lucide-react";
import { SectionHeader, Variant } from "./dashboard-mockups";

const CATEGORIES = [
  { key: "Opening", icon: CornerDownLeft, count: 4, accent: "oklch(0.74 0.16 145)" },
  { key: "Energizer", icon: Zap, count: 6, accent: "oklch(0.62 0.22 295)" },
  { key: "Idea Generation", icon: Lightbulb, count: 8, accent: "oklch(0.78 0.18 50)" },
  { key: "Discussion", icon: MessageCircle, count: 5, accent: "oklch(0.7 0.18 50)" },
  { key: "Decision Making", icon: Target, count: 3, accent: "oklch(0.72 0.20 25)" },
  { key: "Closing", icon: Heart, count: 4, accent: "oklch(0.74 0.18 340)" },
];

export function MethodFilterMockups() {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Methoden · Filter"
        title="Filter-Bar Methoden"
        subtitle="Methoden werden im Editor unter Zeitdruck gesucht. Drei Konzepte mit unterschiedlichem Fokus auf Speed, Visualität oder Genauigkeit."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Variant
          label="A — Icon-Tabs + Quick-Search"
          description="Kategorie-Icon-Tabs als Hauptnavigation, eine prominente Suchzeile darüber. Schnellster Pfad bei bekannter Kategorie."
        >
          <MethodFilterA />
        </Variant>
        <Variant
          label="B — Duration-Slider"
          description="Slider für »Wie viel Zeit habe ich?« — typische Frage im Editor. Plus Kategorie als Multi-Pills."
        >
          <MethodFilterB />
        </Variant>
        <Variant
          label="C — Two-Column Sidebar"
          description="Filter links als kompakte Sidebar (Kategorien + Dauer-Buckets), rechts der Inhalt. Klassisch, viel Übersicht."
        >
          <MethodFilterC />
        </Variant>
      </div>
    </section>
  );
}

// A — Icon-Tabs + Quick-Search
function MethodFilterA() {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <input
          placeholder="Methode suchen … (z.B. Crazy 8s, Sailboat)"
          className="h-10 w-full rounded-xl border border-border/60 bg-background/40 pl-10 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-[var(--neon-violet)]/40 focus:outline-none"
          readOnly
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {CATEGORIES.slice(0, 6).map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              className={`group flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 transition-all ${
                i === 1 ? "border-foreground/30 bg-foreground/5" : "border-border/60 hover:border-foreground/20"
              }`}
            >
              <div
                className="flex size-7 items-center justify-center rounded-md transition-transform group-hover:scale-110"
                style={{
                  background: `color-mix(in oklch, ${c.accent} 15%, transparent)`,
                  color: c.accent,
                }}
              >
                <Icon className="size-3.5" />
              </div>
              <div className="text-center">
                <div className="text-[10px] font-medium leading-tight">{c.key}</div>
                <div className="text-[9px] tabular-nums text-muted-foreground/60">{c.count}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// B — Duration-Slider
function MethodFilterB() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Clock className="size-3.5 text-[var(--neon-violet)]" />
            Wie viel Zeit?
          </div>
          <span className="rounded-md bg-[var(--neon-violet)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--neon-violet)] tabular-nums">
            10 – 30 min
          </span>
        </div>
        {/* Slider track */}
        <div className="relative h-1.5 rounded-full bg-muted/50">
          <div className="absolute inset-y-0 left-[15%] right-[55%] rounded-full bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]" />
          <div className="absolute left-[15%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-2 ring-[var(--neon-violet)]" />
          <div className="absolute left-[45%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-2 ring-[var(--neon-violet)]" />
        </div>
        <div className="mt-1 flex justify-between text-[9px] tabular-nums text-muted-foreground/60">
          <span>0</span>
          <span>30</span>
          <span>60</span>
          <span>90+</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.key}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
              i < 2 ? "font-semibold text-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            style={i < 2 ? {
              background: `color-mix(in oklch, ${c.accent} 18%, transparent)`,
              borderColor: `color-mix(in oklch, ${c.accent} 40%, transparent)`,
              color: c.accent,
            } : undefined}
          >
            {c.key}
            <span className="rounded-full bg-background/50 px-1 text-[9px] tabular-nums opacity-70">{c.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// C — Two-Column Sidebar
function MethodFilterC() {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <div className="space-y-3 rounded-xl border border-border/60 bg-background/40 p-3 text-[11px]">
        <div>
          <p className="mb-1.5 font-semibold uppercase tracking-wider text-muted-foreground/80">
            Kategorie
          </p>
          <div className="space-y-0.5">
            {CATEGORIES.slice(0, 5).map((c, i) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={i < 2}
                  readOnly
                  className="size-3 rounded accent-[var(--neon-violet)]"
                />
                <span className="size-1.5 rounded-full" style={{ background: c.accent }} />
                <span className={i < 2 ? "text-foreground" : "text-muted-foreground"}>{c.key}</span>
                <span className="ml-auto text-[9px] tabular-nums text-muted-foreground/60">{c.count}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="border-t border-border/40 pt-3">
          <p className="mb-1.5 font-semibold uppercase tracking-wider text-muted-foreground/80">
            Dauer
          </p>
          <div className="space-y-0.5">
            {["< 10 min", "10 – 30 min", "30 – 60 min", "60+ min"].map((d, i) => (
              <label key={d} className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="radio"
                  name="dur"
                  checked={i === 1}
                  readOnly
                  className="size-3 accent-[var(--neon-violet)]"
                />
                <span className={i === 1 ? "text-foreground" : "text-muted-foreground"}>{d}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            placeholder="Suchen …"
            className="h-9 w-full rounded-lg border border-border/60 bg-background/40 pl-8 pr-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none"
            readOnly
          />
        </div>
        <div className="rounded-lg border border-dashed border-border/40 bg-background/20 p-3 text-center text-[10px] text-muted-foreground/60">
          14 Methoden Treffer
        </div>
      </div>
    </div>
  );
}
