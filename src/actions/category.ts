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

const CreateCategorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().min(3).max(80),
});

export async function createCategoryAction(input: z.input<typeof CreateCategorySchema>) {
  const user = await requireUser();
  const data = CreateCategorySchema.parse(input);

  const last = await prisma.blockCategory.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const nextPos = (last?.position ?? -1) + 1;

  const category = await prisma.blockCategory.create({
    data: {
      name: data.name,
      color: data.color,
      position: nextPos,
      isSystem: false,
      createdById: user.id,
    },
  });

  revalidatePath("/dashboard");
  return category;
}

const UpdateCategorySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().min(3).max(80).optional(),
});

export async function updateCategoryAction(input: z.input<typeof UpdateCategorySchema>) {
  await requireUser();
  const data = UpdateCategorySchema.parse(input);
  const cat = await prisma.blockCategory.findUnique({ where: { id: data.id } });
  if (!cat) throw new Error("Kategorie nicht gefunden");
  if (cat.isSystem) throw new Error("System-Kategorien können nicht geändert werden");
  await prisma.blockCategory.update({
    where: { id: data.id },
    data: {
      name: data.name,
      color: data.color,
    },
  });
}

export async function deleteCategoryAction(id: string) {
  await requireUser();
  const cat = await prisma.blockCategory.findUnique({ where: { id } });
  if (!cat) return;
  if (cat.isSystem) throw new Error("System-Kategorien können nicht gelöscht werden");
  await prisma.blockCategory.delete({ where: { id } });
}

export async function listCategoriesForUser() {
  const user = await requireUser();
  return prisma.blockCategory.findMany({
    where: {
      OR: [{ isSystem: true }, { createdById: user.id }],
    },
    orderBy: [{ isSystem: "desc" }, { position: "asc" }],
  });
}
