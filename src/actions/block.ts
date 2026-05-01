"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

async function workshopIdFromDay(dayId: string): Promise<string> {
  const day = await prisma.day.findUnique({
    where: { id: dayId },
    select: { workshopId: true },
  });
  if (!day) throw new Error("Day not found");
  return day.workshopId;
}

async function workshopIdFromBlock(blockId: string): Promise<string> {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: { day: { select: { workshopId: true } } },
  });
  if (!block) throw new Error("Block not found");
  return block.day.workshopId;
}

const BlockTypeEnum = z.enum(["BLOCK", "GROUP", "BREAKOUT", "NOTE"]);

const AddBlockSchema = z.object({
  dayId: z.string(),
  type: BlockTypeEnum.default("BLOCK"),
  title: z.string().default(""),
  duration: z.number().int().min(0).max(720).default(15),
  parentBlockId: z.string().nullable().optional(),
  column: z.number().int().min(0).default(0),
  /** Insert at this index. If undefined, append at end. */
  position: z.number().int().min(0).optional(),
  /** Optional category to assign on creation (used for inheriting from parent group/breakout). */
  categoryId: z.string().nullable().optional(),
});

export async function addBlockAction(input: z.input<typeof AddBlockSchema>) {
  await requireUser();
  const data = AddBlockSchema.parse(input);

  const where = data.parentBlockId
    ? { parentBlockId: data.parentBlockId, column: data.column }
    : { dayId: data.dayId, parentBlockId: null };

  let insertPos: number;
  if (data.position !== undefined) {
    // Shift existing siblings at >= position
    await prisma.block.updateMany({
      where: { ...where, position: { gte: data.position } },
      data: { position: { increment: 1 } },
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

  const duration = data.type === "NOTE" ? 0 : data.duration;
  const block = await prisma.block.create({
    data: {
      dayId: data.dayId,
      type: data.type,
      title: data.title,
      duration,
      position: insertPos,
      parentBlockId: data.parentBlockId ?? null,
      column: data.column,
      categoryId: data.categoryId ?? null,
    },
    include: { category: true },
  });

  // For BREAKOUT, auto-create two empty tracks (column 0 + 1) with one starter block each.
  if (data.type === "BREAKOUT") {
    await prisma.block.createMany({
      data: [
        {
          dayId: data.dayId,
          type: "BLOCK",
          title: "",
          duration: 15,
          position: 0,
          parentBlockId: block.id,
          column: 0,
        },
        {
          dayId: data.dayId,
          type: "BLOCK",
          title: "",
          duration: 15,
          position: 0,
          parentBlockId: block.id,
          column: 1,
        },
      ],
    });
  }

  const workshopId = await workshopIdFromDay(data.dayId);
  revalidatePath(`/sessions/${workshopId}`);
  return block;
}

const UpdateBlockSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  duration: z.number().int().min(0).max(720).optional(),
  type: BlockTypeEnum.optional(),
  categoryId: z.string().nullable().optional(),
  locked: z.boolean().optional(),
  startTime: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function updateBlockAction(input: z.input<typeof UpdateBlockSchema>) {
  await requireUser();
  const data = UpdateBlockSchema.parse(input);

  await prisma.block.update({
    where: { id: data.id },
    data: {
      title: data.title,
      description: data.description,
      notes: data.notes,
      duration: data.duration,
      type: data.type,
      categoryId: data.categoryId,
      locked: data.locked,
      startTime: data.startTime,
      assignedToId: data.assignedToId,
    },
  });

  const workshopId = await workshopIdFromBlock(data.id);
  revalidatePath(`/sessions/${workshopId}`);
}

export async function toggleBlockLockAction(blockId: string) {
  await requireUser();
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: { locked: true, startTime: true, day: { select: { workshopId: true, startTime: true } } },
  });
  if (!block) throw new Error("Block not found");

  await prisma.block.update({
    where: { id: blockId },
    data: {
      locked: !block.locked,
      startTime: !block.locked && !block.startTime ? block.day.startTime : block.startTime,
    },
  });

  revalidatePath(`/sessions/${block.day.workshopId}`);
}

export async function deleteBlockAction(blockId: string) {
  await requireUser();
  const workshopId = await workshopIdFromBlock(blockId);
  await prisma.block.delete({ where: { id: blockId } });
  revalidatePath(`/sessions/${workshopId}`);
}

/**
 * Duplicate a block (including any descendants for GROUP/BREAKOUT) and insert
 * the copy directly after the original.
 */
export async function duplicateBlockAction(blockId: string) {
  await requireUser();

  const original = await prisma.block.findUnique({
    where: { id: blockId },
    include: {
      childBlocks: {
        include: {
          childBlocks: true,
        },
      },
    },
  });
  if (!original) throw new Error("Block not found");

  const insertPos = original.position + 1;
  const where = original.parentBlockId
    ? { parentBlockId: original.parentBlockId, column: original.column }
    : { dayId: original.dayId, parentBlockId: null };

  // Shift siblings >= insertPos
  await prisma.block.updateMany({
    where: { ...where, position: { gte: insertPos } },
    data: { position: { increment: 1 } },
  });

  // Create the duplicate
  const copy = await prisma.block.create({
    data: {
      dayId: original.dayId,
      type: original.type,
      title: original.title,
      description: original.description,
      notes: original.notes,
      duration: original.duration,
      locked: original.locked,
      startTime: original.startTime,
      column: original.column,
      position: insertPos,
      parentBlockId: original.parentBlockId,
      categoryId: original.categoryId,
      assignedToId: original.assignedToId,
      methodId: original.methodId,
    },
  });

  // Recursively copy children
  for (const child of original.childBlocks) {
    await prisma.block.create({
      data: {
        dayId: child.dayId,
        type: child.type,
        title: child.title,
        description: child.description,
        notes: child.notes,
        duration: child.duration,
        locked: child.locked,
        startTime: child.startTime,
        column: child.column,
        position: child.position,
        parentBlockId: copy.id,
        categoryId: child.categoryId,
        assignedToId: child.assignedToId,
        methodId: child.methodId,
      },
    });
  }

  const wsId = await workshopIdFromBlock(blockId);
  revalidatePath(`/sessions/${wsId}`);
  return copy;
}

const ReorderSchema = z.object({
  dayId: z.string(),
  parentBlockId: z.string().nullable().optional(),
  column: z.number().int().min(0).default(0),
  orderedIds: z.array(z.string()),
});

export async function reorderBlocksAction(input: z.input<typeof ReorderSchema>) {
  await requireUser();
  const data = ReorderSchema.parse(input);

  await prisma.$transaction(
    data.orderedIds.map((id, idx) =>
      prisma.block.update({
        where: { id },
        data: { position: idx },
      })
    )
  );
  // No revalidatePath — client already has optimistic state.
}

const MoveBlockSchema = z.object({
  blockId: z.string(),
  toParentBlockId: z.string().nullable(),
  toColumn: z.number().int().min(0),
  fromOrderedIds: z.array(z.string()),
  toOrderedIds: z.array(z.string()),
});

/**
 * Move a block from one bucket (parent + column) to another, and
 * re-position siblings in both buckets atomically.
 *
 * `fromOrderedIds` are the remaining ids in the source bucket (without blockId),
 * `toOrderedIds` are all ids in the destination bucket including blockId at its
 * new index.
 */
export async function moveBlockAction(input: z.input<typeof MoveBlockSchema>) {
  await requireUser();
  const data = MoveBlockSchema.parse(input);

  const newPos = data.toOrderedIds.indexOf(data.blockId);
  if (newPos < 0) throw new Error("blockId must be in toOrderedIds");

  await prisma.$transaction([
    prisma.block.update({
      where: { id: data.blockId },
      data: {
        parentBlockId: data.toParentBlockId,
        column: data.toColumn,
        position: newPos,
      },
    }),
    ...data.fromOrderedIds.map((id, idx) =>
      prisma.block.update({
        where: { id },
        data: { position: idx },
      })
    ),
    ...data.toOrderedIds
      .filter((id) => id !== data.blockId)
      .map((id) =>
        prisma.block.update({
          where: { id },
          data: { position: data.toOrderedIds.indexOf(id) },
        })
      ),
  ]);
  // No revalidatePath — client already has optimistic state.
}

const AddBreakoutTrackSchema = z.object({
  parentBlockId: z.string(),
});

export async function addBreakoutTrackAction(
  input: z.input<typeof AddBreakoutTrackSchema>
) {
  await requireUser();
  const data = AddBreakoutTrackSchema.parse(input);

  const parent = await prisma.block.findUnique({
    where: { id: data.parentBlockId },
    select: { id: true, dayId: true, day: { select: { workshopId: true } } },
  });
  if (!parent) throw new Error("Parent breakout not found");

  const lastTrack = await prisma.block.findFirst({
    where: { parentBlockId: parent.id },
    orderBy: { column: "desc" },
    select: { column: true },
  });
  const newCol = (lastTrack?.column ?? -1) + 1;

  await prisma.block.create({
    data: {
      dayId: parent.dayId,
      type: "BLOCK",
      title: "",
      duration: 15,
      position: 0,
      parentBlockId: parent.id,
      column: newCol,
    },
  });

  revalidatePath(`/sessions/${parent.day.workshopId}`);
}

const RemoveBreakoutTrackSchema = z.object({
  parentBlockId: z.string(),
  column: z.number().int().min(0),
});

export async function removeBreakoutTrackAction(
  input: z.input<typeof RemoveBreakoutTrackSchema>
) {
  await requireUser();
  const data = RemoveBreakoutTrackSchema.parse(input);

  const parent = await prisma.block.findUnique({
    where: { id: data.parentBlockId },
    select: { day: { select: { workshopId: true } } },
  });
  if (!parent) throw new Error("Parent breakout not found");

  await prisma.block.deleteMany({
    where: { parentBlockId: data.parentBlockId, column: data.column },
  });

  // Compact remaining columns to fill the gap
  const remaining = await prisma.block.findMany({
    where: { parentBlockId: data.parentBlockId },
    orderBy: { column: "asc" },
    select: { id: true, column: true },
  });
  const seen = new Map<number, number>();
  let nextCol = 0;
  for (const b of remaining) {
    if (!seen.has(b.column)) {
      seen.set(b.column, nextCol);
      nextCol++;
    }
  }
  await prisma.$transaction(
    remaining
      .filter((b) => seen.get(b.column) !== b.column)
      .map((b) =>
        prisma.block.update({
          where: { id: b.id },
          data: { column: seen.get(b.column)! },
        })
      )
  );

  revalidatePath(`/sessions/${parent.day.workshopId}`);
}
