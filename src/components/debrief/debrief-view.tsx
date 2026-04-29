"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Clock3,
  ListChecks,
  Pause,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { applyMethodCalibrationAction } from "@/actions/debrief";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { DebriefAnalysis, MethodInsight } from "@/lib/debrief";

export function DebriefView({
  workshopId,
  analysis,
  sessions,
  currentSessionId,
}: {
  workshopId: string;
  analysis: DebriefAnalysis;
  sessions: Array<{ id: string; startedAt: Date | null; endedAt: Date | null }>;
  currentSessionId: string;
}) {
  const [, startTransition] = useTransition();
  const overran = analysis.totalDeltaMin > 0;

  const handleApply = (m: MethodInsight) => {
    startTransition(async () => {
      try {
        await applyMethodCalibrationAction({
          methodId: m.methodId,
          newDefaultDuration: m.recommendedDuration,
        });
        toast.success(
          `${m.methodTitle}: Standard auf ${m.recommendedDuration} min gesetzt`
        );
      } catch (e) {
        toast.error("Konnte Methode nicht anpassen");
        console.error(e);
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Workshop-Auswertung
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {analysis.workshopTitle}
        </h1>
        {analysis.endedAt ? (
          <p className="text-sm text-muted-foreground">
            Beendet am{" "}
            {new Date(analysis.endedAt).toLocaleString("de-CH", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : null}
      </div>

      {/* Session-Switcher (wenn mehrere Live-Runs) */}
      {sessions.length > 1 ? (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Session:
          </span>
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${workshopId}/debrief?live=${s.id}`}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs",
                s.id === currentSessionId
                  ? "border-[var(--neon-violet)]/40 bg-[var(--neon-violet)]/[0.08] font-medium text-foreground"
                  : "border-border/60 bg-background/40 text-muted-foreground hover:border-[var(--neon-violet)]/30"
              )}
            >
              {s.endedAt
                ? new Date(s.endedAt).toLocaleDateString("de-CH")
                : "—"}
            </Link>
          ))}
        </div>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          icon={Clock3}
          label="Geplant"
          value={formatDuration(analysis.totalPlannedMin)}
        />
        <Stat
          icon={Clock3}
          label="Tatsächlich"
          value={formatDuration(analysis.totalActualMin)}
        />
        <Stat
          icon={overran ? TrendingUp : TrendingDown}
          label={overran ? "Überzogen" : "Gespart"}
          value={`${overran ? "+" : ""}${formatDuration(Math.abs(analysis.totalDeltaMin))}`}
          tone={
            Math.abs(analysis.totalDeltaPercent) > 15
              ? "danger"
              : Math.abs(analysis.totalDeltaPercent) > 5
              ? "warning"
              : "default"
          }
          sub={`${analysis.totalDeltaPercent > 0 ? "+" : ""}${analysis.totalDeltaPercent}%`}
        />
        <Stat
          icon={Pause}
          label="Pausen"
          value={
            analysis.pausedAccruedMin > 0
              ? formatDuration(analysis.pausedAccruedMin)
              : "—"
          }
        />
      </div>

      {/* Method-Insights / Calibration */}
      {analysis.methodInsights.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Methoden-Kalibrierung</h2>
            <p className="text-sm text-muted-foreground">
              Diese Methoden wichen vom Plan ab. Übernimm den realistischen
              Wert in die Bibliothek, dann startet jede künftige Session mit
              einem realistischeren Plan.
            </p>
          </div>
          <div className="space-y-2">
            {analysis.methodInsights.map((m) => {
              const ratio = m.averageRatio;
              const tooLong = ratio > 1.1;
              const tooShort = ratio < 0.9;
              const stable = !tooLong && !tooShort;
              return (
                <article
                  key={m.methodId}
                  className="glass-card flex flex-wrap items-center gap-4 rounded-2xl p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-[var(--neon-violet)]" />
                      <h3 className="text-sm font-semibold">{m.methodTitle}</h3>
                      {stable ? (
                        <span className="rounded-full bg-[var(--neon-cyan)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--neon-cyan)]">
                          ±{Math.round(Math.abs((ratio - 1) * 100))}% – stabil
                        </span>
                      ) : tooLong ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neon-pink)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--neon-pink)]">
                          <ArrowUpRight className="size-2.5" />
                          {Math.round((ratio - 1) * 100)}% länger
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <ArrowDownRight className="size-2.5" />
                          {Math.round((1 - ratio) * 100)}% kürzer
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Bibliothek-Default:{" "}
                      <span className="tabular-nums">
                        {m.defaultDuration} min
                      </span>{" "}
                      · Tatsächlich:{" "}
                      <span className="font-medium tabular-nums">
                        {m.totalActualMin} min
                      </span>{" "}
                      · Empfehlung:{" "}
                      <span className="font-medium tabular-nums">
                        {m.recommendedDuration} min
                      </span>
                    </p>
                  </div>
                  {m.recommendedDuration !== m.defaultDuration ? (
                    <button
                      type="button"
                      onClick={() => handleApply(m)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-95"
                    >
                      <Check className="size-3" />
                      In Bibliothek übernehmen
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Block-by-Block */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Block für Block</h2>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Block</th>
                <th className="px-4 py-2 text-right tabular-nums">Geplant</th>
                <th className="px-4 py-2 text-right tabular-nums">
                  Tatsächlich
                </th>
                <th className="px-4 py-2 text-right tabular-nums">Delta</th>
              </tr>
            </thead>
            <tbody>
              {analysis.blocks.map((b) => {
                const skipped = b.actualDurationMin === 0;
                const tooLong = b.deltaMin > 0 && b.deltaPercent > 10;
                const tooShort =
                  b.deltaMin < 0 && Math.abs(b.deltaPercent) > 10;
                return (
                  <tr
                    key={b.blockId}
                    className="border-t border-border/40 hover:bg-accent/20"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {b.category ? (
                          <span
                            className="size-2 rounded-sm shrink-0"
                            style={{ background: b.category.color }}
                          />
                        ) : null}
                        <span className="font-medium">{b.title}</span>
                        {b.methodTitle ? (
                          <span className="text-[10px] text-muted-foreground">
                            ({b.methodTitle})
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {b.plannedDurationMin} min
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {skipped ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        `${b.actualDurationMin} min`
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right tabular-nums",
                        skipped && "text-muted-foreground",
                        tooLong && "text-[var(--neon-pink)]",
                        tooShort && "text-[var(--neon-cyan)]"
                      )}
                    >
                      {skipped
                        ? "übersprungen"
                        : `${b.deltaMin > 0 ? "+" : ""}${b.deltaMin} min`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end pt-2 text-xs text-muted-foreground">
        <Link
          href={`/sessions/${workshopId}`}
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <ListChecks className="size-3" />
          Zurück zum Editor
        </Link>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <div className="glass-card space-y-1 rounded-2xl p-4">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "warning" && "text-[var(--neon-violet)]",
          tone === "danger" && "text-[var(--neon-pink)]"
        )}
      >
        {value}
      </div>
      {sub ? (
        <div className="text-xs tabular-nums text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}
