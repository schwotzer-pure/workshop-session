import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { WorkshopSnapshot } from "../src/lib/version";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const DEMO_PREFIX = "demo_";

// System category ids (from prisma/seed.ts)
const CAT_EXERCISE = "cat_exercise";
const CAT_THEORY = "cat_theory";
const CAT_DISCUSSION = "cat_discussion";
const CAT_BREAK = "cat_break";
const CAT_ENERGIZER = "cat_energizer";

// System method ids (slugged from prisma/seed.ts titles)
const M_CHECKIN = "seed_check_in_runde";
const M_TWO_TRUTHS = "seed_two_truths_and_a_lie";
const M_WALK_TALK = "seed_energizer_walk_talk";
const M_CRAZY_8S = "seed_crazy_8s";
const M_HOW_MIGHT_WE = "seed_how_might_we";
const M_DOT_VOTING = "seed_dot_voting";
const M_EFFORT_IMPACT = "seed_effort_impact_matrix";
const M_SAILBOAT = "seed_sailboat_retrospektive";
const M_APPRECIATION = "seed_round_of_appreciation";
const M_ONE_WORD = "seed_one_word_closing";

// Helper: build a SnapshotBlock for the WorkshopSnapshot.blocksJson structure
type Cat = string | null;
type Mid = string | null;
type SeedBlock = {
  origId: string;
  type: "BLOCK" | "GROUP" | "BREAKOUT" | "NOTE";
  title: string;
  description?: string;
  notes?: string;
  duration: number;
  category?: Cat;
  method?: Mid;
  parentOrigId?: string;
  column?: number;
  position: number;
  tasks?: Array<{ text: string; done?: boolean }>;
  materials?: Array<{ name: string; quantity?: number; notes?: string }>;
};

function snapshotFromBlocks(opts: {
  workshop: {
    title: string;
    goals?: string | null;
    description?: string | null;
    clientName?: string | null;
    tags?: string[];
    timezone?: string;
  };
  startTime?: string;
  blocks: SeedBlock[];
}): WorkshopSnapshot {
  return {
    workshop: {
      title: opts.workshop.title,
      description: opts.workshop.description ?? null,
      status: "DRAFT",
      clientName: opts.workshop.clientName ?? null,
      tags: opts.workshop.tags ?? [],
      startDate: null,
      timezone: opts.workshop.timezone ?? "Europe/Zurich",
    },
    days: [
      {
        position: 0,
        title: "Tag 1",
        startTime: opts.startTime ?? "09:00",
        date: null,
        blocks: opts.blocks.map((b) => ({
          origId: b.origId,
          position: b.position,
          column: b.column ?? 0,
          type: b.type,
          title: b.title,
          description: b.description ?? null,
          notes: b.notes ?? null,
          duration: b.duration,
          locked: false,
          startTime: null,
          parentOrigId: b.parentOrigId ?? null,
          categoryId: b.category ?? null,
          methodId: b.method ?? null,
          assignedToId: null,
          tasks: (b.tasks ?? []).map((t, i) => ({
            text: t.text,
            done: t.done ?? false,
            position: i,
          })),
          materials: (b.materials ?? []).map((m) => ({
            name: m.name,
            quantity: m.quantity ?? null,
            notes: m.notes ?? null,
          })),
        })),
      },
    ],
  };
}

// Helper: write blocks (incl. parent/children) directly to the DB for a workshop+day
async function writeBlocks(dayId: string, workshopId: string, blocks: SeedBlock[]) {
  const idMap = new Map<string, string>();
  const parents = blocks.filter((b) => !b.parentOrigId);
  const children = blocks.filter((b) => b.parentOrigId);

  for (const b of parents) {
    const created = await prisma.block.create({
      data: {
        dayId,
        position: b.position,
        column: b.column ?? 0,
        type: b.type,
        title: b.title,
        description: b.description ?? null,
        notes: b.notes ?? null,
        duration: b.duration,
        categoryId: b.category ?? null,
        methodId: b.method ?? null,
      },
    });
    idMap.set(b.origId, created.id);
    for (const [i, t] of (b.tasks ?? []).entries()) {
      await prisma.task.create({
        data: { blockId: created.id, text: t.text, done: t.done ?? false, position: i },
      });
    }
    for (const m of b.materials ?? []) {
      await prisma.material.create({
        data: {
          workshopId,
          blockId: created.id,
          name: m.name,
          quantity: m.quantity ?? null,
          notes: m.notes ?? null,
        },
      });
    }
  }

  for (const b of children) {
    const parentId = b.parentOrigId ? idMap.get(b.parentOrigId) : null;
    if (!parentId) continue;
    const created = await prisma.block.create({
      data: {
        dayId,
        position: b.position,
        column: b.column ?? 0,
        type: b.type,
        title: b.title,
        description: b.description ?? null,
        notes: b.notes ?? null,
        duration: b.duration,
        categoryId: b.category ?? null,
        methodId: b.method ?? null,
        parentBlockId: parentId,
      },
    });
    idMap.set(b.origId, created.id);
    for (const [i, t] of (b.tasks ?? []).entries()) {
      await prisma.task.create({
        data: { blockId: created.id, text: t.text, done: t.done ?? false, position: i },
      });
    }
    for (const m of b.materials ?? []) {
      await prisma.material.create({
        data: {
          workshopId,
          blockId: created.id,
          name: m.name,
          quantity: m.quantity ?? null,
          notes: m.notes ?? null,
        },
      });
    }
  }
}

