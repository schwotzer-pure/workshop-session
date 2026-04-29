import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DUMMY_USERS } from "../src/auth/users";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const SYSTEM_CATEGORIES = [
  { id: "cat_exercise", name: "Exercise", color: "oklch(0.78 0.16 145)", position: 0 },
  { id: "cat_theory", name: "Theory", color: "oklch(0.7 0.16 240)", position: 1 },
  { id: "cat_discussion", name: "Discussion/Debriefing", color: "oklch(0.7 0.18 50)", position: 2 },
  { id: "cat_break", name: "Break", color: "oklch(0.85 0.16 95)", position: 3 },
  { id: "cat_energizer", name: "Energizer/Icebreaker", color: "oklch(0.62 0.22 295)", position: 4 },
];

const ORG_UNION_ID = "org_union";
const ORG_NEUSTADT_ID = "org_neustadt";
const ORG_GOLD_ID = "org_gold";
const ORG_NOVU_ID = "org_novu";
const ORG_PURE_ID = "org_pure";

const ORGANIZATIONS = [
  { id: ORG_UNION_ID, name: "UNION", slug: "union", parentOrgId: null },
  { id: ORG_NEUSTADT_ID, name: "Neustadt", slug: "neustadt", parentOrgId: ORG_UNION_ID },
  { id: ORG_GOLD_ID, name: "Gold", slug: "gold", parentOrgId: ORG_UNION_ID },
  { id: ORG_NOVU_ID, name: "novu", slug: "novu", parentOrgId: ORG_UNION_ID },
  { id: ORG_PURE_ID, name: "Pure", slug: "pure", parentOrgId: ORG_UNION_ID },
];

// Org mapping comes from DUMMY_USERS — single source of truth.

