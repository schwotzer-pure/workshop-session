import {
  CalendarDays,
  Layers,
  LayoutTemplate,
  LibraryBig,
  Radio,
  Share2,
  ClipboardCheck,
  Eye,
  FileDown,
  GitBranch,
  Sparkles,
  Building2,
} from "lucide-react";

export const metadata = {
  title: "Hilfe & FAQ — Sessions",
};

type FeatureCard = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: React.ReactNode;
  accent: "cyan" | "violet" | "pink" | "yellow" | "green";
};

const ACCENTS: Record<FeatureCard["accent"], { strip: string; icon: string; tint: string }> = {
  cyan:   { strip: "bg-[var(--neon-cyan)]",   icon: "text-[var(--neon-cyan)]",   tint: "bg-[var(--neon-cyan)]/[0.07]" },
  violet: { strip: "bg-[var(--neon-violet)]", icon: "text-[var(--neon-violet)]", tint: "bg-[var(--neon-violet)]/[0.07]" },
  pink:   { strip: "bg-[var(--neon-pink)]",   icon: "text-[var(--neon-pink)]",   tint: "bg-[var(--neon-pink)]/[0.07]" },
  yellow: { strip: "bg-[oklch(0.85_0.16_95)]",icon: "text-[oklch(0.65_0.16_85)]",tint: "bg-[oklch(0.85_0.16_95)]/10" },
  green:  { strip: "bg-[oklch(0.78_0.16_145)]",icon: "text-[oklch(0.55_0.16_145)]",tint: "bg-[oklch(0.78_0.16_145)]/10" },
};