// Verifies which seed-method ids exist; null-out missing references so FKs hold.
async function loadAvailableMethodIds(): Promise<Set<string>> {
  const ids = [
    M_CHECKIN, M_TWO_TRUTHS, M_WALK_TALK, M_CRAZY_8S, M_HOW_MIGHT_WE,
    M_DOT_VOTING, M_EFFORT_IMPACT, M_SAILBOAT, M_APPRECIATION, M_ONE_WORD,
  ];
  const found = await prisma.method.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  return new Set(found.map((m) => m.id));
}

function sanitizeMethods(blocks: SeedBlock[], available: Set<string>): SeedBlock[] {
  return blocks.map((b) => ({
    ...b,
    method: b.method && available.has(b.method) ? b.method : null,
  }));
}

// ── Sessions ───────────────────────────────────────────────────────────────

function strategieBlocks(): SeedBlock[] {
  return [
    {
      origId: "s1_b1", position: 0, type: "BLOCK", duration: 15,
      title: "Begrüßung & Check-in",
      description: "Kurze Vorstellungsrunde mit der Frage: 'Was beschäftigt dich gerade rund um die Vision unseres Unternehmens?'",
      notes: "Falls noch nicht alle da sind: erst informell starten, lockerer Einstieg.",
      category: CAT_ENERGIZER,
      method: M_CHECKIN,
      tasks: [
        { text: "Namensschilder vorbereiten" },
        { text: "Pinnwand für Erwartungen aufbauen" },
      ],
      materials: [
        { name: "Stickies (3 Farben)", quantity: 1 },
        { name: "Filzstifte", quantity: 12 },
      ],
    },
    {
      origId: "s1_g1", position: 1, type: "GROUP", duration: 60,
      title: "Standortbestimmung",
      description: "Wo stehen wir heute? Markt + interne Sicht.",
      category: CAT_THEORY,
    },
    {
      origId: "s1_g1_a", parentOrigId: "s1_g1", position: 0, type: "BLOCK", duration: 25,
      title: "Marktanalyse 2025",
      description: "Kurze Präsentation der Marktdaten + Reflexion in 2er-Gruppen.",
      category: CAT_THEORY,
      materials: [{ name: "Slide-Deck Marktanalyse", notes: "auf Beamer" }],
    },
    {
      origId: "s1_g1_b", parentOrigId: "s1_g1", position: 1, type: "BLOCK", duration: 35,
      title: "SWOT-Reflexion",
      description: "Stärken/Schwächen/Chancen/Risiken auf 4 Plakaten sammeln, dann Gruppendiskussion.",
      category: CAT_DISCUSSION,
      tasks: [
        { text: "4 Flipcharts vorbereiten" },
      ],
    },
    {
      origId: "s1_b3", position: 2, type: "NOTE", duration: 15,
      title: "Pause",
      category: CAT_BREAK,
      notes: "Kaffee + Snacks im Foyer.",
    },
    {
      origId: "s1_b4", position: 3, type: "BLOCK", duration: 30,
      title: "Vision-Skizze (Crazy 8s)",
      description: "Jede:r skizziert in 8 Minuten 8 Vision-Bilder für 2027. Danach kurzes Vorstellen in 3er-Gruppen.",
      category: CAT_EXERCISE,
      method: M_CRAZY_8S,
      tasks: [
        { text: "A4-Bögen mit 8-Feldern austeilen" },
        { text: "Sand-Timer auf 8min stellen" },
      ],
      materials: [
        { name: "A4-Skizzenpapier", quantity: 20 },
        { name: "Sand-Timer 8min", quantity: 1 },
      ],
    },
    {
      origId: "s1_b5", position: 4, type: "NOTE", duration: 60,
      title: "Mittagspause",
      category: CAT_BREAK,
      notes: "Catering im Nebenraum (vegan + vegetarisch).",
    },
    {
      origId: "s1_breakout", position: 5, type: "BREAKOUT", duration: 60,
      title: "Stoßrichtungen entwickeln",
      description: "4 parallele Tracks. Jede:r wählt einen Track und arbeitet am Stoßrichtungs-Canvas.",
      category: CAT_EXERCISE,
    },
    {
      origId: "s1_bo_team", parentOrigId: "s1_breakout", position: 0, column: 0, type: "BLOCK", duration: 60,
      title: "Track Team", description: "Wie wollen wir 2027 zusammenarbeiten?",
      category: CAT_EXERCISE,
    },
    {
      origId: "s1_bo_prod", parentOrigId: "s1_breakout", position: 0, column: 1, type: "BLOCK", duration: 60,
      title: "Track Produkt", description: "Wie sieht unser Produkt-Portfolio 2027 aus?",
      category: CAT_EXERCISE,
    },
    {
      origId: "s1_bo_markt", parentOrigId: "s1_breakout", position: 0, column: 2, type: "BLOCK", duration: 60,
      title: "Track Markt", description: "In welchen Märkten sind wir 2027 aktiv?",
      category: CAT_EXERCISE,
    },
    {
      origId: "s1_bo_ops", parentOrigId: "s1_breakout", position: 0, column: 3, type: "BLOCK", duration: 60,
      title: "Track Ops", description: "Welche Strukturen brauchen wir 2027?",
      category: CAT_EXERCISE,
    },
    {
      origId: "s1_b6", position: 6, type: "BLOCK", duration: 45,
      title: "Synthese & Dot-Voting",
      description: "Jeder Track stellt 5 min vor. Anschliessend Dot-Voting auf alle Stoßrichtungen.",
      category: CAT_DISCUSSION,
      method: M_DOT_VOTING,
      materials: [{ name: "Klebepunkte (rot)", quantity: 80 }],
    },
    {
      origId: "s1_b7", position: 7, type: "BLOCK", duration: 15,
      title: "Action Items & Verantwortlichkeiten",
      description: "Pro Top-3 Stoßrichtung: ein:e Pate:in + erstes Action Item bis Ende Mai.",
      category: CAT_EXERCISE,
      tasks: [
        { text: "Action-Items im Miro festhalten" },
        { text: "Verantwortliche pro Stoßrichtung benennen" },
      ],
    },
    {
      origId: "s1_b8", position: 8, type: "BLOCK", duration: 10,
      title: "Closing — One Word",
      description: "Jede:r fasst den Tag in einem Wort zusammen.",
      category: CAT_DISCUSSION,
      method: M_ONE_WORD,
    },
  ];
}

