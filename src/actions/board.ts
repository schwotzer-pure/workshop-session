"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

function invalidate(workshopId?: string) {
  revalidateTag("boards", { expire: 0 });
  revalidatePath("/dashboard/boards");
  if (workshopId) revalidatePath(`/sessions/${workshopId}`);
}

const CreateBoardSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(2000),
  kind: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  isMaster: z.boolean().default(false),
  /** Optional: directly attach to a workshop after creation. */
  attachToWorkshopId: z.string().nullable().optional(),
  /** Per-workshop notes, only used when attachToWorkshopId is set. */
  workshopNotes: z.string().trim().max(5000).nullable().optional(),
});

export async function createBoardAction(
  input: z.input<typeof CreateBoardSchema>
) {
  const user = await requireUser();
  const data = CreateBoardSchema.parse(input);

  const board = await prisma.board.create({
    data: {
      title: data.title,
      url: data.url,
      kind: data.kind ?? null,
      notes: data.notes ?? null,
      tags: data.tags,
      isMaster: data.isMaster,
      createdById: user.id,
      organizationId: user.organizationId ?? null,
    },
    select: { id: true },
  });

  if (data.attachToWorkshopId) {
    await prisma.workshopBoard.create({
      data: {
        workshopId: data.attachToWorkshopId,
        boardId: board.id,
        notes: data.workshopNotes ?? null,
      },
    });
  }

  invalidate(data.attachToWorkshopId ?? undefined);
  return board.id;
}

const UpdateBoardSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(200).optional(),
  url: z.string().trim().url().max(2000).optional(),
  kind: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
});

export async function updateBoardAction(
  input: z.input<typeof UpdateBoardSchema>
) {
  const user = await requireUser();
  const data = UpdateBoardSchema.parse(input);

  const existing = await prisma.board.findUnique({
    where: { id: data.id },
    select: { createdById: true },
  });
  if (!existing) throw new Error("Board nicht gefunden");
  if (existing.createdById !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }

  await prisma.board.update({
    where: { id: data.id },
    data: {
      title: data.title,
      url: data.url,
      kind: data.kind,
      notes: data.notes,
      tags: data.tags,
    },
  });

  invalidate();
}

export async function toggleBoardMasterAction(
  boardId: string,
  isMaster: boolean
) {
  const user = await requireUser();
  const existing = await prisma.board.findUnique({
    where: { id: boardId },
    select: { createdById: true },
  });
  if (!existing) throw new Error("Board nicht gefunden");
  if (existing.createdById !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }
  await prisma.board.update({
    where: { id: boardId },
    data: { isMaster },
  });
  invalidate();
}

export async function deleteBoardAction(boardId: string) {
  const user = await requireUser();
  const existing = await prisma.board.findUnique({
    where: { id: boardId },
    select: { createdById: true },
  });
  if (!existing) return;
  if (existing.createdById !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }
  await prisma.board.delete({ where: { id: boardId } });
  invalidate();
}

const AttachBoardSchema = z.object({
  workshopId: z.string(),
  boardId: z.string(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export async function attachBoardToWorkshopAction(
  input: z.input<typeof AttachBoardSchema>
) {
  await requireUser();
  const data = AttachBoardSchema.parse(input);

  await prisma.workshopBoard.upsert({
    where: {
      workshopId_boardId: {
        workshopId: data.workshopId,
        boardId: data.boardId,
      },
    },
    create: {
      workshopId: data.workshopId,
      boardId: data.boardId,
      notes: data.notes ?? null,
    },
    update: {
      notes: data.notes ?? null,
    },
  });

  invalidate(data.workshopId);
}

export async function detachBoardFromWorkshopAction(
  workshopId: string,
  boardId: string
) {
  await requireUser();
  await prisma.workshopBoard.delete({
    where: { workshopId_boardId: { workshopId, boardId } },
  });
  invalidate(workshopId);
}

const UpdateAttachmentNotesSchema = z.object({
  workshopId: z.string(),
  boardId: z.string(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export async function updateBoardAttachmentNotesAction(
  input: z.input<typeof UpdateAttachmentNotesSchema>
) {
  await requireUser();
  const data = UpdateAttachmentNotesSchema.parse(input);
  await prisma.workshopBoard.update({
    where: {
      workshopId_boardId: {
        workshopId: data.workshopId,
        boardId: data.boardId,
      },
    },
    data: { notes: data.notes ?? null },
  });
  invalidate(data.workshopId);
}
