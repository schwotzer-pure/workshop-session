"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";
import { snapshotWorkshop, restoreWorkshop, type WorkshopSnapshot } from "@/lib/version";
import { THEME_KEYS } from "@/lib/themes";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new Error("Nur Admins dürfen das");
  return u;
}

const SubmitTemplateSchema = z.object({
  workshopId: z.string(),
  title: z.string().trim().min(1).max(200),
  theme: z.enum(THEME_KEYS as [string, ...string[]]),
  description: z.string().trim().max(2000).nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export async function submitTemplateAction(
  input: z.input<typeof SubmitTemplateSchema>
) {
  const user = await requireUser();
  const data = SubmitTemplateSchema.parse(input);

  const workshop = await prisma.workshop.findUnique({
    where: { id: data.workshopId },
    include: {
      days: { include: { blocks: true } },
    },
  });
  if (!workshop) throw new Error("Workshop nicht gefunden");

  // Compute approximate total duration for sorting/preview.
  const totalDuration = workshop.days
    .flatMap((d) => d.blocks)
    .filter((b) => b.parentBlockId === null && b.type !== "NOTE")
    .reduce((sum, b) => sum + b.duration, 0);

  const snapshot = await snapshotWorkshop(data.workshopId);

  await prisma.template.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      theme: data.theme,
      tags: data.tags,
      duration: totalDuration,
      blocksJson: snapshot as unknown as object,
      status: "PENDING",
      createdById: user.id,
    },
  });

  revalidatePath("/dashboard/templates");
}

export async function approveTemplateAction(templateId: string) {
  const admin = await requireAdmin();
  await prisma.template.update({
    where: { id: templateId },
    data: {
      status: "APPROVED",
      approvedById: admin.id,
      approvedAt: new Date(),
      rejectedReason: null,
    },
  });
  revalidatePath("/dashboard/templates");
}

export async function rejectTemplateAction(input: {
  templateId: string;
  reason?: string | null;
}) {
  const admin = await requireAdmin();
  await prisma.template.update({
    where: { id: input.templateId },
    data: {
      status: "REJECTED",
      approvedById: admin.id,
      approvedAt: new Date(),
      rejectedReason: input.reason ?? null,
    },
  });
  revalidatePath("/dashboard/templates");
}

export async function deleteTemplateAction(templateId: string) {
  const user = await requireUser();
  const tpl = await prisma.template.findUnique({
    where: { id: templateId },
    select: { createdById: true },
  });
  if (!tpl) return;
  if (tpl.createdById !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }
  await prisma.template.delete({ where: { id: templateId } });
  revalidatePath("/dashboard/templates");
}

const RateTemplateSchema = z.object({
  templateId: z.string(),
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).nullable().optional(),
});

export async function rateTemplateAction(
  input: z.input<typeof RateTemplateSchema>
) {
  const user = await requireUser();
  const data = RateTemplateSchema.parse(input);

  await prisma.templateRating.upsert({
    where: { templateId_userId: { templateId: data.templateId, userId: user.id } },
    update: { score: data.score, comment: data.comment ?? null },
    create: {
      templateId: data.templateId,
      userId: user.id,
      score: data.score,
      comment: data.comment ?? null,
    },
  });

  // Recompute denormalized rating cache
  const aggregate = await prisma.templateRating.aggregate({
    where: { templateId: data.templateId },
    _avg: { score: true },
    _count: { _all: true },
  });
  await prisma.template.update({
    where: { id: data.templateId },
    data: {
      avgRating: aggregate._avg.score ?? null,
      ratingCount: aggregate._count._all,
    },
  });

  revalidatePath("/dashboard/templates");
}

export async function useTemplateAction(templateId: string) {
  const user = await requireUser();

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true, title: true, blocksJson: true, status: true, useCount: true },
  });
  if (!template) throw new Error("Vorlage nicht gefunden");
  if (template.status !== "APPROVED") {
    throw new Error("Vorlage ist noch nicht genehmigt");
  }

  const snapshot = template.blocksJson as unknown as WorkshopSnapshot;

  // Create a fresh empty workshop, then restore the snapshot into it.
  const workshop = await prisma.workshop.create({
    data: {
      title: `${template.title} (aus Vorlage)`,
      status: "DRAFT",
      createdById: user.id,
      organizationId: user.organizationId ?? null,
    },
  });

  await restoreWorkshop(workshop.id, snapshot);

  await prisma.template.update({
    where: { id: templateId },
    data: { useCount: { increment: 1 } },
  });

  revalidatePath("/dashboard/templates");
  redirect(`/sessions/${workshop.id}`);
}