function onboardingBlocks(): SeedBlock[] {
  return [
    {
      origId: "s2_b1", position: 0, type: "BLOCK", duration: 15,
      title: "Begrüßung & Café",
      description: "Lockerer Start mit Kaffee, kurze Begrüßung durch Geschäftsleitung.",
      category: CAT_BREAK,
      notes: "Nicht zu früh starten — erst alle ankommen lassen.",
      materials: [{ name: "Kaffee + Gipfeli", notes: "Catering bestellt" }],
    },
    {
      origId: "s2_b2", position: 1, type: "BLOCK", duration: 20,
      title: "Vorstellungsrunde — Two Truths and a Lie",
      description: "Jede:r erzählt zwei wahre und eine erfundene Aussage. Die Gruppe rät die Lüge.",
      category: CAT_ENERGIZER,
      method: M_TWO_TRUTHS,
    },
    {
      origId: "s2_b3", position: 2, type: "BLOCK", duration: 30,
      title: "Unsere Geschichte",
      description: "Kurzer Rückblick auf die Geschichte von Neustadt — Gründung, Meilensteine, heute.",
      category: CAT_THEORY,
      materials: [{ name: "Slide-Deck Geschichte", notes: "auf Beamer" }],
    },
    {
      origId: "s2_g1", position: 3, type: "GROUP", duration: 60,
      title: "Werte-Workshop",
      description: "Was bedeuten unsere 5 Werte konkret im Alltag?",
      category: CAT_DISCUSSION,
    },
    {
      origId: "s2_g1_a", parentOrigId: "s2_g1", position: 0, type: "BLOCK", duration: 35,
      title: "Werte erleben",
      description: "Jede:r überlegt: Wann hast du einen unserer Werte konkret erlebt? In 3er-Gruppen austauschen.",
      category: CAT_EXERCISE,
    },
    {
      origId: "s2_g1_b", parentOrigId: "s2_g1", position: 1, type: "BLOCK", duration: 25,
      title: "Diskussion & Klärung",
      description: "Plenum: Was war auffällig? Welche Werte sind klar, welche brauchen Schärfung?",
      category: CAT_DISCUSSION,
    },
    {
      origId: "s2_b4", position: 4, type: "NOTE", duration: 10,
      title: "Pause",
      category: CAT_BREAK,
    },
    {
      origId: "s2_b5", position: 5, type: "BLOCK", duration: 30,
      title: "Tour & Buddy-Matching",
      description: "Rundgang durchs Office, jede:r bekommt Buddy aus dem Team zugeteilt.",
      category: CAT_EXERCISE,
      tasks: [
        { text: "Buddy-Liste vorab abstimmen" },
        { text: "Office-Tour-Route prüfen" },
      ],
    },
    {
      origId: "s2_b6", position: 6, type: "BLOCK", duration: 15,
      title: "Closing-Runde",
      description: "Was nimmst du mit? Was ist deine erste Aktion morgen?",
      category: CAT_DISCUSSION,
    },
  ];
}

