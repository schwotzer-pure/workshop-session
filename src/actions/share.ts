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

const ShareSchema = z.object({
  workshopId: z.string(),
  userId: z.string(),
  canEdit: z.boolean().default(true),
});

export async function shareWorkshopAction(input: z.input<typeof ShareSchema>) {
  await requireUser();
  const data = ShareSchema.parse(input);
  await prisma.workshopShare.upsert({
    where: {
      workshopId_userId: { workshopId: data.workshopId, userId: data.userId },
    },
    update: { canEdit: data.canEdit },
    create: {
      workshopId: data.workshopId,
      userId: data.userId,
      canEdit: data.canEdit,
    },
  });
  revalidatePath(`/sessions/${data.workshopId}`);
}

export async function unshareWorkshopAction(input: {
  workshopId: string;
  userId: string;
}) {
  await requireUser();
  await prisma.workshopShare.delete({
    where: {
      workshopId_userId: {
        workshopId: input.workshopId,
        userId: input.userId,
      },
    },
  });
  revalidatePath(`/sessions/${input.workshopId}`);
}
