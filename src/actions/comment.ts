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

const CreateCommentSchema = z.object({
  workshopId: z.string(),
  blockId: z.string().nullable().optional(),
  content: z.string().trim().min(1).max(2000),
});

export async function createCommentAction(input: z.input<typeof CreateCommentSchema>) {
  const user = await requireUser();
  const data = CreateCommentSchema.parse(input);

  const comment = await prisma.comment.create({
    data: {
      workshopId: data.workshopId,
      blockId: data.blockId ?? null,
      authorId: user.id,
      content: data.content,
    },
    include: { author: { select: { id: true, name: true, username: true } } },
  });

  revalidatePath(`/sessions/${data.workshopId}`);
  return comment;
}

export async function deleteCommentAction(id: string) {
  const user = await requireUser();
  const c = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, workshopId: true },
  });
  if (!c) return;
  if (c.authorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }
  await prisma.comment.delete({ where: { id } });
  revalidatePath(`/sessions/${c.workshopId}`);
}