function retroBlocks(): SeedBlock[] {
  return [
    {
      origId: "s3_b1", position: 0, type: "BLOCK", duration: 10,
      title: "Check-in",
      description: "Wie kommst du heute in den Raum? Skala 1–10.",
      category: CAT_ENERGIZER,
      method: M_CHECKIN,
    },
    {
      origId: "s3_b2", position: 1, type: "BLOCK", duration: 40,
      title: "Daten-Sammlung — Sailboat",
      description: "Wind = was treibt uns an. Anker = was hält uns zurück. Felsen = Risiken. Insel = Q2-Ziel.",
      category: CAT_EXERCISE,
      method: M_SAILBOAT,
      materials: [
        { name: "Sailboat-Plakat", quantity: 1 },
        { name: "Stickies (4 Farben)", quantity: 1 },
      ],
    },
    {
      origId: "s3_g1", position: 2, type: "GROUP", duration: 30,
      title: "Insights ableiten",
      description: "Aus den Stickies werden Cluster und dann Hypothesen.",
      category: CAT_DISCUSSION,
    },
    {
      origId: "s3_g1_a", parentOrigId: "s3_g1", position: 0, type: "BLOCK", duration: 10,
      title: "Cluster bilden",
      description: "Stickies zusammenfassen, Themen-Überschriften vergeben.",
      category: CAT_EXERCISE,
    },
    {
      origId: "s3_g1_b", parentOrigId: "s3_g1", position: 1, type: "BLOCK", duration: 20,
      title: "Hypothesen formulieren",
      description: "Pro Cluster: Was könnte die Ursache sein?",
      category: CAT_DISCUSSION,
    },
    {
      origId: "s3_b3", position: 3, type: "NOTE", duration: 15,
      title: "Pause",
      category: CAT_BREAK,
    },
    {
      origId: "s3_b4", position: 4, type: "BLOCK", duration: 25,
      title: "Maßnahmen — Effort/Impact",
      description: "Mögliche Maßnahmen werden auf der 2x2 Matrix verortet. Quick Wins identifizieren.",
      category: CAT_EXERCISE,
      method: M_EFFORT_IMPACT,
    },
    {
      origId: "s3_b5", position: 5, type: "BLOCK", duration: 15,
      title: "Action Items festhalten",
      description: "3 konkrete Maßnahmen mit Verantwortlichen + Deadline.",
      category: CAT_EXERCISE,
      tasks: [
        { text: "Action Items in Notion festhalten", done: true },
        { text: "Owners benennen", done: true },
        { text: "Review-Termin in 4 Wochen setzen", done: true },
      ],
    },
    {
      origId: "s3_b6", position: 6, type: "BLOCK", duration: 15,
      title: "Round of Appreciation",
      description: "Jede:r sagt einer anderen Person etwas Wertschätzendes.",
      category: CAT_DISCUSSION,
      method: M_APPRECIATION,
    },
  ];
}

function designSprintBlocks(): SeedBlock[] {
  return [
    {
      origId: "s4_b1", position: 0, type: "BLOCK", duration: 10,
      title: "Begrüßung & Tagesziel",
      description: "Tagesplan vorstellen, Sprint-Spielregeln klären.",
      category: CAT_ENERGIZER,
    },
    {
      origId: "s4_b2", position: 1, type: "BLOCK", duration: 5,
      title: "Energizer — Walk & Talk",
      description: "5 min Bewegung, kurze Frage zu zweit diskutieren.",
      category: CAT_ENERGIZER,
      method: M_WALK_TALK,
    },
    {
      origId: "s4_b3", position: 2, type: "BLOCK", duration: 30,
      title: "Problem-Framing — How Might We",
      description: "Aus dem Briefing das zentrale Problem herausarbeiten und in HMW-Fragen umformulieren.",
      category: CAT_EXERCISE,
      method: M_HOW_MIGHT_WE,
    },
    {
      origId: "s4_b4", position: 3, type: "BLOCK", duration: 45,
      title: "User-Interviews — Reflexion",
      description: "Gemeinsam die 5 vorab geführten Interviews durchgehen. Was war auffällig? Welche Patterns?",
      category: CAT_DISCUSSION,
      notes: "Interview-Notizen liegen im Miro. PDF-Backup auf USB.",
    },
    {
      origId: "s4_b5", position: 4, type: "NOTE", duration: 15,
      title: "Pause",
      category: CAT_BREAK,
    },
    {
      origId: "s4_g1", position: 5, type: "GROUP", duration: 60,
      title: "Insights-Mapping",
      description: "Aus den Interview-Patterns Insights ableiten.",
      category: CAT_DISCUSSION,
    },
    {
      origId: "s4_g1_a", parentOrigId: "s4_g1", position: 0, type: "BLOCK", duration: 30,
      title: "Patterns erkennen",
      description: "Cluster aus den Interview-Notizen bilden.",
      category: CAT_EXERCISE,
    },
    {
      origId: "s4_g1_b", parentOrigId: "s4_g1", position: 1, type: "BLOCK", duration: 30,
      title: "Insights formulieren",
      description: "Pro Cluster ein Insight in 'Wir haben gelernt, dass …' formulieren.",
      category: CAT_DISCUSSION,
    },
    {
      origId: "s4_b6", position: 6, type: "NOTE", duration: 60,
      title: "Mittagspause",
      category: CAT_BREAK,
    },
    {
      origId: "s4_b7", position: 7, type: "BLOCK", duration: 20,
      title: "Crazy 8s",
      description: "8 Lösungs-Skizzen in 8 Minuten — alleine, schweigend.",
      category: CAT_EXERCISE,
      method: M_CRAZY_8S,
      materials: [{ name: "A4-Bögen 8-Felder", quantity: 30 }],
    },
    {
      origId: "s4_b8", position: 8, type: "BLOCK", duration: 25,
      title: "Idea-Sharing",
      description: "Jede:r teilt ihre 2 Lieblings-Skizzen in der Gruppe.",
      category: CAT_DISCUSSION,
    },
    {
      origId: "s4_b9", position: 9, type: "NOTE", duration: 10,
      title: "Pause",
      category: CAT_BREAK,
    },
    {
      origId: "s4_b10", position: 10, type: "BLOCK", duration: 15,
      title: "Priorisierung — Dot Voting",
      description: "3 Punkte pro Person auf die vielversprechendsten Lösungs-Ansätze.",
      category: CAT_EXERCISE,
      method: M_DOT_VOTING,
    },
    {
      origId: "s4_b11", position: 11, type: "BLOCK", duration: 10,
      title: "Closing — One Word",
      description: "Wie war der Tag? In einem Wort.",
      category: CAT_DISCUSSION,
      method: M_ONE_WORD,
    },
  ];
}

