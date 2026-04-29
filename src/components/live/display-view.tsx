"use client";

import { useEffect, useState } from "react";
import { Pause, Layers, Columns3 } from "lucide-react";
import {
  useLiveSession,
  elapsedSecondsSince,
  formatTimer,
} from "@/lib/use-live-session";
import { cn } from "@/lib/utils";
import type { LiveStateView } from "@/lib/live";

export function DisplayView({
  liveSessionId,
  initial,
}: {
  liveSessionId: string;
  initial: LiveStateView;
}) {
  const { state } = useLiveSession(liveSessionId, initial, 1000);
  const live = state ?? initial;
  const [, setTick] = useState(0);

  useEffect(() => {
    const h = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(h);
  }, []);

  const currentStep =
    live.steps.find((s) => s.id === live.currentBlockId) ?? null;
  const nextStep =
    live.currentStepIdx + 1 < live.steps.length
      ? live.steps[live.currentStepIdx + 1]
      : null;

  const elapsedSec = elapsedSecondsSince(
    live.currentStepActualStartedAt,
    live.currentStepPausedSecondsAccrued,
    live.pausedAt,
    live.status
  );
  const plannedSec = (currentStep?.duration ?? 0) * 60;
  const remainingSec = plannedSec - elapsedSec;
  const overTime = remainingSec < 0;

  if (live.status === "ENDED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[oklch(0.14_0.02_280)] text-white">
        <div className="text-center">
          <p className="neon-text text-7xl font-semibold tracking-tight">
            Danke!
          </p>
          <p className="mt-6 text-2xl text-white/60">
            Workshop beendet.
          </p>
        </div>
      </main>
    );
  }

  if (!currentStep) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[oklch(0.14_0.02_280)] text-white">
        <p className="text-2xl text-white/60">Kein aktiver Block.</p>
      </main>
    );
  }

  const Icon =
    currentStep.type === "GROUP"
      ? Layers
      : currentStep.type === "BREAKOUT"
      ? Columns3
      : null;

  return (
    <main
      className={cn(
        "relative flex min-h-screen flex-col overflow-hidden bg-[oklch(0.14_0.02_280)] text-white"
      )}
    >
      {/* Aurora background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(60rem 40rem at 0% 0%, oklch(0.82 0.16 200 / 0.25), transparent 60%),
            radial-gradient(50rem 35rem at 100% 0%, oklch(0.72 0.24 350 / 0.22), transparent 60%),
            radial-gradient(45rem 32rem at 50% 100%, oklch(0.65 0.26 295 / 0.20), transparent 60%)
          `,
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-12 py-8">
        <div className="text-base text-white/60">{live.workshopTitle}</div>
        <div className="flex items-center gap-3 text-sm tabular-nums text-white/60">
          <span>
            Block {live.currentStepIdx + 1} / {live.steps.length}
          </span>
          {live.status === "PAUSED" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--neon-pink)]/20 px-3 py-1 text-[var(--neon-pink)]">
              <Pause className="size-3.5" />
              Pause
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 animate-pulse rounded-full bg-[var(--neon-cyan)] shadow-[0_0_8px_oklch(0.82_0.16_200/0.6)]" />
              Live
            </span>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-12 text-center">
        {currentStep.category ? (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm uppercase tracking-wider text-white/70">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: currentStep.category.color }}
            />
            {currentStep.category.name}
          </div>
        ) : null}

        <h1 className="flex items-start gap-4 text-7xl font-semibold leading-tight tracking-tight md:text-8xl">
          {Icon ? <Icon className="mt-3 size-16 text-[var(--neon-violet)]" /> : null}
          {currentStep.title || "Unbenannter Block"}
        </h1>

        <div
          className={cn(
            "mt-12 font-mono text-[10rem] font-bold leading-none tabular-nums tracking-tight md:text-[14rem]",
            overTime ? "text-[var(--neon-pink)]" : "text-white",
            live.status === "PAUSED" && "opacity-50"
          )}
        >
          {formatTimer(remainingSec)}
        </div>

        <div className="mt-4 text-xl text-white/40">
          {overTime
            ? "Über Soll"
            : "Verbleibend"}
          {" · Soll: "}
          <span className="tabular-nums">{currentStep.duration} min</span>
        </div>

        {currentStep.description ? (
          <p className="mx-auto mt-12 max-w-3xl whitespace-pre-wrap text-2xl leading-relaxed text-white/80">
            {currentStep.description}
          </p>
        ) : null}
      </div>

      {/* Footer: next-up */}
      {nextStep ? (
        <footer className="relative z-10 px-12 pb-10">
          <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md">
            <div className="text-xs uppercase tracking-wider text-white/40">
              Als Nächstes
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-medium">
                {nextStep.title || "Unbenannter Block"}
              </span>
              <span className="text-sm tabular-nums text-white/40">
                {nextStep.duration} min · {nextStep.plannedStartTime}
              </span>
            </div>
          </div>
        </footer>
      ) : null}
    </main>
  );
}
