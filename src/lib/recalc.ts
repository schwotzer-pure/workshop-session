import { hhmmToMinutes, minutesToHhmm } from "./time";

export type RecalcInput = {
  id: string;
  position: number;
  duration: number;
  locked: boolean;
  startTime: string | null;
  type?: "BLOCK" | "GROUP" | "BREAKOUT" | "NOTE";
};

export type RecalcOutput = RecalcInput & {
  computedStartTime: string;
  computedEndTime: string;
};

/**
 * Compute the "wall clock" startTime for every TOP-LEVEL block.
 *
 * Rules:
 * - Sorted by position ascending.
 * - Locked block: uses its own startTime, jumps the clock there.
 * - Unlocked block: starts when previous ended.
 * - NOTE blocks contribute 0 minutes (annotations).
 *
 * GROUP / BREAKOUT durations must be precomputed by the caller (see
 * computeContainerDuration helpers below).
 */
export function recalcBlocks(
  blocks: RecalcInput[],
  dayStartTime: string,
): RecalcOutput[] {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);

  let cursor = hhmmToMinutes(dayStartTime);
  const result: RecalcOutput[] = [];

  for (const b of sorted) {
    let startMin: number;
    if (b.locked && b.startTime) {
      startMin = hhmmToMinutes(b.startTime);
    } else {
      startMin = cursor;
    }
    const effectiveDuration = b.type === "NOTE" ? 0 : b.duration;
    const endMin = startMin + effectiveDuration;
    result.push({
      ...b,
      computedStartTime: minutesToHhmm(startMin),
      computedEndTime: minutesToHhmm(endMin),
    });
    if (b.type !== "NOTE") cursor = endMin;
  }

  return result;
}

/**
 * Sum of durations of children, sequentially. Used for GROUP.
 */
export function sumChildDurations(children: { duration: number; type?: string }[]): number {
  return children
    .filter((c) => c.type !== "NOTE")
    .reduce((sum, c) => sum + c.duration, 0);
}

/**
 * Max duration across columns. Used for BREAKOUT.
 * `children` are flattened blocks with a `column` index.
 */
export function maxColumnDuration(
  children: { duration: number; column: number; type?: string }[]
): number {
  const byCol = new Map<number, number>();
  for (const c of children) {
    if (c.type === "NOTE") continue;
    byCol.set(c.column, (byCol.get(c.column) ?? 0) + c.duration);
  }
  let max = 0;
  for (const v of byCol.values()) if (v > max) max = v;
  return max;
}

export function totalDuration(blocks: { duration: number; type?: string }[]): number {
  return blocks
    .filter((b) => b.type !== "NOTE")
    .reduce((sum, b) => sum + b.duration, 0);
}

export function dayEndTime(blocks: RecalcInput[], dayStartTime: string): string {
  const recalced = recalcBlocks(blocks, dayStartTime);
  if (!recalced.length) return dayStartTime;
  return recalced[recalced.length - 1].computedEndTime;
}