// ── Templates (full snapshot) ──────────────────────────────────────────────

function tplStrategieBlocks(): SeedBlock[] {
  return [
    { origId: "t1_b1", position: 0, type: "BLOCK", duration: 15, title: "Check-in", description: "Kurze Vorstellungsrunde + Erwartungs-Abfrage.", category: CAT_ENERGIZER, method: M_CHECKIN },
    { origId: "t1_b2", position: 1, type: "BLOCK", duration: 30, title: "Standortbestimmung", description: "Markt + intern auf einer Slide zusammen.", category: CAT_THEORY },
    { origId: "t1_b3", position: 2, type: "BLOCK", duration: 30, title: "Vision-Skizze (Crazy 8s)", description: "8 Skizzen in 8 Minuten, dann teilen.", category: CAT_EXERCISE, method: M_CRAZY_8S },
    { origId: "t1_b4", position: 3, type: "NOTE", duration: 15, title: "Pause", category: CAT_BREAK },
    {
      origId: "t1_g1", position: 4, type: "GROUP", duration: 60, title: "Stoßrichtungen entwickeln",
      description: "In 3er-Gruppen je eine Stoßrichtung ausformulieren.", category: CAT_EXERCISE,
    },
    { origId: "t1_g1a", parentOrigId: "t1_g1", position: 0, type: "BLOCK", duration: 30, title: "Stoßrichtung formulieren", category: CAT_EXERCISE },
    { origId: "t1_g1b", parentOrigId: "t1_g1", position: 1, type: "BLOCK", duration: 30, title: "Pitch vorbereiten", category: CAT_DISCUSSION },
    { origId: "t1_b5", position: 5, type: "BLOCK", duration: 45, title: "Pitches & Dot-Voting", description: "Jede Gruppe pitcht 5 min, dann Voting.", category: CAT_DISCUSSION, method: M_DOT_VOTING },
    { origId: "t1_b6", position: 6, type: "BLOCK", duration: 15, title: "Action Items", description: "Pro Top-3 Stoßrichtung: Pate + 1. Schritt.", category: CAT_EXERCISE },
    { origId: "t1_b7", position: 7, type: "BLOCK", duration: 10, title: "Closing — One Word", category: CAT_DISCUSSION, method: M_ONE_WORD },
  ];
}

function tplOnboardingBlocks(): SeedBlock[] {
  return [
    { origId: "t2_b1", position: 0, type: "BLOCK", duration: 15, title: "Begrüßung & Café", category: CAT_BREAK },
    { origId: "t2_b2", position: 1, type: "BLOCK", duration: 20, title: "Two Truths and a Lie", description: "Vorstellungs-Spiel.", category: CAT_ENERGIZER, method: M_TWO_TRUTHS },
    { origId: "t2_b3", position: 2, type: "BLOCK", duration: 30, title: "Unsere Geschichte", description: "Gründung, Meilensteine, heute.", category: CAT_THEORY },
    {
      origId: "t2_g1", position: 3, type: "GROUP", duration: 60, title: "Werte-Workshop",
      description: "Werte greifbar machen.", category: CAT_DISCUSSION,
    },
    { origId: "t2_g1a", parentOrigId: "t2_g1", position: 0, type: "BLOCK", duration: 35, title: "Werte erleben", category: CAT_EXERCISE },
    { origId: "t2_g1b", parentOrigId: "t2_g1", position: 1, type: "BLOCK", duration: 25, title: "Diskussion", category: CAT_DISCUSSION },
    { origId: "t2_b4", position: 4, type: "NOTE", duration: 10, title: "Pause", category: CAT_BREAK },
    { origId: "t2_b5", position: 5, type: "BLOCK", duration: 30, title: "Tour & Buddy-Matching", category: CAT_EXERCISE },
    { origId: "t2_b6", position: 6, type: "BLOCK", duration: 15, title: "Closing-Runde", category: CAT_DISCUSSION },
  ];
}

