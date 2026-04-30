/**
 * One-shot migration: workshop-level Material entries (url set, blockId=null)
 * are migrated to the new Board + WorkshopBoard model.
 *
 * - For each material row: create a Board (deduplicated per (workshopId, url),
 *   so re-running the script is idempotent).
 * - Attach the Board to the source Workshop via WorkshopBoard.
 * - The original Material row is left intact (the queries are switched over to
 *   Board, so it just becomes orphaned data we can clean up later).
 *
 * Run: pnpm exec tsx prisma/migrate-boards.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const linkMaterials = await prisma.material.findMany({
    where: { url: { not: null }, blockId: null },
    include: { workshop: { select: { createdById: true, organizationId: true } } },
  });

  console.log(`Found ${linkMaterials.length} workshop-level link materials.`);
  let created = 0;
  let attached = 0;
  let skipped = 0;

  for (const m of linkMaterials) {
    if (!m.url) continue;

    const existingBoard = await prisma.board.findFirst({
      where: { url: m.url, createdById: m.workshop.createdById },
      select: { id: true },
    });

    let boardId: string;
    if (existingBoard) {
      boardId = existingBoard.id;
      skipped++;
    } else {
      const board = await prisma.board.create({
        data: {
          title: m.name,
          url: m.url,
          notes: m.notes,
          isMaster: false,
          createdById: m.workshop.createdById,
          organizationId: m.workshop.organizationId,
        },
        select: { id: true },
      });
      boardId = board.id;
      created++;
    }

    const existingLink = await prisma.workshopBoard.findUnique({
      where: { workshopId_boardId: { workshopId: m.workshopId, boardId } },
    });
    if (!existingLink) {
      await prisma.workshopBoard.create({
        data: { workshopId: m.workshopId, boardId, notes: m.notes },
      });
      attached++;
    }
  }

  console.log(
    `→ ${created} new boards created, ${skipped} reused, ${attached} workshop-attachments made.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
