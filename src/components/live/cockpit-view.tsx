"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Square,
  ExternalLink,
  Notebook,
  Lock,
  Layers,
  Columns3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useLiveSession,
  elapsedSecondsSince,
  formatTimer,
} from "@/lib/use-live-session";
import {
  nextBlockAction,
  previousBlockAction,
  pauseLiveSessionAction,
  resumeLiveSessionAction,
  endLiveSessionAction,
  jumpToBlockAction,
} from "@/actions/live";
import type { LiveStateView, LiveBlockStep } from "@/lib/live";

export function CockpitView({
  workshopId,
  liveSessionId,
  initial,
}: {
  workshopId: string;
  liveSessionId: string;
  initial: LiveStateView;
}) {
  const { state } = useLiveSession(liveSessionId, initial, 1000);
  const live = state ?? initial;
  const [, startTransition] = useTransition();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const h = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(h);
  }, []);

  const currentStep =
    live.steps.find((s) => s.id === live.currentBlockId) ?? null;

  const elapsedSec = elapsedSecondsSince(
    live.currentStepActualStartedAt,
    live.currentStepPausedSecondsAccrued,
    live.pausedAt,
    live.status
  );
  void tick; // ensure timer ticks

  const plannedSec = (currentStep?.duration ?? 0) * 60;
  const remainingSec = plannedSec - elapsedSec;
  const overTime = remainingSec < 0;

  const isRunning = live.status === "RUNNING";
  const isPaused = live.status === "PAUSED";
  const isEnded = live.status === "ENDED";
  const isFirst = live.currentStepIdx <= 0;
  const isLast = live.currentStepIdx >= live.steps.length - 1;

  const action = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error("Aktion fehlgeschlagen");
        console.error(e);
      }
    });

  const handlePauseToggle = () => {
    if (isPaused) {
      action(() => resumeLiveSessionAction({ liveSessionId }));
    } else if (isRunning) {
      action(() => pauseLiveSessionAction({ liveSessionId }));
    }
  };

  const handleEnd = () => {
    if (!confirm("Live-Session wirklich beenden?")) return;
    action(() => endLiveSessionAction({ liveSessionId }));
  };

  return (
    <div className="aurora-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/sessions/${workshopId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Editor
          </Link>
          <span className="h-4 w-px bg-border" />
          <span className="text-sm font-medium">{live.workshopTitle}</span>
          <StatusBadge status={live.status} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/sessions/${workshopId}/live/display`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium hover:border-[var(--neon-violet)]/40 hover:bg-background/80"
          >
            <ExternalLink className="size-3.5" />
            Beamer-Ansicht öffnen
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-8 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          {currentStep && !isEnded ? (
            <CurrentStepCard
              step={currentStep}
              elapsedSec={elapsedSec}
              remainingSec={remainingSec}
              overTime={overTime}
              isPaused={isPaused}
              stepIdx={live.currentStepIdx}
              totalSteps={live.steps.length}
            />
          ) : isEnded ? (
            <EndedCard liveSessionId={liveSessionId} workshopId={workshopId} />
          ) : null}

          {!isEnded ? (
            <Controls
              isRunning={isRunning}
              isPaused={isPaused}
              isFirst={isFirst}
              isLast={isLast}
              onPrevious={() =>
                action(() => previousBlockAction({ liveSessionId }))
              }
              onNext={() =>
                action(() => nextBlockAction({ liveSessionId }))
              }
              onPauseToggle={handlePauseToggle}
              onEnd={handleEnd}
            />
          ) : null}
        </div>

        <aside className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Verlauf · {live.steps.length} Schritte
          </h3>
          <div className="space-y-1">
            {live.steps.map((s, idx) => (
              <StepRow
                key={s.id}
                step={s}
                idx={idx}
                isCurrent={s.id === live.currentBlockId}
                isPast={idx < live.currentStepIdx}
                onJump={() =>
                  action(() =>
                    jumpToBlockAction({ liveSessionId, blockId: s.id })
                  )
                }
                disabled={isEnded}
              />
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: LiveStateView["status"] }) {
  if (status === "RUNNING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--neon-cyan)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--neon-cyan)]">
        <span className="size-1.5 animate-pulse rounded-full bg-[var(--neon-cyan)]" />
        Live
      </span>
    );
  }
  if (status === "PAUSED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--neon-pink)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--neon-pink)]">
        <Pause className="size-3" />
        Pausiert
      </span>
    );
  }
  if (status === "ENDED") {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Beendet
      </span>
    );
  }
  return null;
}

function CurrentStepCard({
  step,
  elapsedSec,
  remainingSec,
  overTime,
  isPaused,
  stepIdx,
  totalSteps,
}: {
  step: LiveBlockStep;
  elapsedSec: number;
  remainingSec: number;
  overTime: boolean;
  isPaused: boolean;
  stepIdx: number;
  totalSteps: number;
}) {
  const Icon =
    step.type === "GROUP"
      ? Layers
      : step.type === "BREAKOUT"
      ? Columns3
      : null;
  return (
    <div className="glass-card relative overflow-hidden rounded-3xl p-8">
      <div
        className={cn(
          "pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-gradient-to-br opacity-30 blur-3xl",
          overTime
            ? "from-[var(--neon-pink)]/40 to-transparent"
            : "from-[var(--neon-violet)]/30 to-transparent"
        )}
      />
      <div className="relative space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>
                Schritt {stepIdx + 1} / {totalSteps}
              </span>
              {step.category ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-sm"
                    style={{ background: step.category.color }}
                  />
                  {step.category.name}
                </span>
              ) : null}
            </div>
            <h2 className="flex items-start gap-2 text-3xl font-semibold tracking-tight">
              {Icon ? <Icon className="mt-1 size-6 text-[var(--neon-violet)]" /> : null}
              <span>{step.title || "Unbenannter Block"}</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border/60 bg-background/40 p-4">
          <Stat label="Soll" value={`${step.duration} min`} />
          <Stat label="Ist" value={formatTimer(elapsedSec)} highlight={isPaused} />
          <Stat
            label={overTime ? "Über Soll" : "Verbleibend"}
            value={formatTimer(remainingSec)}
            tone={overTime ? "danger" : "default"}
          />
        </div>

        {step.description ? (
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Beschreibung
            </div>
            <p className="whitespace-pre-wrap text-sm">{step.description}</p>
          </div>
        ) : null}

        {step.notes ? (
          <div className="rounded-xl border border-dashed border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.04] p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--neon-violet)]">
              <Notebook className="size-3" />
              Trainer-Notiz
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">
              {step.notes}
            </p>
          </div>
        ) : null}

        {step.children.length > 0 ? (
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {step.type === "BREAKOUT" ? "Tracks" : "Sub-Blöcke"}
            </div>
            {step.type === "BREAKOUT" ? (
              <BreakoutChildren children={step.children} />
            ) : (
              <ul className="space-y-1 text-sm">
                {step.children.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-accent/40"
                  >
                    <span>{c.title || "Unbenannt"}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {c.duration} min
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BreakoutChildren({
  children,
}: {
  children: LiveBlockStep["children"];
}) {
  const cols = new Map<number, LiveBlockStep["children"]>();
  for (const c of children) {
    const arr = cols.get(c.column) ?? [];
    arr.push(c);
    cols.set(c.column, arr);
  }
  const sorted = Array.from(cols.keys()).sort((a, b) => a - b);
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${sorted.length}, minmax(0, 1fr))` }}
    >
      {sorted.map((ci) => (
        <div
          key={ci}
          className="space-y-1 rounded-md border border-border/40 bg-background/40 p-2"
        >
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Track {ci + 1}
          </div>
          {(cols.get(ci) ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{c.title || "Unbenannt"}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {c.duration}m
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  tone = "default",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "danger" && "text-[var(--neon-pink)]",
          highlight && "animate-pulse"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Controls({
  isRunning,
  isPaused,
  isFirst,
  isLast,
  onPrevious,
  onNext,
  onPauseToggle,
  onEnd,
}: {
  isRunning: boolean;
  isPaused: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPauseToggle: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onPrevious}
        disabled={isFirst}
      >
        <ChevronLeft className="size-4" />
        Vorher
      </Button>
      <Button
        type="button"
        size="lg"
        onClick={onPauseToggle}
        className={cn(
          "min-w-32",
          isPaused
            ? "bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-white"
            : "bg-[var(--neon-pink)]/15 text-[var(--neon-pink)] hover:bg-[var(--neon-pink)]/25"
        )}
      >
        {isPaused ? (
          <>
            <Play className="size-4" />
            Fortsetzen
          </>
        ) : (
          <>
            <Pause className="size-4" />
            Pausieren
          </>
        )}
      </Button>
      <Button
        type="button"
        size="lg"
        onClick={onNext}
        disabled={isLast}
        className="bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
      >
        Nächster
        <ChevronRight className="size-4" />
      </Button>
      <span className="ml-auto" />
      <Button
        type="button"
        variant="ghost"
        size="lg"
        onClick={onEnd}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Square className="size-4" />
        Beenden
      </Button>
    </div>
  );
}

function StepRow({
  step,
  idx,
  isCurrent,
  isPast,
  onJump,
  disabled,
}: {
  step: LiveBlockStep;
  idx: number;
  isCurrent: boolean;
  isPast: boolean;
  onJump: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onJump}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-all",
        isCurrent
          ? "border-[var(--neon-violet)]/40 bg-[var(--neon-violet)]/[0.08] shadow-[0_4px_20px_-8px_oklch(0.65_0.26_295/_0.4)]"
          : isPast
          ? "border-border/40 bg-background/30 text-muted-foreground"
          : "border-border/60 bg-background/40 hover:border-[var(--neon-violet)]/30 hover:bg-background/60",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
          isCurrent
            ? "bg-[var(--neon-violet)] text-white"
            : isPast
            ? "bg-muted text-muted-foreground"
            : "bg-background text-muted-foreground"
        )}
      >
        {idx + 1}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">
        {step.title || "Unbenannt"}
      </span>
      {step.category ? (
        <span
          className="size-2 rounded-sm"
          style={{ background: step.category.color }}
        />
      ) : null}
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {step.duration}m
      </span>
    </button>
  );
}

function EndedCard({
  liveSessionId: _liveSessionId,
  workshopId,
}: {
  liveSessionId: string;
  workshopId: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-12 text-center">
      <Lock className="mx-auto size-8 text-muted-foreground" />
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">
        Workshop beendet
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Diese Live-Session ist abgeschlossen.
      </p>
      <Link
        href={`/sessions/${workshopId}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
      >
        Zurück zum Editor
      </Link>
    </div>
  );
}
