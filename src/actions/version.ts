"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";
import {
  snapshotWorkshop,
  restoreWorkshop,
  type WorkshopSnapshot,
} from "@/lib/version";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

const CreateVersionSchema = z.object({
  workshopId: z.string(),
  label: z.string().trim().max(120).nullable().optional(),
  kind: z.enum(["manual", "auto", "before_restore"]).default("manual"),
});

export async function createVersionAction(
  input: z.input<typeof CreateVersionSchema>
) {
  const user = await requireUser();
  const data = CreateVersionSchema.parse(input);

  const snapshot = await snapshotWorkshop(data.workshopId);

  const v = await prisma.workshopVersion.create({
    data: {
      workshopId: data.workshopId,
      snapshot: snapshot as unknown as object,
      label: data.label ?? null,
      kind: data.kind,
      createdById: user.id,
    },
  });

  revalidatePath(`/sessions/${data.workshopId}`);
  return v;
}

export async function restoreVersionAction(versionId: string) {
  const user = await requireUser();

  const version = await prisma.workshopVersion.findUnique({
    where: { id: versionId },
    select: { workshopId: true, snapshot: true },
  });
  if (!version) throw new Error("Version nicht gefunden");

  // Safety net: snapshot the current state BEFORE restoring
  const safetySnapshot = await snapshotWorkshop(version.workshopId);
  await prisma.workshopVersion.create({
    data: {
      workshopId: version.workshopId,
      snapshot: safetySnapshot as unknown as object,
      label: "Vor Wiederherstellung",
      kind: "before_restore",
      createdById: user.id,
    },
  });

  await restoreWorkshop(
    version.workshopId,
    version.snapshot as unknown as WorkshopSnapshot
  );

  revalidatePath(`/sessions/${version.workshopId}`);
}

export async function deleteVersionAction(versionId: string) {
  await requireUser();
  const v = await prisma.workshopVersion.findUnique({
    where: { id: versionId },
    select: { workshopId: true },
  });
  if (!v) return;
  await prisma.workshopVersion.delete({ where: { id: versionId } });
  revalidatePath(`/sessions/${v.workshopId}`);
}