function tplRetroBlocks(): SeedBlock[] {
  return [
    { origId: "t3_b1", position: 0, type: "BLOCK", duration: 10, title: "Check-in", category: CAT_ENERGIZER, method: M_CHECKIN },
    { origId: "t3_b2", position: 1, type: "BLOCK", duration: 40, title: "Daten-Sammlung — Sailboat", category: CAT_EXERCISE, method: M_SAILBOAT },
    {
      origId: "t3_g1", position: 2, type: "GROUP", duration: 30, title: "Insights ableiten", category: CAT_DISCUSSION,
    },
    { origId: "t3_g1a", parentOrigId: "t3_g1", position: 0, type: "BLOCK", duration: 10, title: "Cluster bilden", category: CAT_EXERCISE },
    { origId: "t3_g1b", parentOrigId: "t3_g1", position: 1, type: "BLOCK", duration: 20, title: "Hypothesen formulieren", category: CAT_DISCUSSION },
    { origId: "t3_b3", position: 3, type: "NOTE", duration: 15, title: "Pause", category: CAT_BREAK },
    { origId: "t3_b4", position: 4, type: "BLOCK", duration: 25, title: "Effort/Impact-Matrix", category: CAT_EXERCISE, method: M_EFFORT_IMPACT },
    { origId: "t3_b5", position: 5, type: "BLOCK", duration: 15, title: "Action Items", category: CAT_EXERCISE },
    { origId: "t3_b6", position: 6, type: "BLOCK", duration: 15, title: "Round of Appreciation", category: CAT_DISCUSSION, method: M_APPRECIATION },
  ];
}

function tplInnovationBlocks(): SeedBlock[] {
  return [
    { origId: "t4_b1", position: 0, type: "BLOCK", duration: 15, title: "Check-in & Tagesziel", category: CAT_ENERGIZER, method: M_CHECKIN },
    { origId: "t4_b2", position: 1, type: "BLOCK", duration: 30, title: "Problem-Framing — How Might We", category: CAT_EXERCISE, method: M_HOW_MIGHT_WE },
    { origId: "t4_b3", position: 2, type: "BLOCK", duration: 5, title: "Energizer — Walk & Talk", category: CAT_ENERGIZER, method: M_WALK_TALK },
    {
      origId: "t4_g1", position: 3, type: "GROUP", duration: 75, title: "Ideenfindung",
      description: "Zwei Modi nacheinander: divergierend, dann konvergierend.", category: CAT_EXERCISE,
    },
    { origId: "t4_g1a", parentOrigId: "t4_g1", position: 0, type: "BLOCK", duration: 25, title: "Brainstorming", category: CAT_EXERCISE },
    { origId: "t4_g1b", parentOrigId: "t4_g1", position: 1, type: "BLOCK", duration: 20, title: "Crazy 8s", category: CAT_EXERCISE, method: M_CRAZY_8S },
    { origId: "t4_g1c", parentOrigId: "t4_g1", position: 2, type: "BLOCK", duration: 30, title: "Cluster & Themen", category: CAT_DISCUSSION },
    { origId: "t4_b4", position: 4, type: "NOTE", duration: 60, title: "Mittagspause", category: CAT_BREAK },
    {
      origId: "t4_breakout", position: 5, type: "BREAKOUT", duration: 75, title: "Konzept-Track",
      description: "3 parallele Tracks — Konzepte ausarbeiten.", category: CAT_EXERCISE,
    },
    { origId: "t4_bo1", parentOrigId: "t4_breakout", position: 0, column: 0, type: "BLOCK", duration: 75, title: "Track A: Produkt", category: CAT_EXERCISE },
    { origId: "t4_bo2", parentOrigId: "t4_breakout", position: 0, column: 1, type: "BLOCK", duration: 75, title: "Track B: Service", category: CAT_EXERCISE },
    { origId: "t4_bo3", parentOrigId: "t4_breakout", position: 0, column: 2, type: "BLOCK", duration: 75, title: "Track C: Prozess", category: CAT_EXERCISE },
    { origId: "t4_b5", position: 6, type: "BLOCK", duration: 30, title: "Pitches & Dot-Voting", category: CAT_DISCUSSION, method: M_DOT_VOTING },
    { origId: "t4_b6", position: 7, type: "BLOCK", duration: 20, title: "Roadmap-Skizze", category: CAT_EXERCISE },
    { origId: "t4_b7", position: 8, type: "BLOCK", duration: 10, title: "Closing — One Word", category: CAT_DISCUSSION, method: M_ONE_WORD },
  ];
}

