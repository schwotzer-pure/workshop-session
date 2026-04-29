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

async function workshopIdFromBlock(blockId: string): Promise<string> {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: { day: { select: { workshopId: true } } },
  });
  if (!block) throw new Error("Block not found");
  return block.day.workshopId;
}

const CreateTaskSchema = z.object({
  blockId: z.string(),
  text: z.string().trim().min(1).max(500),
});

export async function createTaskAction(input: z.input<typeof CreateTaskSchema>) {
  await requireUser();
  const data = CreateTaskSchema.parse(input);

  const last = await prisma.task.findFirst({
    where: { blockId: data.blockId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const nextPos = (last?.position ?? -1) + 1;

  const task = await prisma.task.create({
    data: {
      blockId: data.blockId,
      text: data.text,
      position: nextPos,
    },
  });

  const wsId = await workshopIdFromBlock(data.blockId);
  revalidatePath(`/sessions/${wsId}`);
  return task;
}

const UpdateTaskSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1).max(500).optional(),
  done: z.boolean().optional(),
});

export async function updateTaskAction(input: z.input<typeof UpdateTaskSchema>) {
  await requireUser();
  const data = UpdateTaskSchema.parse(input);
  const task = await prisma.task.update({
    where: { id: data.id },
    data: { text: data.text, done: data.done },
    select: { block: { select: { day: { select: { workshopId: true } } } } },
  });
  revalidatePath(`/sessions/${task.block.day.workshopId}`);
}

export async function deleteTaskAction(id: string) {
  await requireUser();
  const task = await prisma.task.findUnique({
    where: { id },
    select: { block: { select: { day: { select: { workshopId: true } } } } },
  });
  if (!task) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath(`/sessions/${task.block.day.workshopId}`);
}
