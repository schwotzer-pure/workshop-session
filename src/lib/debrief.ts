import { prisma } from "@/lib/prisma";
import { recalcBlocks, sumChildDurations } from "@/lib/recalc";
import { hhmmToMinutes } from "@/lib/time";

type StoredTiming = {
  blockId: string;
  actualStart?: string;
  actualEnd?: string;
  pausedSecondsAccrued?: number;
};

export type BlockDebrief = {
  blockId: string;
  title: string;
  type: "BLOCK" | "GROUP" | "BREAKOUT" | "NOTE";
  methodId: string | null;
  methodTitle: string | null;
  plannedDurationMin: number;
  actualDurationMin: number;
  /** delta = actual - planned in minutes; positive = overran. */
  deltaMin: number;
  /** -1 if no actual recorded (block was skipped). */
  deltaPercent: number;
  category: { id: string; name: string; color: string } | null;
};

export type MethodInsight = {
  methodId: string;
  methodTitle: string;
  defaultDuration: number;
  /** Across all uses of this method in this debrief (rare to have multiple). */
  occurrences: number;
  totalPlannedMin: number;
  totalActualMin: number;
  averageRatio: number; // 1.2 = 20% over
  recommendedDuration: number;
};

export type DebriefAnalysis = {
  liveSessionId: string;
  workshopId: string;
  workshopTitle: string;
  startedAt: string | null;
  endedAt: string | null;
  totalPlannedMin: number;
  totalActualMin: number;
  totalDeltaMin: number;
  totalDeltaPercent: number;
  pausedAccruedMin: number;
  blocks: BlockDebrief[];
  methodInsights: MethodInsight[];
};

export async function analyzeLiveSession(
  liveSessionId: string
): Promise<DebriefAnalysis | null> {
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
                include: {
                  category: true,
                  method: { select: { id: true, title: true, defaultDuration: true } },
                },
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

  // Effective planned duration per top block (group/breakout aggregate)
  const plannedByBlock = new Map<string, number>();
  for (const b of topBlocks) {
    let eff = b.duration;
    if (b.type === "GROUP") {
      const ch = (childrenByParent.get(b.id) ?? []).filter(
        (c) => c.column === 0
      );
      eff = sumChildDurations(ch);
    } else if (b.type === "BREAKOUT") {
      const cols = new Map<number, number>();
      for (const c of childrenByParent.get(b.id) ?? []) {
        if (c.type === "NOTE") continue;
        cols.set(c.column, (cols.get(c.column) ?? 0) + c.duration);
      }
      eff = cols.size ? Math.max(...cols.values()) : 0;
    }
    plannedByBlock.set(b.id, eff);
  }

  const timings = (ls.blockTimings as unknown as StoredTiming[]) ?? [];

  // Each block can have multiple timing entries (when previous-block was used).
  // For debrief: take the LAST entry per blockId.
  const lastTimingPerBlock = new Map<string, StoredTiming>();
  for (const t of timings) {
    lastTimingPerBlock.set(t.blockId, t);
  }

  const blocks: BlockDebrief[] = topBlocks
    .filter((b) => b.type !== "NOTE")
    .map((b) => {
      const planned = plannedByBlock.get(b.id) ?? 0;
      const t = lastTimingPerBlock.get(b.id);
      let actualMin = 0;
      if (t?.actualStart && t?.actualEnd) {
        const startMs = new Date(t.actualStart).getTime();
        const endMs = new Date(t.actualEnd).getTime();
        const totalSec = Math.max(0, Math.round((endMs - startMs) / 1000));
        const pausedSec = t.pausedSecondsAccrued ?? 0;
        actualMin = Math.round((totalSec - pausedSec) / 60);
      }
      const deltaMin = actualMin - planned;
      const deltaPercent =
        planned > 0 ? Math.round((deltaMin / planned) * 100) : -1;
      return {
        blockId: b.id,
        title: b.title || "Unbenannt",
        type: b.type as BlockDebrief["type"],
        methodId: b.methodId,
        methodTitle: b.method?.title ?? null,
        plannedDurationMin: planned,
        actualDurationMin: actualMin,
        deltaMin,
        deltaPercent,
        category: b.category
          ? { id: b.category.id, name: b.category.name, color: b.category.color }
          : null,
      };
    });

  const totalPlannedMin = blocks.reduce(
    (s, b) => s + b.plannedDurationMin,
    0
  );
  const totalActualMin = blocks.reduce(
    (s, b) => s + b.actualDurationMin,
    0
  );
  const totalDeltaMin = totalActualMin - totalPlannedMin;
  const totalDeltaPercent =
    totalPlannedMin > 0
      ? Math.round((totalDeltaMin / totalPlannedMin) * 100)
      : 0;

  // Aggregate per method
  const methodInsightsMap = new Map<
    string,
    {
      title: string;
      defaultDuration: number;
      planned: number[];
      actual: number[];
    }
  >();
  for (const b of topBlocks) {
    if (b.method && b.methodId) {
      const t = lastTimingPerBlock.get(b.id);
      if (!t?.actualStart || !t?.actualEnd) continue;
      const planned = plannedByBlock.get(b.id) ?? 0;
      const startMs = new Date(t.actualStart).getTime();
      const endMs = new Date(t.actualEnd).getTime();
      const totalSec = Math.max(0, Math.round((endMs - startMs) / 1000));
      const actualMin = Math.round(
        (totalSec - (t.pausedSecondsAccrued ?? 0)) / 60
      );
      const existing = methodInsightsMap.get(b.methodId);
      if (existing) {
        existing.planned.push(planned);
        existing.actual.push(actualMin);
      } else {
        methodInsightsMap.set(b.methodId, {
          title: b.method.title,
          defaultDuration: b.method.defaultDuration,
          planned: [planned],
          actual: [actualMin],
        });
      }
    }
  }

  const methodInsights: MethodInsight[] = Array.from(
    methodInsightsMap.entries()
  ).map(([methodId, data]) => {
    const totalPlanned = data.planned.reduce((s, n) => s + n, 0);
    const totalActual = data.actual.reduce((s, n) => s + n, 0);
    const ratio =
      totalPlanned > 0 ? totalActual / totalPlanned : 1;
    return {
      methodId,
      methodTitle: data.title,
      defaultDuration: data.defaultDuration,
      occurrences: data.planned.length,
      totalPlannedMin: totalPlanned,
      totalActualMin: totalActual,
      averageRatio: Math.round(ratio * 100) / 100,
      recommendedDuration: Math.max(
        1,
        Math.round(
          (totalActual / data.actual.length) || data.defaultDuration
        )
      ),
    };
  });

  // Total paused time (across all blocks)
  const pausedAccruedSec = timings.reduce(
    (s, t) => s + (t.pausedSecondsAccrued ?? 0),
    0
  );

  return {
    liveSessionId: ls.id,
    workshopId: ls.workshopId,
    workshopTitle: ls.workshop.title,
    startedAt: ls.startedAt?.toISOString() ?? null,
    endedAt: ls.endedAt?.toISOString() ?? null,
    totalPlannedMin,
    totalActualMin,
    totalDeltaMin,
    totalDeltaPercent,
    pausedAccruedMin: Math.round(pausedAccruedSec / 60),
    blocks,
    methodInsights,
  };
}

export async function listEndedLiveSessionsForWorkshop(workshopId: string) {
  return prisma.liveSession.findMany({
    where: { workshopId, status: "ENDED" },
    orderBy: { endedAt: "desc" },
    select: { id: true, startedAt: true, endedAt: true },
  });
}
// Suppress unused import warning for the moment
void hhmmToMinutes;
