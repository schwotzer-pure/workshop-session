import { prisma } from "@/lib/prisma";

/**
 * Snapshot shape: a self-contained dump of everything that constitutes the
 * workshop "content" — days, blocks (incl. children), tasks, materials.
 *
 * Things deliberately NOT in the snapshot (because they're operational, not
 * content):
 * - LiveSession state
 * - Comments (audit-style record, shouldn't be rolled back)
 * - WorkshopShare (permissions, separate concern)
 * - Versions themselves
 */
export type WorkshopSnapshot = {
  workshop: {
    title: string;
    description: string | null;
    status: string;
    clientName: string | null;
    tags: string[];
    startDate: string | null;
    timezone: string;
  };
  days: Array<{
    position: number;
    title: string | null;
    startTime: string;
    date: string | null;
    blocks: Array<SnapshotBlock>;
  }>;
};

/**
 * Method snapshot — block hierarchy without the workshop/day wrapper.
 * Re-uses SnapshotBlock so the same restore logic applies (parentOrigId map).
 */
export type MethodSnapshot = {
  blocks: Array<SnapshotBlock>;
};

export type SnapshotBlock = {
  /** Original ID — used to remap parentBlockId references during restore. */
  origId: string;
  position: number;
  column: number;
  type: string;
  title: string;
  description: string | null;
  notes: string | null;
  duration: number;
  locked: boolean;
  startTime: string | null;
  parentOrigId: string | null;
  categoryId: string | null;
  methodId: string | null;
  assignedToId: string | null;
  tasks: Array<{
    text: string;
    done: boolean;
    position: number;
  }>;
  materials: Array<{
    name: string;
    quantity: number | null;
    notes: string | null;
  }>;
};

export async function snapshotWorkshop(
  workshopId: string
): Promise<WorkshopSnapshot> {
  const w = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: {
      days: {
        orderBy: { position: "asc" },
        include: {
          blocks: {
            orderBy: [{ position: "asc" }, { column: "asc" }],
            include: {
              tasks: { orderBy: { position: "asc" } },
              materials: true,
            },
          },
        },
      },
    },
  });
  if (!w) throw new Error("Workshop not found");

  return {
    workshop: {
      title: w.title,
      description: w.description,
      status: w.status,
      clientName: w.clientName,
      tags: w.tags,
      startDate: w.startDate ? w.startDate.toISOString() : null,
      timezone: w.timezone,
    },
    days: w.days.map((d) => ({
      position: d.position,
      title: d.title,
      startTime: d.startTime,
      date: d.date ? d.date.toISOString() : null,
      blocks: d.blocks.map((b) => ({
        origId: b.id,
        position: b.position,
        column: b.column,
        type: b.type,
        title: b.title,
        description: b.description,
        notes: b.notes,
        duration: b.duration,
        locked: b.locked,
        startTime: b.startTime,
        parentOrigId: b.parentBlockId,
        categoryId: b.categoryId,
        methodId: b.methodId,
        assignedToId: b.assignedToId,
        tasks: b.tasks.map((t) => ({
          text: t.text,
          done: t.done,
          position: t.position,
        })),
        materials: b.materials.map((m) => ({
          name: m.name,
          quantity: m.quantity,
          notes: m.notes,
        })),
      })),
    })),
  };
}

/**
 * Replace the live workshop content with the snapshot. Does NOT change
 * the workshop's id, createdById, organizationId, shares, or live sessions.
 */
export async function restoreWorkshop(
  workshopId: string,
  snapshot: WorkshopSnapshot
): Promise<void> {
  // Existing days (and their blocks via cascade) are removed first.
  // Materials linked to the workshop directly (without block) are also wiped
  // so the snapshot is the only source of truth.
  await prisma.$transaction(async (tx) => {
    await tx.day.deleteMany({ where: { workshopId } });
    await tx.material.deleteMany({ where: { workshopId } });

    await tx.workshop.update({
      where: { id: workshopId },
      data: {
        title: snapshot.workshop.title,
        description: snapshot.workshop.description,
        clientName: snapshot.workshop.clientName,
        tags: snapshot.workshop.tags,
        startDate: snapshot.workshop.startDate
          ? new Date(snapshot.workshop.startDate)
          : null,
        timezone: snapshot.workshop.timezone,
      },
    });

    for (const d of snapshot.days) {
      const newDay = await tx.day.create({
        data: {
          workshopId,
          position: d.position,
          title: d.title,
          startTime: d.startTime,
          date: d.date ? new Date(d.date) : null,
        },
      });

      // Two passes: parents first, then children — so we can map IDs.
      const idMap = new Map<string, string>();
      const parents = d.blocks.filter((b) => b.parentOrigId === null);
      const children = d.blocks.filter((b) => b.parentOrigId !== null);

      for (const b of parents) {
        const created = await tx.block.create({
          data: {
            dayId: newDay.id,
            position: b.position,
            column: b.column,
            type: b.type as
              | "BLOCK"
              | "GROUP"
              | "BREAKOUT"
              | "NOTE",
            title: b.title,
            description: b.description,
            notes: b.notes,
            duration: b.duration,
            locked: b.locked,
            startTime: b.startTime,
            categoryId: b.categoryId,
            methodId: b.methodId,
            assignedToId: b.assignedToId,
          },
        });
        idMap.set(b.origId, created.id);

        for (const t of b.tasks) {
          await tx.task.create({
            data: {
              blockId: created.id,
              text: t.text,
              done: t.done,
              position: t.position,
            },
          });
        }
        for (const m of b.materials) {
          await tx.material.create({
            data: {
              workshopId,
              blockId: created.id,
              name: m.name,
              quantity: m.quantity,
              notes: m.notes,
            },
          });
        }
      }

      for (const b of children) {
        const newParentId = b.parentOrigId
          ? idMap.get(b.parentOrigId)
          : null;
        if (!newParentId) continue;
        const created = await tx.block.create({
          data: {
            dayId: newDay.id,
            position: b.position,
            column: b.column,
            type: b.type as
              | "BLOCK"
              | "GROUP"
              | "BREAKOUT"
              | "NOTE",
            title: b.title,
            description: b.description,
            notes: b.notes,
            duration: b.duration,
            locked: b.locked,
            startTime: b.startTime,
            parentBlockId: newParentId,
            categoryId: b.categoryId,
            methodId: b.methodId,
            assignedToId: b.assignedToId,
          },
        });
        idMap.set(b.origId, created.id);

        for (const t of b.tasks) {
          await tx.task.create({
            data: {
              blockId: created.id,
              text: t.text,
              done: t.done,
              position: t.position,
            },
          });
        }
        for (const m of b.materials) {
          await tx.material.create({
            data: {
              workshopId,
              blockId: created.id,
              name: m.name,
              quantity: m.quantity,
              notes: m.notes,
            },
          });
        }
      }
    }
  });
}
