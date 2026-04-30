"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";
import type { MethodSnapshot, SnapshotBlock } from "@/lib/version";
import { sumChildDurations } from "@/lib/recalc";

/**
 * Effective duration of a block — for GROUP it's the sum of child durations
 * (column 0 only), for BREAKOUT it's max(track-sums), otherwise the block's
 * own duration. Mirrors the editor's recalc logic so Method.defaultDuration
 * matches what users see.
 */
function effectiveDuration(
  block: { id: string; type: string; duration: number },
  children: Array<{ duration: number; type: string; column: number }>
): number {
  if (block.type === "GROUP") {
    return sumChildDurations(
      children.filter((c) => c.column === 0)
    );
  }
  if (block.type === "BREAKOUT") {
    const cols = new Map<number, number>();
    for (const c of children) {
      if (c.type === "NOTE") continue;
      cols.set(c.column, (cols.get(c.column) ?? 0) + c.duration);
    }
    return cols.size ? Math.max(...cols.values()) : 0;
  }
  return block.duration;
}

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

  // Effective duration of root: GROUP=sum(children col-0), BREAKOUT=max(col-sums)
  const rootChildren = Array.from(collected.values()).filter(
    (b) => b.parentBlockId === root.id
  );
  const rootEffectiveDuration = effectiveDuration(root, rootChildren);

  await prisma.method.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      instructions: data.instructions ?? null,
      defaultDuration: rootEffectiveDuration > 0 ? rootEffectiveDuration : 15,
      category: data.category ?? null,
      tags: data.tags,
      blocksJson: snapshot as unknown as object,
      status: "PENDING",
      createdById: user.id,
    },
  });

  revalidateMethods();
}

/**
 * Create a sandbox-Workshop that backs the method editor. Redirects the user
 * to /sessions/[id] where the regular editor recognises `isMethodDraft=true`
 * and adapts its top-header. The draft is hidden from all session listings.
 */
