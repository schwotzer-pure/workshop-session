"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";
import type { MethodSnapshot, SnapshotBlock } from "@/lib/version";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new Error("Nicht berechtigt");
  return u;
}

function revalidateMethods() {
  revalidateTag("methods", { expire: 0 });
  revalidatePath("/dashboard/library");
  revalidatePath("/dashboard/admin/methods");
  revalidatePath("/dashboard/me/contributions");
}

const InsertMethodSchema = z.object({
  methodId: z.string(),
  dayId: z.string(),
  parentBlockId: z.string().nullable().optional(),
  column: z.number().int().min(0).default(0),
  position: z.number().int().min(0).optional(),
});

/**
 * Insert a Method into the current day at the requested position.
 *
 * Two paths depending on whether the Method has a snapshot (`blocksJson`):
 * - **Simple method (no snapshot)** — legacy/seed methods: creates one BLOCK
 *   pre-filled from method.title/description/defaultDuration.
 * - **Hierarchy method (snapshot present)** — methods submitted from a
 *   GROUP/BREAKOUT block carry the full block tree: roots are inserted at the
 *   requested position (shifting siblings), children are restored via an
 *   origId→newId map. Multi-pass to handle grandchildren. Tasks and materials
 *   are recreated; categoryId/assignedToId are dropped (workshop-specific).
 *
 * All inserted blocks get methodId = method.id for future tracking
 * (e.g. method-update propagation).
 */
export async function insertMethodAsBlockAction(
  input: z.input<typeof InsertMethodSchema>
) {
  await requireUser();
  const data = InsertMethodSchema.parse(input);

  const method = await prisma.method.findUnique({
    where: { id: data.methodId },
  });
  if (!method) throw new Error("Methode nicht gefunden");

  const day = await prisma.day.findUnique({
    where: { id: data.dayId },
    select: { workshopId: true },
  });
  if (!day) throw new Error("Day nicht gefunden");

  const where = data.parentBlockId
    ? { parentBlockId: data.parentBlockId, column: data.column }
    : { dayId: data.dayId, parentBlockId: null };

  // Decode snapshot up-front so we can compute the shift amount.
  const snapshot =
    method.blocksJson != null
      ? (method.blocksJson as unknown as MethodSnapshot)
      : null;
  const snapshotRoots =
    snapshot?.blocks?.filter((b) => b.parentOrigId === null) ?? [];
  const hasHierarchy = snapshotRoots.length > 0;
  const rootCount = hasHierarchy ? snapshotRoots.length : 1;

  // Determine target position and shift siblings if needed.
  let insertPos: number;
  if (data.position !== undefined) {
    await prisma.block.updateMany({
      where: { ...where, position: { gte: data.position } },
      data: { position: { increment: rootCount } },
    });
    insertPos = data.position;
  } else {
    const last = await prisma.block.findFirst({
      where,
      orderBy: { position: "desc" },
      select: { position: true },
    });
    insertPos = (last?.position ?? -1) + 1;
  }

  // ── Simple method: one BLOCK from method fields ───────────────────────
  if (!hasHierarchy) {
    const block = await prisma.block.create({
      data: {
        dayId: data.dayId,
        type: "BLOCK",
        title: method.title,
        description: method.description,
        duration: method.defaultDuration,
        position: insertPos,
        parentBlockId: data.parentBlockId ?? null,
        column: data.column,
        methodId: method.id,
      },
      include: { category: true },
    });

    revalidatePath(`/sessions/${day.workshopId}`);
    return block;
  }

  // ── Hierarchy method: restore the snapshot ───────────────────────────
  const childrenSnap =
    snapshot?.blocks?.filter((b) => b.parentOrigId !== null) ?? [];

  const blockTypeOf = (t: string) =>
    (t === "GROUP" || t === "BREAKOUT" || t === "NOTE" ? t : "BLOCK") as
      | "BLOCK"
      | "GROUP"
      | "BREAKOUT"
      | "NOTE";

  const orderedRoots = [...snapshotRoots].sort(
    (a, b) => a.position - b.position
  );

  const firstRoot = await prisma.$transaction(async (tx) => {
    const idMap = new Map<string, string>();
    let firstCreatedRoot: Awaited<ReturnType<typeof tx.block.create>> | null =
      null;

    // Roots — placed at insertPos, insertPos+1, ... in the destination
    // (target dayId + parentBlockId + column). Snapshot positions are remapped.
    for (let i = 0; i < orderedRoots.length; i++) {
      const r = orderedRoots[i];
      const created = await tx.block.create({
        data: {
          dayId: data.dayId,
          type: blockTypeOf(r.type),
          title: r.title,
          description: r.description,
          notes: r.notes,
          duration: r.duration,
          locked: r.locked,
          startTime: r.startTime,
          position: insertPos + i,
          parentBlockId: data.parentBlockId ?? null,
          column: data.column,
          methodId: method.id,
        },
        include: { category: true },
      });
      idMap.set(r.origId, created.id);
      if (!firstCreatedRoot) firstCreatedRoot = created;

      for (const t of r.tasks) {
        await tx.task.create({
          data: {
            blockId: created.id,
            text: t.text,
            done: t.done,
            position: t.position,
          },
        });
      }
      for (const m of r.materials) {
        await tx.material.create({
          data: {
            workshopId: day.workshopId,
            blockId: created.id,
            name: m.name,
            quantity: m.quantity,
            notes: m.notes,
          },
        });
      }
    }

    // Children — multi-pass over the queue so grandchildren resolve once
    // their parent has been created. `safety` caps at hierarchy depth.
    let remaining = [...childrenSnap];
    let safety = 0;
    while (remaining.length > 0 && safety < 50) {
      const ready = remaining.filter(
        (b) => b.parentOrigId && idMap.has(b.parentOrigId)
      );
      if (ready.length === 0) break;
      for (const c of ready) {
        const newParentId = idMap.get(c.parentOrigId!)!;
        const created = await tx.block.create({
          data: {
            dayId: data.dayId,
            type: blockTypeOf(c.type),
            title: c.title,
            description: c.description,
            notes: c.notes,
            duration: c.duration,
            locked: c.locked,
            startTime: c.startTime,
            position: c.position,
            column: c.column,
            parentBlockId: newParentId,
            methodId: method.id,
          },
        });
        idMap.set(c.origId, created.id);

        for (const t of c.tasks) {
          await tx.task.create({
            data: {
              blockId: created.id,
              text: t.text,
              done: t.done,
              position: t.position,
            },
          });
        }
        for (const m of c.materials) {
          await tx.material.create({
            data: {
              workshopId: day.workshopId,
              blockId: created.id,
              name: m.name,
              quantity: m.quantity,
              notes: m.notes,
            },
          });
        }
      }
      remaining = remaining.filter((b) => !ready.includes(b));
      safety++;
    }

    if (!firstCreatedRoot) {
      throw new Error("Method-Snapshot enthält keine Root-Blöcke");
    }
    return firstCreatedRoot;
  });

  revalidatePath(`/sessions/${day.workshopId}`);
  return firstRoot;
}

