"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

const CreateWorkshopSchema = z.object({
  title: z.string().trim().min(1).default("Neue Session"),
  startTime: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/).default("09:00"),
});

export async function createWorkshopAction(formData: FormData) {
  const user = await requireUser();
  const parsed = CreateWorkshopSchema.parse({
    title: formData.get("title") || "Neue Session",
    startTime: formData.get("startTime") || "09:00",
  });

  const workshop = await prisma.workshop.create({
    data: {
      title: parsed.title,
      createdById: user.id,
      organizationId: user.organizationId ?? null,
      days: {
        create: {
          position: 0,
          startTime: parsed.startTime,
          title: "Tag 1",
        },
      },
    },
    include: { days: true },
  });

  revalidatePath("/dashboard");
  redirect(`/sessions/${workshop.id}`);
}

const UpdateWorkshopSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).optional(),
  clientName: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().nullable().optional(),
});

export async function updateWorkshopAction(input: z.input<typeof UpdateWorkshopSchema>) {
  await requireUser();
  const data = UpdateWorkshopSchema.parse(input);

  await prisma.workshop.update({
    where: { id: data.id },
    data: {
      title: data.title,
      clientName: data.clientName,
      tags: data.tags,
      startDate: data.startDate ? new Date(data.startDate) : data.startDate === null ? null : undefined,
    },
  });

  revalidatePath(`/sessions/${data.id}`);
  revalidatePath("/dashboard");
}

export async function deleteWorkshopAction(id: string) {
  await requireUser();
  await prisma.workshop.delete({ where: { id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function archiveWorkshopAction(id: string) {
  await requireUser();
  await prisma.workshop.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  revalidatePath("/dashboard");
  revalidatePath(`/sessions/${id}`);
}

export async function unarchiveWorkshopAction(id: string) {
  await requireUser();
  await prisma.workshop.update({
    where: { id },
    data: { status: "DRAFT" },
  });
  revalidatePath("/dashboard");
  revalidatePath(`/sessions/${id}`);
}

/**
 * Duplicate a workshop with all days, blocks (incl. nested children),
 * tasks and materials. The copy is owned by the current user, status DRAFT,
 * title gets " (Kopie)" appended.
 */
export async function duplicateWorkshopAction(sourceId: string) {
  const user = await requireUser();

  const original = await prisma.workshop.findUnique({
    where: { id: sourceId },
    include: {
      days: {
        orderBy: { position: "asc" },
        include: {
          blocks: {
            orderBy: [{ position: "asc" }, { column: "asc" }],
            include: {
              tasks: { orderBy: { position: "asc" } },
            },
          },
        },
      },
      materials: true,
    },
  });
  if (!original) throw new Error("Workshop not found");

  const newWorkshop = await prisma.workshop.create({
    data: {
      title: `${original.title} (Kopie)`,
      description: original.description,
      status: "DRAFT",
      clientName: original.clientName,
      tags: original.tags,
      startDate: null,
      timezone: original.timezone,
      createdById: user.id,
      organizationId: user.organizationId ?? original.organizationId,
    },
  });

  // Map old IDs → new IDs (so we can rewire parentBlockId for children)
  const blockIdMap = new Map<string, string>();

  for (const day of original.days) {
    const newDay = await prisma.day.create({
      data: {
        workshopId: newWorkshop.id,
        position: day.position,
        title: day.title,
        startTime: day.startTime,
        date: day.date,
      },
    });

    // Two passes: 1) parents (parentBlockId == null), 2) children
    const parents = day.blocks.filter((b) => b.parentBlockId === null);
    const children = day.blocks.filter((b) => b.parentBlockId !== null);

    for (const b of parents) {
      const created = await prisma.block.create({
        data: {
          dayId: newDay.id,
          position: b.position,
          column: b.column,
          type: b.type,
          title: b.title,
          description: b.description,
          notes: b.notes,
          duration: b.duration,
          locked: b.locked,
          startTime: b.startTime,
          categoryId: b.categoryId,
          methodId: b.methodId,
          assignedToId: b.assignedToId,
        },
      });
      blockIdMap.set(b.id, created.id);
      for (const t of b.tasks) {
        await prisma.task.create({
          data: {
            blockId: created.id,
            text: t.text,
            done: false,
            position: t.position,
          },
        });
      }
    }

    for (const b of children) {
      const newParentId = b.parentBlockId
        ? blockIdMap.get(b.parentBlockId)
        : null;
      if (!newParentId) continue;
      const created = await prisma.block.create({
        data: {
          dayId: newDay.id,
          position: b.position,
          column: b.column,
          type: b.type,
          title: b.title,
          description: b.description,
          notes: b.notes,
          duration: b.duration,
          locked: b.locked,
          startTime: b.startTime,
          parentBlockId: newParentId,
          categoryId: b.categoryId,
          methodId: b.methodId,
          assignedToId: b.assignedToId,
        },
      });
      blockIdMap.set(b.id, created.id);
      for (const t of b.tasks) {
        await prisma.task.create({
          data: {
            blockId: created.id,
            text: t.text,
            done: false,
            position: t.position,
          },
        });
      }
    }
  }

  // Copy materials (block-bound and workshop-level)
  for (const m of original.materials) {
    await prisma.material.create({
      data: {
        workshopId: newWorkshop.id,
        blockId: m.blockId ? blockIdMap.get(m.blockId) ?? null : null,
        name: m.name,
        quantity: m.quantity,
        notes: m.notes,
      },
    });
  }

  revalidatePath("/dashboard");
  redirect(`/sessions/${newWorkshop.id}`);
}

const UpdateDaySchema = z.object({
  dayId: z.string(),
  startTime: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/).optional(),
  title: z.string().nullable().optional(),
});

export async function updateDayAction(input: z.input<typeof UpdateDaySchema>) {
  await requireUser();
  const data = UpdateDaySchema.parse(input);
  const day = await prisma.day.update({
    where: { id: data.dayId },
    data: {
      startTime: data.startTime,
      title: data.title,
    },
    select: { workshopId: true },
  });
  revalidatePath(`/sessions/${day.workshopId}`);
}
