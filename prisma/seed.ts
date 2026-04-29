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
    {
      title: "Check-in Runde",
      description: "Kurze Vorstellungsrunde mit einer leichten Frage zum Einstieg.",
      defaultDuration: 10,
      category: "Opening",
      tags: ["Icebreaker", "Opening"],
    },
    {
      title: "Brainstorming",
      description: "Klassisches Brainstorming mit Stille-Phase und Cluster-Bildung.",
      defaultDuration: 25,
      category: "Idea Generation",
      tags: ["Idea Generation", "Group"],
    },
    {
      title: "Dot Voting",
      description: "Priorisierung mit Klebepunkten: jeder Teilnehmende erhält 3 Stimmen.",
      defaultDuration: 10,
      category: "Decision Making",
      tags: ["Decision", "Voting"],
    },
    {
      title: "Energizer: Walk & Talk",
      description: "5 Minuten Bewegung in 2er-Gruppen — kurze Frage diskutieren.",
      defaultDuration: 5,
      category: "Energizer",
      tags: ["Energizer", "Movement"],
    },
    {
      title: "Retrospektive: Start / Stop / Continue",
      description: "Drei-Spalten-Retro: Was anfangen, was lassen, was beibehalten?",
      defaultDuration: 30,
      category: "Retrospective",
      tags: ["Retrospective", "Feedback"],
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