export async function approveMethodAction(methodId: string) {
  const admin = await requireAdmin();
  await prisma.method.update({
    where: { id: methodId },
    data: {
      status: "APPROVED",
      approvedById: admin.id,
      approvedAt: new Date(),
      rejectedReason: null,
    },
  });
  revalidateMethods();
}

export async function rejectMethodAction(input: {
  methodId: string;
  reason?: string | null;
}) {
  const admin = await requireAdmin();
  await prisma.method.update({
    where: { id: input.methodId },
    data: {
      status: "REJECTED",
      approvedById: admin.id,
      approvedAt: new Date(),
      rejectedReason: input.reason ?? null,
    },
  });
  revalidateMethods();
}

const CreateMethodSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  instructions: z.string().trim().max(10000).nullable().optional(),
  defaultDuration: z.number().int().min(1).max(1440).default(15),
  category: z.string().trim().max(50).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

export async function createMethodAction(
  input: z.input<typeof CreateMethodSchema>
) {
  const user = await requireUser();
  const data = CreateMethodSchema.parse(input);

  const method = await prisma.method.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      instructions: data.instructions ?? null,
      defaultDuration: data.defaultDuration ?? 15,
      category: data.category ?? null,
      tags: data.tags,
      status: "PENDING",
      createdById: user.id,
    },
  });

  revalidateMethods();
  return method.id;
}

const SubmitBlockAsMethodSchema = z.object({
  blockId: z.string(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  instructions: z.string().trim().max(10000).nullable().optional(),
  category: z.string().trim().max(50).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

export async function submitBlockAsMethodAction(
  input: z.input<typeof SubmitBlockAsMethodSchema>
) {
  const user = await requireUser();
  const data = SubmitBlockAsMethodSchema.parse(input);

  const root = await prisma.block.findUnique({
    where: { id: data.blockId },
    include: {
      tasks: { orderBy: { position: "asc" } },
      materials: true,
    },
  });
  if (!root) throw new Error("Block nicht gefunden");

  // Collect root + all descendants (children, grand-children …) so the snapshot
  // captures the full hierarchy when this is a GROUP or BREAKOUT.
  const collected = new Map<string, typeof root>();
  collected.set(root.id, root);

  const queue = [root.id];
  while (queue.length > 0) {
    const parentIds = queue.splice(0, queue.length);
    const children = await prisma.block.findMany({
      where: { parentBlockId: { in: parentIds } },
      include: {
        tasks: { orderBy: { position: "asc" } },
        materials: true,
      },
    });
    for (const c of children) {
      if (!collected.has(c.id)) {
        collected.set(c.id, c);
        queue.push(c.id);
      }
    }
  }

  const blocks: SnapshotBlock[] = Array.from(collected.values()).map((b) => ({
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
    // The root block becomes a top-level entry in the snapshot, so its
    // parentOrigId is normalized to null even if it lived under a parent
    // in its origin workshop.
    parentOrigId: b.id === root.id ? null : b.parentBlockId,
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
  }));

  const snapshot: MethodSnapshot = { blocks };

  await prisma.method.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      instructions: data.instructions ?? null,
      defaultDuration: root.duration,
      category: data.category ?? null,
      tags: data.tags,
      blocksJson: snapshot as unknown as object,
      status: "PENDING",
      createdById: user.id,
    },
  });

  revalidateMethods();
}

export async function deleteMethodAction(methodId: string) {
  const user = await requireUser();
  const method = await prisma.method.findUnique({
    where: { id: methodId },
    select: { createdById: true },
  });
  if (!method) return;
  if (method.createdById !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }
  await prisma.method.delete({ where: { id: methodId } });
  revalidateMethods();
}
