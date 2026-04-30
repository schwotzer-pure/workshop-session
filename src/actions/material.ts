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

const CreateMaterialSchema = z.object({
  workshopId: z.string(),
  blockId: z.string().nullable().optional(),
  name: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(9999).nullable().optional(),
  notes: z.string().nullable().optional(),
  url: z.string().trim().url().max(2000).nullable().optional(),
});

export async function createMaterialAction(
  input: z.input<typeof CreateMaterialSchema>
) {
  await requireUser();
  const data = CreateMaterialSchema.parse(input);

  const material = await prisma.material.create({
    data: {
      workshopId: data.workshopId,
      blockId: data.blockId ?? null,
      name: data.name,
      quantity: data.quantity ?? null,
      notes: data.notes ?? null,
      url: data.url ?? null,
    },
  });

  revalidatePath(`/sessions/${data.workshopId}`);
  return material;
}

const UpdateMaterialSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(120).optional(),
  quantity: z.number().int().min(1).max(9999).nullable().optional(),
  notes: z.string().nullable().optional(),
  url: z.string().trim().url().max(2000).nullable().optional(),
});

export async function updateMaterialAction(
  input: z.input<typeof UpdateMaterialSchema>
) {
  await requireUser();
  const data = UpdateMaterialSchema.parse(input);
  const material = await prisma.material.update({
    where: { id: data.id },
    data: {
      name: data.name,
      quantity: data.quantity,
      notes: data.notes,
      url: data.url,
    },
    select: { workshopId: true },
  });
  revalidatePath(`/sessions/${material.workshopId}`);
}

export async function deleteMaterialAction(id: string) {
  await requireUser();
  const material = await prisma.material.findUnique({
    where: { id },
    select: { workshopId: true },
  });
  if (!material) return;
  await prisma.material.delete({ where: { id } });
  revalidatePath(`/sessions/${material.workshopId}`);
}
