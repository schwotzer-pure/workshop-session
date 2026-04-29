"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";
import { getActiveLiveSessionForWorkshop } from "@/lib/live";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

type StoredTiming = {
  blockId: string;
  actualStart?: string;
  actualEnd?: string;
  pausedSecondsAccrued?: number;
};

async function loadLive(liveSessionId: string) {
  const ls = await prisma.liveSession.findUnique({
    where: { id: liveSessionId },
  });
  if (!ls) throw new Error("Live session not found");
  return ls;
}

async function liveStepsForWorkshop(workshopId: string): Promise<string[]> {
  const ws = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: {
      days: {
        orderBy: { position: "asc" },
        include: {
          blocks: {
            where: { parentBlockId: null, type: { not: "NOTE" } },
            orderBy: { position: "asc" },
            select: { id: true },
          },
        },
      },
    },
  });
  return ws?.days[0]?.blocks.map((b) => b.id) ?? [];
}

export async function startLiveSessionAction(workshopId: string) {
  const user = await requireUser();

  const existing = await getActiveLiveSessionForWorkshop(workshopId);
  if (existing) {
    redirect(`/sessions/${workshopId}/live/cockpit`);
  }

  const stepIds = await liveStepsForWorkshop(workshopId);
  if (stepIds.length === 0) {
    throw new Error("Workshop hat noch keine Blöcke");
  }

  const firstBlockId = stepIds[0];
  const now = new Date();
  const initialTimings: StoredTiming[] = [
    { blockId: firstBlockId, actualStart: now.toISOString(), pausedSecondsAccrued: 0 },
  ];

  const live = await prisma.liveSession.create({
    data: {
      workshopId,
      controllerId: user.id,
      status: "RUNNING",
      currentBlockId: firstBlockId,
      startedAt: now,
      blockTimings: initialTimings,
    },
  });

  // Auto-set workshop status to RUNNING (unless ARCHIVED)
  await prisma.workshop.updateMany({
    where: { id: workshopId, status: { not: "ARCHIVED" } },
    data: { status: "RUNNING" },
  });

  revalidatePath(`/sessions/${workshopId}`);
  redirect(`/sessions/${workshopId}/live/cockpit`);
}

const NavigateSchema = z.object({ liveSessionId: z.string() });

export async function nextBlockAction(input: z.input<typeof NavigateSchema>) {
  await requireUser();
  const { liveSessionId } = NavigateSchema.parse(input);
  const ls = await loadLive(liveSessionId);
  if (ls.status !== "RUNNING" && ls.status !== "PAUSED") return;

  const stepIds = await liveStepsForWorkshop(ls.workshopId);
  const currentIdx = stepIds.indexOf(ls.currentBlockId ?? "");
  if (currentIdx < 0 || currentIdx >= stepIds.length - 1) return;

  const nextId = stepIds[currentIdx + 1];
  const now = new Date();
  const timings = ((ls.blockTimings as unknown) as StoredTiming[]) ?? [];
  const updated: StoredTiming[] = [...timings];
  const cur = updated.find((t) => t.blockId === ls.currentBlockId);
  if (cur) cur.actualEnd = now.toISOString();
  updated.push({
    blockId: nextId,
    actualStart: now.toISOString(),
    pausedSecondsAccrued: 0,
  });

  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: {
      currentBlockId: nextId,
      blockTimings: updated,
      pausedAt: null,
      status: "RUNNING",
    },
  });
}

export async function previousBlockAction(input: z.input<typeof NavigateSchema>) {
  await requireUser();
  const { liveSessionId } = NavigateSchema.parse(input);
  const ls = await loadLive(liveSessionId);
  if (ls.status === "ENDED") return;

  const stepIds = await liveStepsForWorkshop(ls.workshopId);
  const currentIdx = stepIds.indexOf(ls.currentBlockId ?? "");
  if (currentIdx <= 0) return;

  const prevId = stepIds[currentIdx - 1];
  const now = new Date();
  const timings = ((ls.blockTimings as unknown) as StoredTiming[]) ?? [];
  const updated: StoredTiming[] = [...timings];
  const cur = updated.find((t) => t.blockId === ls.currentBlockId);
  if (cur) cur.actualEnd = now.toISOString();
  // Re-enter previous block (creates new timing entry for the re-entry)
  updated.push({
    blockId: prevId,
    actualStart: now.toISOString(),
    pausedSecondsAccrued: 0,
  });

  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: {
      currentBlockId: prevId,
      blockTimings: updated,
      pausedAt: null,
      status: "RUNNING",
    },
  });
}

export async function pauseLiveSessionAction(input: z.input<typeof NavigateSchema>) {
  await requireUser();
  const { liveSessionId } = NavigateSchema.parse(input);
  const ls = await loadLive(liveSessionId);
  if (ls.status !== "RUNNING") return;

  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: { status: "PAUSED", pausedAt: new Date() },
  });
}

export async function resumeLiveSessionAction(input: z.input<typeof NavigateSchema>) {
  await requireUser();
  const { liveSessionId } = NavigateSchema.parse(input);
  const ls = await loadLive(liveSessionId);
  if (ls.status !== "PAUSED" || !ls.pausedAt) return;

  const now = new Date();
  const pausedFor = Math.floor((now.getTime() - ls.pausedAt.getTime()) / 1000);

  const timings = ((ls.blockTimings as unknown) as StoredTiming[]) ?? [];
  const updated: StoredTiming[] = [...timings];
  const cur = updated.find((t) => t.blockId === ls.currentBlockId);
  if (cur) cur.pausedSecondsAccrued = (cur.pausedSecondsAccrued ?? 0) + pausedFor;

  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: {
      status: "RUNNING",
      pausedAt: null,
      blockTimings: updated,
    },
  });
}

export async function endLiveSessionAction(input: z.input<typeof NavigateSchema>) {
  await requireUser();
  const { liveSessionId } = NavigateSchema.parse(input);
  const ls = await loadLive(liveSessionId);
  if (ls.status === "ENDED") return;

  const now = new Date();
  const timings = ((ls.blockTimings as unknown) as StoredTiming[]) ?? [];
  const updated: StoredTiming[] = [...timings];
  const cur = updated.find((t) => t.blockId === ls.currentBlockId);
  if (cur && !cur.actualEnd) cur.actualEnd = now.toISOString();

  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: {
      status: "ENDED",
      endedAt: now,
      blockTimings: updated,
    },
  });

  // Auto-set workshop status to COMPLETED (unless ARCHIVED)
  await prisma.workshop.updateMany({
    where: { id: ls.workshopId, status: { not: "ARCHIVED" } },
    data: { status: "COMPLETED" },
  });

  revalidatePath(`/sessions/${ls.workshopId}`);
}

export async function jumpToBlockAction(input: z.input<typeof NavigateSchema> & { blockId: string }) {
  await requireUser();
  const { liveSessionId, blockId } = z
    .object({ liveSessionId: z.string(), blockId: z.string() })
    .parse(input);
  const ls = await loadLive(liveSessionId);
  if (ls.status === "ENDED") return;

  const now = new Date();
  const timings = ((ls.blockTimings as unknown) as StoredTiming[]) ?? [];
  const updated: StoredTiming[] = [...timings];
  const cur = updated.find((t) => t.blockId === ls.currentBlockId);
  if (cur && !cur.actualEnd) cur.actualEnd = now.toISOString();
  updated.push({
    blockId,
    actualStart: now.toISOString(),
    pausedSecondsAccrued: 0,
  });

  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: {
      currentBlockId: blockId,
      blockTimings: updated,
      status: "RUNNING",
      pausedAt: null,
    },
  });
}
