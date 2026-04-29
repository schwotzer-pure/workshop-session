import { prisma } from "@/lib/prisma";
import { recalcBlocks, sumChildDurations } from "@/lib/recalc";

/**
 * "Step" in the live run = one top-level block (BLOCK, GROUP, BREAKOUT).
 * NOTE blocks are skipped (duration 0, just annotations).
 */
export type LiveBlockStep = {
  id: string;
  title: string;
  type: "BLOCK" | "GROUP" | "BREAKOUT";
  duration: number;
  description: string | null;
  notes: string | null;
  category: { id: string; name: string; color: string } | null;
  plannedStartTime: string;
  plannedEndTime: string;
  /** For GROUP/BREAKOUT: child summary lines */
  children: Array<{
    id: string;
    title: string;
    duration: number;
    column: number;
  }>;
};

export type LiveStateView = {
  liveSessionId: string;
  workshopId: string;
  workshopTitle: string;
  status: "IDLE" | "RUNNING" | "PAUSED" | "ENDED";
  startedAt: string | null;
  pausedAt: string | null;
  endedAt: string | null;
  currentBlockId: string | null;
  currentStepIdx: number;
  steps: LiveBlockStep[];
  /** When the current step is supposed to end (computed from actualStart + duration) */
  currentStepActualStartedAt: string | null;
  currentStepPausedSecondsAccrued: number;
};

type StoredTiming = {
  blockId: string;
  actualStart?: string;
  actualEnd?: string;
  pausedSecondsAccrued?: number;
};

export async function getLiveState(liveSessionId: string): Promise<LiveStateView | null> {
  const ls = await prisma.liveSession.findUnique({
    where: { id: liveSessionId },
    include: {
      workshop: {
        include: {
          days: {
            orderBy: { position: "asc" },
            include: {
              blocks: {
                orderBy: [{ position: "asc" }, { column: "asc" }],
                include: { category: true },
              },
            },
          },
        },
      },
    },
  });
  if (!ls) return null;

  const day = ls.workshop.days[0];
  const allBlocks = day?.blocks ?? [];
  const topBlocks = allBlocks.filter((b) => b.parentBlockId === null);
  const childrenByParent = new Map<string, typeof allBlocks>();
  for (const b of allBlocks) {
    if (b.parentBlockId) {
      const arr = childrenByParent.get(b.parentBlockId) ?? [];
      arr.push(b);
      childrenByParent.set(b.parentBlockId, arr);
    }
  }

  const recalcInputs = topBlocks.map((b) => {
    let effective = b.duration;
    if (b.type === "GROUP") {
      const ch = (childrenByParent.get(b.id) ?? []).filter((c) => c.column === 0);
      effective = sumChildDurations(ch);
    } else if (b.type === "BREAKOUT") {
      const ch = childrenByParent.get(b.id) ?? [];
      const cols = new Map<number, number>();
      for (const c of ch) {
        if (c.type === "NOTE") continue;
        cols.set(c.column, (cols.get(c.column) ?? 0) + c.duration);
      }
      effective = cols.size ? Math.max(...cols.values()) : 0;
    }
    return {
      id: b.id,
      position: b.position,
      duration: effective,
      locked: b.locked,
      startTime: b.startTime,
      type: b.type,
    };
  });

  const recalced = recalcBlocks(recalcInputs, day?.startTime ?? "09:00");

  const liveSteps: LiveBlockStep[] = topBlocks
    .filter((b) => b.type !== "NOTE")
    .sort((a, b) => a.position - b.position)
    .map((b) => {
      const r = recalced.find((x) => x.id === b.id);
      const children = (childrenByParent.get(b.id) ?? [])
        .filter((c) => c.type !== "NOTE")
        .sort((a, c) => a.position - c.position)
        .map((c) => ({
          id: c.id,
          title: c.title,
          duration: c.duration,
          column: c.column,
        }));
      return {
        id: b.id,
        title: b.title,
        type: b.type as "BLOCK" | "GROUP" | "BREAKOUT",
        duration: r?.duration ?? b.duration,
        description: b.description,
        notes: b.notes,
        category: b.category
          ? { id: b.category.id, name: b.category.name, color: b.category.color }
          : null,
        plannedStartTime: r?.computedStartTime ?? day?.startTime ?? "09:00",
        plannedEndTime: r?.computedEndTime ?? day?.startTime ?? "09:00",
        children,
      };
    });

  const currentStepIdx = liveSteps.findIndex((s) => s.id === ls.currentBlockId);
  const timings = (ls.blockTimings as unknown as StoredTiming[]) ?? [];
  const currentTiming = timings.find((t) => t.blockId === ls.currentBlockId);

  return {
    liveSessionId: ls.id,
    workshopId: ls.workshopId,
    workshopTitle: ls.workshop.title,
    status: ls.status,
    startedAt: ls.startedAt?.toISOString() ?? null,
    pausedAt: ls.pausedAt?.toISOString() ?? null,
    endedAt: ls.endedAt?.toISOString() ?? null,
    currentBlockId: ls.currentBlockId,
    currentStepIdx,
    steps: liveSteps,
    currentStepActualStartedAt: currentTiming?.actualStart ?? null,
    currentStepPausedSecondsAccrued: currentTiming?.pausedSecondsAccrued ?? 0,
  };
}

export async function getActiveLiveSessionForWorkshop(workshopId: string) {
  return prisma.liveSession.findFirst({
    where: {
      workshopId,
      status: { in: ["IDLE", "RUNNING", "PAUSED"] },
    },
    orderBy: { createdAt: "desc" },
  });
}