const FEATURES: FeatureCard[] = [
  {
    icon: CalendarDays,
    accent: "cyan",
    title: "Sessions",
    body: (
      <>
        Plane Workshops mit einer Drag-&-Drop-Timeline. Blöcke können sequentiell, in
        Gruppen oder als parallele Breakout-Tracks angelegt werden. Zeiten werden
        automatisch berechnet, „Locked"-Blöcke springen den Cursor an einen festen
        Zeitpunkt. Multi-Day-Workshops via Day-Tabs.
      </>
    ),
  },
  {
    icon: LayoutTemplate,
    accent: "violet",
    title: "Vorlagen",
    body: (
      <>
        Komplette Workshops als wiederverwendbare Vorlage einreichen. Admins
        approven, dann steht sie allen Trainer:innen zur Verfügung. Gefiltert
        nach Theme (11 Themen), Dauer und Sterne-Bewertung. Klick auf „Als Session
        erstellen" klont die Vorlage in einen neuen Draft.
      </>
    ),
  },
  {
    icon: LibraryBig,
    accent: "pink",
    title: "Methoden",
    body: (
      <>
        Wiederverwendbare Workshop-Bausteine (Check-in, Brainstorming, Sailboat,
        …). 24 System-Methoden plus eigene. Methoden mit Block-Logik werden im
        gleichen Editor erstellt — die Hierarchie (Group/Breakout) wird beim
        Einfügen rekonstruiert.
      </>
    ),
  },
  {
    icon: Layers,
    accent: "cyan",
    title: "Boards",
    body: (
      <>
        Miro-, Figma-, Notion-Links zentral verwalten und an Sessions anhängen.
        „Master-Boards" sind Vorlagen die alle UNION-Trainer:innen mit einem Klick
        einer Session zuordnen können. Per-Session-Notiz-Override möglich.
      </>
    ),
  },
  {
    icon: Radio,
    accent: "pink",
    title: "Live-Modus",
    body: (
      <>
        Beim Workshop: Cockpit für Trainer:in mit Soll/Ist-Timer, Beamer-Display
        für Teilnehmende, Co-Trainer-Phone-View mit „🔔 Hinweise"-Channel. Pausieren,
        überspringen, vorspringen — Block-Timings werden für die Auswertung
        gespeichert.
      </>
    ),
  },
  {
    icon: Share2,
    accent: "violet",
    title: "Klienten-Portal (extern teilen)",
    body: (
      <>
        Im Teilen-Dialog → Tab „Externer Link". Erstellt eine tokenisierte URL,
        die ohne Login Workshop-Inhalte zeigt — <span className="font-medium">ohne
        Trainer-Notizen</span>. Mit View-Counter, Widerrufen, Löschen.
      </>
    ),
  },
  {
    icon: ClipboardCheck,
    accent: "green",
    title: "Auswertung & Methoden-Kalibrierung",
    body: (
      <>
        Nach einem Live-Run: Soll/Ist-Vergleich pro Block + pro Methode. „In
        Bibliothek übernehmen" setzt die <span className="font-medium">defaultDuration</span>
        einer Methode auf den beobachteten Wert. So lernt deine Methoden-Library
        mit jeder Session.
      </>
    ),
  },
  {
    icon: GitBranch,
    accent: "yellow",
    title: "Versionierung",
    body: (
      <>
        Snapshots des kompletten Workshops mit Label („vor der Galliker-Probe").
        Restore mit automatischer Sicherheits-Sicherung des aktuellen Stands.
        Manuelle und automatische Snapshots werden getrennt aufbewahrt.
      </>
    ),
  },
  {
    icon: FileDown,
    accent: "cyan",
    title: "PDF & Druck-Export",
    body: (
      <>
        Aurora-PDF (server-side) mit Cover, Day-Pages, Anhang. Block-Cards in
        Kategorie-Farben. Logo via Edge-API als PNG embedded. Alternative
        Browser-Druckansicht über Cmd+P-Layout.
      </>
    ),
  },
  {
    icon: Building2,
    accent: "pink",
    title: "Multi-Tenancy",
    body: (
      <>
        UNION als Dachorganisation, darunter Sister-Orgs (Pure, Neustadt, Gold,
        novu, …). Filter „Meine / UNION / Pure / Neustadt / …" auf dem Dashboard.
        Methoden + Master-Boards sind UNION-weit, Workshops gehören einer Org.
      </>
    ),
  },
];

type FaqEntry = { q: string; a: React.ReactNode };

const FAQS: { section: string; items: FaqEntry[] }[] = [
  {
    section: "Workshop-Editor",
    items: [
      {
        q: "Wie ändere ich die Reihenfolge von Blöcken?",
        a: "Drag & Drop am linken Handle (»·· ·· ··«). Blöcke können auch zwischen Top-Level, einer Gruppe und einem Breakout-Track verschoben werden.",
      },
      {
        q: "Was bedeutet das Schloss-Symbol an einer Uhrzeit?",
        a: "Locked = die Startzeit ist fixiert. Bei Insert/Drag von vorderen Blöcken springt der nachfolgende Cursor zur fixierten Zeit, statt zu addieren.",
      },
      {
        q: "Gruppen vs Breakouts — was ist der Unterschied?",
        a: "Gruppe = sequentielle Sub-Blöcke (Dauer = Summe der Kinder). Breakout = parallele Tracks (Dauer = max(Track-Summen)).",
      },
      {
        q: "Werden meine Trainer-Notizen mit Klienten geteilt?",
        a: "Nein. Das Feld »Trainer-Notiz« ist explizit nur im Editor sichtbar — beim externen Share-Link wird es server-seitig rausgefiltert.",
      },
    ],
  },
  {
    section: "Methoden & Vorlagen",
    items: [
      {
        q: "Wann nutze ich Methoden, wann Vorlagen?",
        a: "Methoden = einzelne Bausteine (Check-in, Brainstorming, Closing) zum Wieder-Einfügen. Vorlage = ganzer Workshop als Snapshot, geclont zu einer neuen Session.",
      },
      {
        q: "Kann ich eigene Methoden anlegen?",
        a: "Ja. »+ Neue Methode« öffnet den vollen Editor in einem Sandbox-Workshop. Beim Speichern wird die Block-Hierarchie als Snapshot in die Methoden-Library übernommen.",
      },
      {
        q: "Wie wird aus einer Methode eine Session?",
        a: "Auf jeder Methoden-Card: »Session mit Methode erstellen«. Klont den Snapshot in einen Draft-Workshop, du kannst sofort weiterarbeiten.",
      },
    ],
  },
  {
    section: "Live-Modus",
    items: [
      {
        q: "Wie öffne ich den Beamer-View?",
        a: "Im Cockpit oben rechts »Beamer-Ansicht« — öffnet einen separaten Tab in dem nur der aktive Block + Timer in voller Größe gezeigt wird.",
      },
      {
        q: "Wie schicke ich als Co-Trainer:in Hinweise?",
        a: "URL `/sessions/[id]/live/coach` auf dem Phone öffnen — dort kannst du Notizen tippen die im Cockpit als 🔔-Badge erscheinen.",
      },
      {
        q: "Was passiert nach »Live beenden«?",
        a: "Workshop-Status wird automatisch auf COMPLETED gesetzt, Block-Timings sind gespeichert. Ab dann ist die Auswertung verfügbar.",
      },
    ],
  },
  {
    section: "Klienten-Portal",
    items: [
      {
        q: "Wie erstelle ich einen externen Link?",
        a: "Im Editor → »Teilen« → Tab »Externer Link« → Label (z.B. »Pure AG«) + optional E-Mail → »Link erstellen«. URL kopieren und an Klient senden.",
      },
      {
        q: "Was sieht der Klient?",
        a: "Title, Goals, Description (Markdown), Tools/Boards (klickbar), Datum/Tags, Block-Liste mit Zeiten + Kategorien + Tasks/Materialien. KEINE Trainer-Notizen, keine Comments.",
      },
      {
        q: "Wie sehe ich, ob der Klient den Link geöffnet hat?",
        a: "Im Teilen-Dialog → Tab »Externer Link« zeigt jeder Link »N Aufrufe · zuletzt vor 2h«.",
      },
      {
        q: "Wie widerrufe ich einen Link?",
        a: "Im Dialog: Auge-Icon = widerrufen (URL bleibt, zeigt aber »Link ungültig«). Mülltonne = endgültig löschen.",
      },
    ],
  },
  {
    section: "Auswertung & Lernen",
    items: [
      {
        q: "Wann ist die Auswertung verfügbar?",
        a: "Sobald der Workshop-Status COMPLETED ist (manuell oder durch Live-Beenden). Im Editor-Header erscheint dann der »Auswertung«-Button.",
      },
      {
        q: "Was bedeutet »In Bibliothek übernehmen«?",
        a: "Setzt die defaultDuration der referenzierten Methode auf den beobachteten Soll-Wert. Beim nächsten Einfügen startet die Methode mit der realistischeren Default-Dauer.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[var(--neon-cyan)]/5 via-[var(--neon-violet)]/5 to-[var(--neon-pink)]/5 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-pink)]/20 blur-3xl" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--neon-violet)]">
            <Sparkles className="size-3" />
            Hilfe & FAQ
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Was kann Sessions?
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Alle Features auf einen Blick — und Antworten auf häufige Fragen.
            Wenn etwas fehlt: <a className="text-[var(--neon-violet)] underline-offset-2 hover:underline" href="mailto:christian.schwotzer@hellopure.io">schreib uns</a>.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
            Features
          </h2>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {FEATURES.length} Bereiche
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const accent = ACCENTS[f.accent];
            return (
              <div
                key={f.title}
                className={`glass-card relative overflow-hidden rounded-2xl p-5 ${accent.tint}`}
              >
                <div className={`absolute left-0 top-0 h-full w-1 ${accent.strip}`} />
                <div className="flex items-start gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/60 ${accent.icon}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
          Häufige Fragen
        </h2>
        <div className="space-y-6">
          {FAQS.map((s) => (
            <div key={s.section} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--neon-violet)]" />
                <h3 className="text-sm font-semibold tracking-tight">{s.section}</h3>
              </div>
              <div className="space-y-2">
                {s.items.map((item, idx) => (
                  <details
                    key={idx}
                    className="group rounded-xl border border-border/60 bg-background/40 px-4 py-3 transition-colors open:border-[var(--neon-violet)]/30 open:bg-[var(--neon-violet)]/[0.04]"
                  >
                    <summary className="flex cursor-pointer items-start justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                      <span>{item.q}</span>
                      <span className="mt-0.5 size-5 shrink-0 rounded-md bg-muted/50 text-center text-xs leading-5 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Outro */}
      <section className="rounded-2xl border border-dashed border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.04] p-5">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Eye className="mt-0.5 size-4 shrink-0 text-[var(--neon-violet)]" />
          <span>
            <span className="text-foreground/80">Tipp:</span> Vieles findest du
            auch direkt im Editor — Tooltips an Buttons, „+"-Indikatoren zwischen
            Blöcken, 3-Punkte-Menüs auf jeder Karte.
          </span>
        </p>
      </section>
    </div>
  );
}
