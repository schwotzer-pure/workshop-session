"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Notebook,
  Pause,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useLiveSession,
  elapsedSecondsSince,
  formatTimer,
} from "@/lib/use-live-session";
import {
  deleteCoachNoteAction,
  resolveCoachNoteAction,
} from "@/actions/coach";
import { isRedirectError } from "@/lib/is-redirect";
import { cn } from "@/lib/utils";
import type { LiveStateView } from "@/lib/live";
import { CoachNoteComposer } from "./coach-notes";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeTime(iso: string) {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 30) return "gerade eben";
  if (sec < 60) return `vor ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `vor ${min} min`;
  const h = Math.floor(min / 60);
  return `vor ${h}h`;
}

export function CoachView({
  workshopId,
  liveSessionId,
  initial,
  currentUserId,
  isAdmin,
}: {
  workshopId: string;
  liveSessionId: string;
  initial: LiveStateView;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const { state } = useLiveSession(liveSessionId, initial, 1500);
  const live = state ?? initial;
  const [, setTick] = useState(0);

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
  const plannedSec = (currentStep?.duration ?? 0) * 60;
  const remainingSec = plannedSec - elapsedSec;
  const overTime = remainingSec < 0;

  const handleResolve = (id: string) => {
    resolveCoachNoteAction(id).catch((e) => {
      if (isRedirectError(e)) throw e;
      toast.error("Konnte Hinweis nicht abschließen");
      console.error(e);
    });
  };

  const handleDelete = (id: string) => {
    deleteCoachNoteAction(id).catch((e) => {
      if (isRedirectError(e)) throw e;
      toast.error("Konnte Hinweis nicht löschen");
      console.error(e);
    });
  };

  return (
    <div className="aurora-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/sessions/${workshopId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </Link>
          <span className="hidden h-4 w-px bg-border sm:inline-block" />
          <span className="truncate text-sm font-medium">
            {live.workshopTitle}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--neon-violet)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--neon-violet)]">
            <Notebook className="size-2.5" />
            Co-Trainer
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-3 py-4 sm:px-6 sm:py-8">
        {/* Aktueller Block (kompakt, nur Info) */}
        {currentStep ? (
          <section className="glass-card rounded-2xl p-4">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Aktueller Block · Schritt {live.currentStepIdx + 1} /{" "}
              {live.steps.length}
            </div>
            <h2 className="mt-1 text-lg font-semibold leading-snug">
              {currentStep.title || "Unbenannt"}
            </h2>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 tabular-nums",
                  overTime
                    ? "bg-[var(--neon-pink)]/15 text-[var(--neon-pink)]"
                    : "bg-background/60 text-muted-foreground"
                )}
              >
                <Clock className="size-3" />
                {formatTimer(remainingSec)} {overTime ? "über" : "übrig"}
              </span>
              {live.status === "PAUSED" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--neon-pink)]/15 px-1.5 py-0.5 text-[var(--neon-pink)]">
                  <Pause className="size-3" />
                  Pause
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Composer */}
        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Hinweis senden
          </h2>
          <CoachNoteComposer liveSessionId={liveSessionId} />
        </section>

        {/* Note History */}
        {live.coachNotes.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Verlauf · {live.coachNotes.length}
            </h2>
            <ul className="space-y-1.5">
              {live.coachNotes.map((n) => {
                const isResolved = Boolean(n.resolvedAt);
                const canDelete =
                  n.author.id === currentUserId || isAdmin;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "group rounded-xl border bg-background/40 p-3 text-sm",
                      isResolved
                        ? "border-border/40 text-muted-foreground"
                        : "border-[var(--neon-pink)]/30"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="size-6 shrink-0 border border-border/70 bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]">
                        <AvatarFallback className="bg-transparent text-[10px] font-semibold text-white">
                          {initials(n.author.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="font-medium">{n.author.name}</span>
                          <span>·</span>
                          <span>{relativeTime(n.createdAt)}</span>
                          {isResolved ? (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5 text-[var(--neon-cyan)]">
                                <Check className="size-2.5" />
                                erledigt
                              </span>
                            </>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 whitespace-pre-wrap leading-snug",
                            isResolved && "line-through opacity-70"
                          )}
                        >
                          {n.content}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        {!isResolved ? (
                          <button
                            type="button"
                            onClick={() => handleResolve(n.id)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-[var(--neon-cyan)]/15 hover:text-[var(--neon-cyan)]"
                            title="Erledigt markieren"
                          >
                            <Check className="size-3" />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(n.id)}
                            className="rounded-md p-1 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                            title="Löschen"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
