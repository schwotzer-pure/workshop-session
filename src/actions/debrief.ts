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

const ApplyMethodCalibrationSchema = z.object({
  methodId: z.string(),
  newDefaultDuration: z.number().int().min(1).max(720),
});

/**
 * Apply a calibration suggestion: update a method's defaultDuration so
 * the next workshop that uses this method starts with a more realistic plan.
 */
export async function applyMethodCalibrationAction(
  input: z.input<typeof ApplyMethodCalibrationSchema>
) {
  await requireUser();
  const data = ApplyMethodCalibrationSchema.parse(input);
  await prisma.method.update({
    where: { id: data.methodId },
    data: { defaultDuration: data.newDefaultDuration },
  });
  revalidatePath("/dashboard/library");
  // Methods cache is invalidated when revalidate=300 expires; live within tolerance.
}
