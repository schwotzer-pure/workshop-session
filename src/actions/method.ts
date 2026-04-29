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

const InsertMethodSchema = z.object({
  methodId: z.string(),
  dayId: z.string(),
  parentBlockId: z.string().nullable().optional(),
  column: z.number().int().min(0).default(0),
  position: z.number().int().min(0).optional(),
});

/**
 * Create a new block from a Method, inserted at the given position.
 * Pre-fills title, description, duration from the method.
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

  const where = data.parentBlockId
    ? { parentBlockId: data.parentBlockId, column: data.column }
    : { dayId: data.dayId, parentBlockId: null };

  let insertPos: number;
  if (data.position !== undefined) {
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

  const day = await prisma.day.findUnique({
    where: { id: data.dayId },
    select: { workshopId: true },
  });
  if (day) revalidatePath(`/sessions/${day.workshopId}`);
  return block;
}