function tplKonfliktBlocks(): SeedBlock[] {
  return [
    {
      origId: "t5_b1", position: 0, type: "BLOCK", duration: 10, title: "Eröffnung — Setting & Spielregeln",
      description: "Vertraulichkeit, Reihenfolge, Sprache. Klare Rolle als Mediator:in.",
      category: CAT_THEORY,
      notes: "Spielregeln auf Flipchart sichtbar lassen.",
    },
    { origId: "t5_b2", position: 1, type: "BLOCK", duration: 30, title: "Standpunkte hören", description: "Pro Konfliktpartei je 10 min ungestört, dann 10 min Verständnisfragen.", category: CAT_DISCUSSION },
    {
      origId: "t5_g1", position: 2, type: "GROUP", duration: 50, title: "Perspektivwechsel",
      description: "In zwei Schritten zur gemeinsamen Sicht.", category: CAT_EXERCISE,
    },
    { origId: "t5_g1a", parentOrigId: "t5_g1", position: 0, type: "BLOCK", duration: 25, title: "Eigene Bedürfnisse", description: "Jede:r notiert: Was brauche ich, damit ich gut weiterarbeiten kann?", category: CAT_EXERCISE },
    { origId: "t5_g1b", parentOrigId: "t5_g1", position: 1, type: "BLOCK", duration: 25, title: "Bedürfnisse der Anderen", description: "Versuch der Spiegelung: Was, denke ich, braucht die andere Seite?", category: CAT_DISCUSSION },
    { origId: "t5_b3", position: 3, type: "NOTE", duration: 15, title: "Pause — bewusst getrennt", notes: "Räumlich trennen, kein Smalltalk.", category: CAT_BREAK },
    { origId: "t5_b4", position: 4, type: "BLOCK", duration: 35, title: "Lösungsraum öffnen", description: "Gemeinsame Optionen sammeln (ohne Bewerten).", category: CAT_EXERCISE },
    { origId: "t5_b5", position: 5, type: "BLOCK", duration: 25, title: "Vereinbarung", description: "Konkrete Vereinbarung formulieren — Was, Wer, Bis wann, Review.", category: CAT_DISCUSSION },
    { origId: "t5_b6", position: 6, type: "BLOCK", duration: 15, title: "Abschluss — Was nehme ich mit?", category: CAT_DISCUSSION },
  ];
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("→ Cleaning previous demo data …");
  await prisma.workshop.deleteMany({ where: { id: { startsWith: DEMO_PREFIX } } });
  await prisma.template.deleteMany({ where: { id: { startsWith: DEMO_PREFIX } } });

  const availableMethods = await loadAvailableMethodIds();
  console.log(`  ✓ ${availableMethods.size} system-method ids available for references`);

  // 1) Sessions
  console.log("→ Creating demo sessions …");

  // Session 1 — Strategie (Pure, SCHEDULED)
  {
    const id = "demo_ws_strategy_2027";
    const blocks = sanitizeMethods(strategieBlocks(), availableMethods);
    const ws = await prisma.workshop.create({
      data: {
        id,
        title: "Vision 2027 — Strategie-Klausur Pure",
        goals: "Eine gemeinsame Vision für 2027 entwickeln und in 3 strategische Stoßrichtungen übersetzen.",
        description: "Ganztägige Klausur mit dem Führungskreis. Ergebnis: Vision-Statement + Top 3 Stoßrichtungen mit Verantwortlichen. Vorgesehen für die finale Verabschiedung im Q3-Board-Meeting.",
        clientName: "Pure AG",
        tags: ["Strategie", "Vision 2027", "OKR"],
        status: "SCHEDULED",
        startDate: new Date("2026-05-15T09:00:00.000Z"),
        createdById: "user_trainer",
        organizationId: "org_pure",
        days: { create: { position: 0, startTime: "09:00", title: "Tag 1" } },
      },
      include: { days: true },
    });
    await writeBlocks(ws.days[0].id, ws.id, blocks);
    console.log(`  ✓ ${ws.title}`);
  }

  // Session 2 — Onboarding (Neustadt, DRAFT)
  {
    const id = "demo_ws_onboarding_neustadt";
    const blocks = sanitizeMethods(onboardingBlocks(), availableMethods);
    const ws = await prisma.workshop.create({
      data: {
        id,
        title: "Welcome Day @ Neustadt",
        goals: "Neue Kolleg:innen ans Team und an unsere Werte heranführen.",
        description: "Halbtägiger Welcome-Workshop für die neue Frühlings-Kohorte (5 Personen). Mit Buddy-Matching und Office-Tour.",
        clientName: "Neustadt AG",
        tags: ["Onboarding", "Welcome"],
        status: "DRAFT",
        createdById: "user_marco",
        organizationId: "org_neustadt",
        days: { create: { position: 0, startTime: "09:30", title: "Tag 1" } },
      },
      include: { days: true },
    });
    await writeBlocks(ws.days[0].id, ws.id, blocks);
    console.log(`  ✓ ${ws.title}`);
  }

  // Session 3 — Q1 Retrospektive (Gold, COMPLETED)
  {
    const id = "demo_ws_retro_q1_gold";
    const blocks = sanitizeMethods(retroBlocks(), availableMethods);
    const ws = await prisma.workshop.create({
      data: {
        id,
        title: "Q1 Retrospektive — Gold",
        goals: "Aus dem ersten Quartal lernen und 3 konkrete Verbesserungen für Q2 ableiten.",
        description: "Quartals-Retro mit dem ganzen Gold-Team. Format: Sailboat, Effort/Impact, Action Items.",
        clientName: "Gold Interactive AG",
        tags: ["Retrospektive", "Q1", "Gold"],
        status: "COMPLETED",
        startDate: new Date("2026-04-22T13:00:00.000Z"),
        createdById: "user_yannic",
        organizationId: "org_gold",
        days: { create: { position: 0, startTime: "13:00", title: "Tag 1" } },
      },
      include: { days: true },
    });
    await writeBlocks(ws.days[0].id, ws.id, blocks);
    console.log(`  ✓ ${ws.title}`);
  }

  // Session 4 — Design Sprint (Pure, DRAFT)
  {
    const id = "demo_ws_design_sprint_d1";
    const blocks = sanitizeMethods(designSprintBlocks(), availableMethods);
    const ws = await prisma.workshop.create({
      data: {
        id,
        title: "Design Sprint — Tag 1: Discover",
        goals: "Problem verstehen, Nutzersicht einnehmen und erste Lösungsräume eröffnen.",
        description: "Erster Tag eines klassischen 5-Tage-Design-Sprints. Fokus auf Verstehen + Divergieren. Tag 2 (Decide) am Folgetag.",
        clientName: "RVK GmbH",
        tags: ["Design Thinking", "Sprint", "User Research"],
        status: "DRAFT",
        createdById: "user_trainer",
        organizationId: "org_pure",
        days: { create: { position: 0, startTime: "09:00", title: "Tag 1" } },
      },
      include: { days: true },
    });
    await writeBlocks(ws.days[0].id, ws.id, blocks);
    console.log(`  ✓ ${ws.title}`);
  }

  // 2) Templates (full snapshot)
  console.log("→ Creating demo templates …");

  type TplDef = {
    id: string;
    title: string;
    theme: string;
    description: string;
    tags: string[];
    blocks: SeedBlock[];
    startTime?: string;
    creator: string;
    avgRating?: number;
    ratingCount?: number;
    useCount?: number;
  };

  const templates: TplDef[] = [
    {
      id: "demo_tpl_strategie_klausur",
      title: "Strategie-Klausur (Halbtag)",
      theme: "Strategie",
      description: "Halbtägige Strategie-Klausur mit Standortbestimmung, Vision-Skizze und konkreten Stoßrichtungen. Bewährt für Führungskreise von 6–12 Personen.",
      tags: ["Strategie", "Vision", "Halbtag"],
      blocks: tplStrategieBlocks(),
      creator: "user_trainer",
      avgRating: 4.6, ratingCount: 5, useCount: 7,
    },
    {
      id: "demo_tpl_onboarding_standard",
      title: "Onboarding-Workshop Standard",
      theme: "Onboarding",
      description: "Welcome-Workshop für neue Mitarbeitende mit Vorstellung, Geschichte, Werten und Buddy-Matching.",
      tags: ["Onboarding", "Welcome", "Werte"],
      blocks: tplOnboardingBlocks(),
      creator: "user_marco",
      startTime: "09:30",
      avgRating: 4.4, ratingCount: 4, useCount: 3,
    },
    {
      id: "demo_tpl_retro_quartal",
      title: "Quartals-Retrospektive",
      theme: "Retrospektive",
      description: "Strukturierte Q-Retro mit Sailboat, Effort/Impact-Matrix und konkreten Maßnahmen für das nächste Quartal.",
      tags: ["Retrospektive", "Quartal", "Sailboat"],
      blocks: tplRetroBlocks(),
      creator: "user_yannic",
      startTime: "13:00",
      avgRating: 4.8, ratingCount: 6, useCount: 9,
    },
    {
      id: "demo_tpl_innovation_sprint",
      title: "Innovation-Sprint (1 Tag)",
      theme: "Innovation",
      description: "Eintägiger Innovations-Sprint mit Reframing, divergierender Ideenphase, Konzept-Tracks und Priorisierung.",
      tags: ["Innovation", "Ideation", "Crazy 8s"],
      blocks: tplInnovationBlocks(),
      creator: "user_trainer",
      avgRating: 4.2, ratingCount: 3, useCount: 2,
    },
    {
      id: "demo_tpl_konflikt_klaerung",
      title: "Konflikt-Klärung (Mediation)",
      theme: "Konflikt",
      description: "Mediations-Format zur Klärung eines konkreten Konflikts mit Perspektivwechsel und gemeinsamer Vereinbarung. 2–3 Personen, ein:e Mediator:in.",
      tags: ["Konflikt", "Mediation", "Klärung"],
      blocks: tplKonfliktBlocks(),
      creator: "user_admin",
      avgRating: 4.3, ratingCount: 2, useCount: 1,
    },
  ];

  for (const t of templates) {
    const sanitized = sanitizeMethods(t.blocks, availableMethods);
    const totalDuration = sanitized
      .filter((b) => !b.parentOrigId && b.type !== "NOTE")
      .reduce((sum, b) => sum + b.duration, 0);
    const snapshot = snapshotFromBlocks({
      workshop: {
        title: t.title,
        description: t.description,
        tags: t.tags,
      },
      startTime: t.startTime,
      blocks: sanitized,
    });
    await prisma.template.create({
      data: {
        id: t.id,
        title: t.title,
        description: t.description,
        theme: t.theme,
        tags: t.tags,
        duration: totalDuration,
        blocksJson: snapshot as unknown as object,
        status: "APPROVED",
        avgRating: t.avgRating ?? null,
        ratingCount: t.ratingCount ?? 0,
        useCount: t.useCount ?? 0,
        createdById: t.creator,
        approvedById: "user_admin",
        approvedAt: new Date(),
      },
    });
    console.log(`  ✓ ${t.title} (${t.theme})`);
  }

  console.log("\n✓ Demo seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