export async function createMethodDraftAction() {
  const user = await requireUser();

  const draft = await prisma.workshop.create({
    data: {
      title: "",
      status: "DRAFT",
      isMethodDraft: true,
      createdById: user.id,
      organizationId: user.organizationId ?? null,
      timezone: "Europe/Zurich",
      days: {
        create: { position: 0, startTime: "09:00" },
      },
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/library");
  return draft.id;
}

const SaveAsMethodSchema = z.object({
  workshopId: z.string(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  instructions: z.string().trim().max(10000).nullable().optional(),
  category: z.string().trim().max(50).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

/**
 * Snapshot the entire block hierarchy of a method-draft workshop into a
 * Method (status=PENDING). The sandbox workshop is deleted afterward.
 */
export async function workshopToMethodAction(
  input: z.input<typeof SaveAsMethodSchema>
) {
  const user = await requireUser();
  const data = SaveAsMethodSchema.parse(input);

  const ws = await prisma.workshop.findUnique({
    where: { id: data.workshopId },
    select: { id: true, isMethodDraft: true, createdById: true },
  });
  if (!ws) throw new Error("Entwurf nicht gefunden");
  if (!ws.isMethodDraft) throw new Error("Workshop ist kein Methoden-Entwurf");
  if (ws.createdById !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }

  // Collect all blocks of this draft into a flat list with parentOrigId.
  const allBlocks = await prisma.block.findMany({
    where: { day: { workshopId: data.workshopId } },
    include: {
      tasks: { orderBy: { position: "asc" } },
      materials: true,
    },
    orderBy: [{ position: "asc" }, { column: "asc" }],
  });

  const blocks: SnapshotBlock[] = allBlocks.map((b) => ({
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
  }));

  const snapshot: MethodSnapshot = { blocks };

  // Compute total duration from top-level blocks. For GROUP/BREAKOUT the
  // duration is computed from children, not from the block's own field.
  const topBlocks = allBlocks.filter((b) => b.parentBlockId === null);
  const childrenByParent = new Map<
    string,
    Array<{ duration: number; type: string; column: number }>
  >();
  for (const b of allBlocks) {
    if (b.parentBlockId) {
      const arr = childrenByParent.get(b.parentBlockId) ?? [];
      arr.push({ duration: b.duration, type: b.type, column: b.column });
      childrenByParent.set(b.parentBlockId, arr);
    }
  }
  const totalDuration = topBlocks
    .filter((b) => b.type !== "NOTE")
    .reduce(
      (sum, b) =>
        sum + effectiveDuration(b, childrenByParent.get(b.id) ?? []),
      0
    );

  await prisma.$transaction(async (tx) => {
    await tx.method.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        instructions: data.instructions ?? null,
        defaultDuration: totalDuration > 0 ? totalDuration : 15,
        category: data.category ?? null,
        tags: data.tags,
        blocksJson: snapshot as unknown as object,
        status: "PENDING",
        createdById: user.id,
      },
    });
    await tx.workshop.delete({ where: { id: data.workshopId } });
  });

  revalidateMethods();
  revalidatePath("/dashboard");
}

export async function discardMethodDraftAction(workshopId: string) {
  const user = await requireUser();
  const ws = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { isMethodDraft: true, createdById: true },
  });
  if (!ws) return;
  if (!ws.isMethodDraft) throw new Error("Kein Methoden-Entwurf");
  if (ws.createdById !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }
  await prisma.workshop.delete({ where: { id: workshopId } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/library");
}

/**
 * Create a fresh DRAFT workshop and embed the method as the first block(s).
 * - If the method has a `blocksJson` snapshot, the full hierarchy is restored
 *   (parents first, then children resolved via origId→newId map, multi-pass
 *   for grandchildren).
 * - Otherwise a single legacy BLOCK is created from the method's metadata.
 * Returns the new workshop id; the caller redirects.
 */
export async function createSessionFromMethodAction(methodId: string) {
  const user = await requireUser();

  const method = await prisma.method.findUnique({
    where: { id: methodId },
  });
  if (!method) throw new Error("Methode nicht gefunden");
  if (method.status !== "APPROVED") {
    throw new Error("Methode ist noch nicht genehmigt");
  }

  // Create the workshop and a single empty day at 09:00.
  const workshop = await prisma.workshop.create({
    data: {
      title: `${method.title} (aus Methode)`,
      status: "DRAFT",
      createdById: user.id,
      organizationId: user.organizationId ?? null,
      days: { create: { position: 0, startTime: "09:00", title: "Tag 1" } },
    },
    include: { days: true },
  });
  const dayId = workshop.days[0].id;

  const blockTypeOf = (t: string) =>
    (t === "GROUP" || t === "BREAKOUT" || t === "NOTE" ? t : "BLOCK") as
      | "BLOCK"
      | "GROUP"
      | "BREAKOUT"
      | "NOTE";

  const snapshot =
    method.blocksJson != null
      ? (method.blocksJson as unknown as MethodSnapshot)
      : null;
  const snapshotRoots =
    snapshot?.blocks?.filter((b) => b.parentOrigId === null) ?? [];
  const childrenSnap =
    snapshot?.blocks?.filter((b) => b.parentOrigId !== null) ?? [];
  const hasHierarchy = snapshotRoots.length > 0;

  if (!hasHierarchy) {
    // Legacy method without snapshot — create one BLOCK from method fields.
    await prisma.block.create({
      data: {
        dayId,
        type: "BLOCK",
        title: method.title,
        description: method.description,
        duration: method.defaultDuration,
        position: 0,
        column: 0,
        methodId: method.id,
      },
    });
  } else {
    const orderedRoots = [...snapshotRoots].sort(
      (a, b) => a.position - b.position
    );

    await prisma.$transaction(async (tx) => {
      const idMap = new Map<string, string>();

      for (let i = 0; i < orderedRoots.length; i++) {
        const r = orderedRoots[i];
        const created = await tx.block.create({
          data: {
            dayId,
            type: blockTypeOf(r.type),
            title: r.title,
            description: r.description,
            notes: r.notes,
            duration: r.duration,
            locked: r.locked,
            startTime: r.startTime,
            position: i,
            column: 0,
            methodId: method.id,
          },
        });
        idMap.set(r.origId, created.id);

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
              workshopId: workshop.id,
              blockId: created.id,
              name: m.name,
              quantity: m.quantity,
              notes: m.notes,
            },
          });
        }
      }

      // Children: multi-pass for grandchildren.
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
              dayId,
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
                workshopId: workshop.id,
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
    });
  }

  revalidateTag("workshops", { expire: 0 });
  revalidatePath("/dashboard");
  return workshop.id;
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
