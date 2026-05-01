"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

async function requireWorkshopAccess(workshopId: string, userId: string) {
  const ws = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { id: true, createdById: true, shares: { select: { userId: true } } },
  });
  if (!ws) throw new Error("Workshop nicht gefunden");
  const isOwner = ws.createdById === userId;
  const isShared = ws.shares.some((s) => s.userId === userId);
  if (!isOwner && !isShared) throw new Error("Keine Berechtigung");
  return ws;
}

function generateToken(): string {
  // 32 bytes → 43-char URL-safe base64. Unguessable.
  return randomBytes(32).toString("base64url");
}

const CreateShareLinkSchema = z.object({
  workshopId: z.string(),
  label: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  /** Optional expiry as ISO date string. */
  expiresAt: z.string().nullable().optional(),
});

export async function createShareLinkAction(
  input: z.input<typeof CreateShareLinkSchema>
) {
  const user = await requireUser();
  const data = CreateShareLinkSchema.parse(input);
  await requireWorkshopAccess(data.workshopId, user.id);

  const link = await prisma.workshopShareLink.create({
    data: {
      workshopId: data.workshopId,
      token: generateToken(),
      label: data.label?.trim() || null,
      email: data.email?.trim() || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdById: user.id,
    },
  });

  revalidatePath(`/sessions/${data.workshopId}`);
  revalidateTag("share-links", { expire: 0 });
  return {
    id: link.id,
    token: link.token,
    label: link.label,
    email: link.email,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
    viewCount: link.viewCount,
    lastViewAt: link.lastViewAt?.toISOString() ?? null,
  };
}

export async function revokeShareLinkAction(linkId: string) {
  const user = await requireUser();
  const link = await prisma.workshopShareLink.findUnique({
    where: { id: linkId },
    select: { workshopId: true, createdById: true },
  });
  if (!link) throw new Error("Link nicht gefunden");
  await requireWorkshopAccess(link.workshopId, user.id);

  await prisma.workshopShareLink.update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  });

  revalidatePath(`/sessions/${link.workshopId}`);
  revalidateTag("share-links", { expire: 0 });
}

export async function deleteShareLinkAction(linkId: string) {
  const user = await requireUser();
  const link = await prisma.workshopShareLink.findUnique({
    where: { id: linkId },
    select: { workshopId: true },
  });
  if (!link) return;
  await requireWorkshopAccess(link.workshopId, user.id);

  await prisma.workshopShareLink.delete({ where: { id: linkId } });

  revalidatePath(`/sessions/${link.workshopId}`);
  revalidateTag("share-links", { expire: 0 });
}
