import {
  CalendarDays,
  Clock3,
  ListChecks,
  Building2,
  Radio,
  Users,
} from "lucide-react";

const SAMPLE = [
  {
    title: "Vision 2027 — Strategie-Klausur",
    client: "Pure AG",
    org: "Pure",
    status: "SCHEDULED",
    statusLabel: "Geplant",
    date: "15. Mai 2026",
    startTime: "09:00",
    endTime: "17:00",
    duration: "5h 10min",
    blocks: 9,
    tags: ["Strategie", "Vision 2027"],
    accentTheme: "violet" as const,
    progress: 0,
  },
  {
    title: "Q1 Retrospektive — Gold",
    client: "Gold Interactive AG",
    org: "Gold",
    status: "COMPLETED",
    statusLabel: "Abgeschlossen",
    date: "22. April 2026",
    startTime: "13:00",
    endTime: "15:30",
    duration: "2h 30min",
    blocks: 7,
    tags: ["Retrospektive", "Q1"],
    accentTheme: "cyan" as const,
    progress: 100,
  },
  {
    title: "Welcome Day @ Neustadt",
    client: "Neustadt AG",
    org: "Neustadt",
    status: "DRAFT",
    statusLabel: "Entwurf",
    date: "Noch ohne Datum",
    startTime: "09:30",
    endTime: "12:30",
    duration: "3h",
    blocks: 7,
    tags: ["Onboarding", "Welcome"],
    accentTheme: "pink" as const,
    progress: 60,
  },
];

const ACCENT: Record<
  "violet" | "cyan" | "pink",
  { bar: string; soft: string; ink: string; chip: string }
> = {
  violet: {
    bar: "from-[var(--neon-violet)] to-[var(--neon-pink)]",
    soft: "from-[var(--neon-violet)]/20 to-transparent",
    ink: "text-[var(--neon-violet)]",
    chip: "bg-[var(--neon-violet)]/15 text-[var(--neon-violet)]",
  },
  cyan: {
    bar: "from-[var(--neon-cyan)] to-[var(--neon-violet)]",
    soft: "from-[var(--neon-cyan)]/20 to-transparent",
    ink: "text-[var(--neon-cyan)]",
    chip: "bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)]",
  },
  pink: {
    bar: "from-[var(--neon-pink)] to-[var(--neon-cyan)]",
    soft: "from-[var(--neon-pink)]/20 to-transparent",
    ink: "text-[var(--neon-pink)]",
    chip: "bg-[var(--neon-pink)]/15 text-[var(--neon-pink)]",
  },
};

export function DashboardMockups() {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Dashboard"
        title="Sessions-Kacheln"
        subtitle="Drei Varianten für die wichtigste Übersicht — in welcher findest du dich am schnellsten zurecht?"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Variant
          label="A — Aurora-Glow"
          description="Großer farbiger Top-Strip, Blur-Glow im Hintergrund, Status als Pill rechts oben."
        >
          <DashboardVariantA />
        </Variant>

        <Variant
          label="B — Editorial-Card"
          description="Magazin-Look: Großer Titel, Client als Subtitle, dezente Linien-Separatoren, Tags als kleine Bonbons."
        >
          <DashboardVariantB />
        </Variant>

        <Variant
          label="C — Status-Driven"
          description="Status dominiert: linker Akzent-Strip, prominente Progress-Bar bei DRAFT, Live-Indikator pulsiert."
        >
          <DashboardVariantC />
        </Variant>
      </div>
    </section>
  );
}

// ─────────── Variant A: Aurora-Glow ───────────

function DashboardVariantA() {
  return (
    <div className="space-y-3">
      {SAMPLE.map((s, i) => {
        const a = ACCENT[s.accentTheme];
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md"
          >
            {/* Aurora blob */}
            <div
              className={`pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-gradient-to-br ${a.soft} blur-3xl opacity-80 transition-opacity group-hover:opacity-100`}
            />
            {/* Top strip */}
            <div className={`h-1 w-full bg-gradient-to-r ${a.bar}`} />
            <div className="relative space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${a.chip}`}>
                  {s.statusLabel}
                </span>
                <span className="text-[11px] text-muted-foreground">vor 2h</span>
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.client}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Building2 className="size-2.5" />
                  {s.org}
                </span>
                {s.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />{s.date}</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{s.startTime}–{s.endTime}</span>
                <span className="inline-flex items-center gap-1"><ListChecks className="size-3" />{s.blocks}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────── Variant B: Editorial-Card ───────────

function DashboardVariantB() {
  return (
    <div className="space-y-3">
      {SAMPLE.map((s, i) => {
        const a = ACCENT[s.accentTheme];
        return (
          <div
            key={i}
            className="group relative rounded-2xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-foreground/30"
          >
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.25em] ${a.ink}`}>
                  {s.org}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.statusLabel}
                </span>
              </div>
              <h3 className="font-heading text-xl leading-tight tracking-tight">
                {s.title}
              </h3>
              <p className="text-xs italic text-muted-foreground">{s.client}</p>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                <span>{s.date}</span>
                <span>·</span>
                <span>{s.duration}</span>
                <span>·</span>
                <span>{s.blocks} Blöcke</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span key={t} className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────── Variant C: Status-Driven ───────────

function DashboardVariantC() {
  return (
    <div className="space-y-3">
      {SAMPLE.map((s, i) => {
        const a = ACCENT[s.accentTheme];
        const isLive = s.status === "RUNNING";
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60"
          >
            <div className="flex">
              {/* Left accent strip */}
              <div className={`w-1.5 shrink-0 bg-gradient-to-b ${a.bar}`} />
              <div className="flex-1 space-y-2.5 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  {isLive ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--neon-pink)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--neon-pink)]">
                      <Radio className="size-2.5 animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${a.chip}`}>
                      {s.statusLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground/70">{s.client}</span> · {s.org}
                </p>
                {s.status === "DRAFT" && s.progress > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Vorbereitung</span>
                      <span className="tabular-nums">{s.progress}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted/50">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${a.bar}`}
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {s.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3" />
                    {s.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" />
                    {s.blocks} Schritte
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────── Shared ───────────

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--neon-violet)]">
        {eyebrow}
      </span>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function Variant({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{label}</h3>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="rounded-2xl border border-border/40 bg-background/30 p-3">
        {children}
      </div>
    </div>
  );
}
