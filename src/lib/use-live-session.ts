"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveStateView } from "@/lib/live";

/**
 * Polls /api/live/[id]/state every `intervalMs` and exposes the latest snapshot.
 * Cancels in-flight fetches on unmount or when the polled id changes.
 */
export function useLiveSession(
  liveSessionId: string,
  initial?: LiveStateView,
  intervalMs = 1000
) {
  const [state, setState] = useState<LiveStateView | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/live/${liveSessionId}/state`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          return;
        }
        const data = (await res.json()) as LiveStateView;
        if (cancelled) return;
        setState(data);
        setError(null);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (cancelled) return;
        setError(String(e));
      }
    };
    tick();
    const handle = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(handle);
      abortRef.current?.abort();
    };
  }, [liveSessionId, intervalMs]);

  return { state, error };
}

/**
 * Returns elapsed seconds since `startedAt` minus `pausedSeconds`,
 * adjusted for whether the timer is paused right now.
 *
 * Tick this with a 1s interval inside the consuming component to refresh.
 */
export function elapsedSecondsSince(
  actualStart: string | null,
  pausedSecondsAccrued: number,
  pausedAt: string | null,
  status: "IDLE" | "RUNNING" | "PAUSED" | "ENDED"
): number {
  if (!actualStart) return 0;
  const start = new Date(actualStart).getTime();
  const now = Date.now();
  let elapsed = Math.floor((now - start) / 1000) - pausedSecondsAccrued;
  if (status === "PAUSED" && pausedAt) {
    const pausedFor = Math.floor((now - new Date(pausedAt).getTime()) / 1000);
    elapsed -= pausedFor;
  }
  return Math.max(0, elapsed);
}

export function formatTimer(seconds: number): string {
  const sign = seconds < 0 ? "-" : "";
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  if (h > 0) {
    return `${sign}${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${sign}${m}:${s.toString().padStart(2, "0")}`;
}
