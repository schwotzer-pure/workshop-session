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

const CreateCoachNoteSchema = z.object({
  liveSessionId: z.string(),
  content: z.string().trim().min(1).max(500),
});

export async function createCoachNoteAction(
  input: z.input<typeof CreateCoachNoteSchema>
) {
  const user = await requireUser();
  const data = CreateCoachNoteSchema.parse(input);

  // Capture the currentBlockId for context
  const live = await prisma.liveSession.findUnique({
    where: { id: data.liveSessionId },
    select: { currentBlockId: true, workshopId: true },
  });
  if (!live) throw new Error("Live-Session nicht gefunden");

  await prisma.coachNote.create({
    data: {
      liveSessionId: data.liveSessionId,
      authorId: user.id,
      content: data.content,
      blockId: live.currentBlockId,
    },
  });

  revalidatePath(`/sessions/${live.workshopId}/live/cockpit`);
  revalidatePath(`/sessions/${live.workshopId}/live/coach`);
}

export async function resolveCoachNoteAction(noteId: string) {
  await requireUser();
  const note = await prisma.coachNote.update({
    where: { id: noteId },
    data: { resolvedAt: new Date() },
    select: { liveSession: { select: { workshopId: true } } },
  });
  revalidatePath(`/sessions/${note.liveSession.workshopId}/live/cockpit`);
  revalidatePath(`/sessions/${note.liveSession.workshopId}/live/coach`);
}

export async function deleteCoachNoteAction(noteId: string) {
  const user = await requireUser();
  const note = await prisma.coachNote.findUnique({
    where: { id: noteId },
    select: {
      authorId: true,
      liveSession: { select: { workshopId: true } },
    },
  });
  if (!note) return;
  if (note.authorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Nicht berechtigt");
  }
  await prisma.coachNote.delete({ where: { id: noteId } });
  revalidatePath(`/sessions/${note.liveSession.workshopId}/live/cockpit`);
  revalidatePath(`/sessions/${note.liveSession.workshopId}/live/coach`);
}