async function main() {
  console.log("→ Seeding organizations …");
  // Parents first (UNION), then children (so the FK is satisfied)
  for (const o of ORGANIZATIONS) {
    await prisma.organization.upsert({
      where: { id: o.id },
      update: {
        name: o.name,
        slug: o.slug,
        parentOrgId: o.parentOrgId,
      },
      create: o,
    });
    console.log(`  ✓ ${o.name}${o.parentOrgId ? " (sister)" : " (umbrella)"}`);
  }

  console.log("→ Seeding dummy users …");
  for (const u of DUMMY_USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        organizationId: u.organizationId,
      },
      create: {
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        organizationId: u.organizationId,
      },
    });
    const orgName = ORGANIZATIONS.find((o) => o.id === u.organizationId)?.name;
    console.log(`  ✓ ${u.username} (${u.role}) → ${orgName ?? "no org"}`);
  }

  // Backfill: assign existing workshops to their creator's organization
  console.log("→ Backfilling workshop organizations from creator …");
  const orphanWorkshops = await prisma.workshop.findMany({
    where: { organizationId: null },
    select: { id: true, createdById: true },
  });
  for (const w of orphanWorkshops) {
    const creator = await prisma.user.findUnique({
      where: { id: w.createdById },
      select: { organizationId: true },
    });
    if (creator?.organizationId) {
      await prisma.workshop.update({
        where: { id: w.id },
        data: { organizationId: creator.organizationId },
      });
    }
  }
  console.log(`  ✓ ${orphanWorkshops.length} workshop(s) backfilled`);

  console.log("→ Seeding system block categories …");
  for (const c of SYSTEM_CATEGORIES) {
    await prisma.blockCategory.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        color: c.color,
        position: c.position,
        isSystem: true,
      },
      create: {
        ...c,
        isSystem: true,
        createdById: null,
      },
    });
    console.log(`  ✓ ${c.name}`);
  }

  console.log("→ Seeding example methods …");
  const methods = [
    // ── Opening / Check-in ─────────────────────────────────────────
    {
      title: "Check-in Runde",
      description: "Kurze Vorstellungsrunde mit einer leichten Frage zum Einstieg, z.B. 'Wie fühlst du dich heute auf einer Skala von 1–10?' oder 'Was beschäftigt dich gerade?'",
      defaultDuration: 10,
      category: "Opening",
      tags: ["Icebreaker", "Opening"],
    },
    {
      title: "Erwartungsabfrage",
      description: "Jede:r notiert auf Stickies, was am Ende des Workshops mitgenommen werden soll. Cluster bilden, am Ende abgleichen.",
      defaultDuration: 15,
      category: "Opening",
      tags: ["Opening", "Expectations"],
    },
    {
      title: "Agenda-Walkthrough",
      description: "Kurze Vorstellung der heutigen Agenda mit Zeitfenstern und Zielen. Fragen klären.",
      defaultDuration: 5,
      category: "Opening",
      tags: ["Opening", "Agenda"],
    },
    {
      title: "Hopes & Fears",
      description: "Zwei Spalten: 'Was hoffe ich' und 'Wovor fürchte ich mich'. Stickies, dann Cluster, kurze Diskussion.",
      defaultDuration: 15,
      category: "Opening",
      tags: ["Opening", "Group Building"],
    },
    // ── Energizer ──────────────────────────────────────────────────
    {
      title: "Energizer: Walk & Talk",
      description: "5 Minuten Bewegung in 2er-Gruppen — kurze Frage diskutieren. Aktiviert Körper und Stimme.",
      defaultDuration: 5,
      category: "Energizer",
      tags: ["Energizer", "Movement"],
    },
    {
      title: "1-2-4-All",
      description: "1 Minute alleine denken, 2 Minuten zu zweit, 4 Minuten zu viert, dann Plenum. Liberating Structure.",
      defaultDuration: 15,
      category: "Energizer",
      tags: ["Energizer", "Group"],
    },
    {
      title: "Two Truths and a Lie",
      description: "Jede:r erzählt zwei wahre und eine erfundene Aussage über sich. Gruppe rät die Lüge.",
      defaultDuration: 10,
      category: "Energizer",
      tags: ["Energizer", "Icebreaker"],
    },
    // ── Idea Generation ────────────────────────────────────────────
    {
      title: "Brainstorming",
      description: "Klassisches Brainstorming: Stille-Phase (5 min) für individuelle Ideen, dann Sammeln und Cluster-Bildung.",
      defaultDuration: 25,
      category: "Idea Generation",
      tags: ["Idea Generation", "Group"],
    },
    {
      title: "Brainwriting (6-3-5)",
      description: "6 Personen, 3 Ideen, 5 Minuten — Round-Robin. Jede Runde baut auf vorherigen Ideen auf.",
      defaultDuration: 30,
      category: "Idea Generation",
      tags: ["Idea Generation", "Silent"],
    },
    {
      title: "Crazy 8s",
      description: "8 Ideen-Skizzen in 8 Minuten, jede:r für sich. Dann teilen und priorisieren.",
      defaultDuration: 20,
      category: "Idea Generation",
      tags: ["Idea Generation", "Sketching"],
    },
    {
      title: "Reverse Brainstorming",
      description: "'Wie könnten wir das Problem absichtlich verschlimmern?' Gegenteilige Ideen sammeln, dann umkehren.",
      defaultDuration: 20,
      category: "Idea Generation",
      tags: ["Idea Generation", "Lateral"],
    },
    {
      title: "How Might We",
      description: "Reframing eines Problems in ein 'Wie könnten wir...?'. Aus diesem Frame entstehen Lösungsansätze.",
      defaultDuration: 15,
      category: "Idea Generation",
      tags: ["Idea Generation", "Framing"],
    },
    // ── Discussion / Debriefing ────────────────────────────────────
    {
      title: "Fishbowl",
      description: "Innenkreis (3–5 Personen) diskutiert, Außenkreis hört zu. Plätze können getauscht werden.",
      defaultDuration: 30,
      category: "Discussion",
      tags: ["Discussion", "Group"],
    },
    {
      title: "World Café",
      description: "Mehrere Tische mit Themen, Gruppen rotieren alle 15–20 min, Tischgastgeber:in fasst zusammen.",
      defaultDuration: 60,
      category: "Discussion",
      tags: ["Discussion", "Rotating"],
    },
    {
      title: "Lean Coffee",
      description: "Themen sammeln, voten, priorisieren. Pro Thema 5 min, weiter wenn die Mehrheit stimmt.",
      defaultDuration: 45,
      category: "Discussion",
      tags: ["Discussion", "Self-organized"],
    },
    // ── Decision Making ────────────────────────────────────────────
    {
      title: "Dot Voting",
      description: "Priorisierung mit Klebepunkten: jede:r Teilnehmende erhält 3 Stimmen, kann diese verteilen oder bündeln.",
      defaultDuration: 10,
      category: "Decision Making",
      tags: ["Decision", "Voting"],
    },
    {
      title: "Fist of Five",
      description: "Daumen-Skala 0–5: 0 = Ablehnung, 5 = volle Zustimmung. Schneller Konsens-Check.",
      defaultDuration: 5,
      category: "Decision Making",
      tags: ["Decision", "Consensus"],
    },
    {
      title: "Effort/Impact Matrix",
      description: "2x2-Matrix: Aufwand (niedrig/hoch) × Impact (niedrig/hoch). Quick Wins identifizieren.",
      defaultDuration: 20,
      category: "Decision Making",
      tags: ["Decision", "Prioritization"],
    },
    // ── Retrospective ──────────────────────────────────────────────
    {
      title: "Retrospektive: Start / Stop / Continue",
      description: "Drei-Spalten-Retro: Was anfangen, was lassen, was beibehalten? Stickies, Clustering, Maßnahmen.",
      defaultDuration: 30,
      category: "Retrospective",
      tags: ["Retrospective", "Feedback"],
    },
    {
      title: "Sailboat-Retrospektive",
      description: "Metapher: Wind treibt an, Anker hält fest, Felsen sind Risiken, Insel ist das Ziel. Visuell wirkungsvoll.",
      defaultDuration: 40,
      category: "Retrospective",
      tags: ["Retrospective", "Visual"],
    },
    {
      title: "Rose / Bud / Thorn",
      description: "Rose = positiv, Bud = Potenzial, Thorn = Problem. Jede:r drei Stickies. Persönlich und positiv konnotiert.",
      defaultDuration: 25,
      category: "Retrospective",
      tags: ["Retrospective", "Feedback"],
    },
    // ── Closing ────────────────────────────────────────────────────
    {
      title: "Action Items Sammlung",
      description: "Konkrete nächste Schritte, mit Verantwortlichen und Deadlines, sichtbar dokumentieren.",
      defaultDuration: 15,
      category: "Closing",
      tags: ["Closing", "Actions"],
    },
    {
      title: "Round of Appreciation",
      description: "Jede:r sagt einer anderen Person etwas Wertschätzendes. Schöner emotionaler Abschluss.",
      defaultDuration: 15,
      category: "Closing",
      tags: ["Closing", "Appreciation"],
    },
    {
      title: "One Word Closing",
      description: "Jede:r fasst den Workshop in genau einem Wort zusammen. Schnell, kraftvoll, persönlich.",
      defaultDuration: 10,
      category: "Closing",
      tags: ["Closing", "Reflection"],
    },
  ];

  for (const m of methods) {
    await prisma.method.upsert({
      where: { id: `seed_${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}` },
      update: {},
      create: {
        id: `seed_${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        ...m,
        isPublic: true,
        createdById: "user_admin",
      },
    });
    console.log(`  ✓ ${m.title}`);
  }

  console.log("\n✓ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
