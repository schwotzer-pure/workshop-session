"use client";

import { useRef, useState, useTransition } from "react";
import { AlignLeft, CalendarDays, Clock3, ListChecks, Target } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { updateWorkshopAction, updateDayAction } from "@/actions/workshop";
import { formatDuration, isValidHhmm } from "@/lib/time";
import { StatusPicker, type WorkshopStatusValue } from "./status-picker";
import { WorkshopBoards } from "./workshop-boards";
import type {
  MasterBoardItem,
  WorkshopBoardItem,
} from "@/lib/queries";

export function WorkshopHeader({
  workshopId,
  title,
  goals,
  description,
  clientName,
  tags,
  status,
  startDate,
  startTime,
  endTime,
  totalDuration: totalMin,
  blockCount,
  dayId,
  boards,
  masterBoards,
}: {
  workshopId: string;
  title: string;
  goals: string | null;
  description: string | null;
  clientName: string | null;
  tags: string[];
  status: WorkshopStatusValue;
  startDate: Date | null;
  startTime: string;
  endTime: string;
  totalDuration: number;
  blockCount: number;
  dayId: string;
  boards: WorkshopBoardItem[];
  masterBoards: MasterBoardItem[];
}) {
  const [pending, startTransition] = useTransition();
  const [titleValue, setTitleValue] = useState(title);
  const [goalsValue, setGoalsValue] = useState(goals ?? "");
  const lastSavedGoals = useRef(goals ?? "");
  const [descriptionValue, setDescriptionValue] = useState(description ?? "");
  const lastSavedDescription = useRef(description ?? "");
  const [clientValue, setClientValue] = useState(clientName ?? "");
  const [dateValue, setDateValue] = useState(
    startDate ? new Date(startDate).toISOString().slice(0, 10) : ""
  );
  const [startTimeValue, setStartTimeValue] = useState(startTime);

  const persist = (fn: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error("Speichern fehlgeschlagen");
        console.error(e);
      }
    });
  };

  return (
    <div className="space-y-4 pb-2">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <StatusPicker workshopId={workshopId} value={status} />
        </div>
        <input
          type="text"
          value={titleValue}
          autoFocus={!title}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={() => {
            if (titleValue.trim() && titleValue !== title) {
              persist(() =>
                updateWorkshopAction({ id: workshopId, title: titleValue.trim() })
              );
            }
          }}
          placeholder="Session-Titel …"
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 focus:outline-none sm:text-3xl lg:text-4xl"
        />
        <input
          type="text"
          value={clientValue}
          onChange={(e) => setClientValue(e.target.value)}
          onBlur={() => {
            if (clientValue !== (clientName ?? "")) {
              persist(() =>
                updateWorkshopAction({
                  id: workshopId,
                  clientName: clientValue.trim() || null,
                })
              );
            }
          }}
          placeholder="Kunde / Auftraggeber (optional)"
          className="w-full bg-transparent text-base text-muted-foreground outline-none placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      <div className="glass-card space-y-3 rounded-2xl p-4">
        <div className="flex items-start gap-2.5">
          <Target className="mt-1 size-4 shrink-0 text-[var(--neon-violet)]" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
              Zielsetzung
            </div>
            <RichTextEditor
              value={goalsValue}
              onChange={setGoalsValue}
              onBlur={() => {
                const trimmed = goalsValue.trim();
                if (trimmed !== lastSavedGoals.current.trim()) {
                  lastSavedGoals.current = goalsValue;
                  persist(() =>
                    updateWorkshopAction({
                      id: workshopId,
                      goals: trimmed || null,
                    })
                  );
                }
              }}
              placeholder="Was soll am Ende des Workshops erreicht sein?"
              compact
            />
          </div>
        </div>
        <div className="border-t border-border/40" />
        <div className="flex items-start gap-2.5">
          <AlignLeft className="mt-1 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
              Beschreibung
            </div>
            <RichTextEditor
              value={descriptionValue}
              onChange={setDescriptionValue}
              onBlur={() => {
                const trimmed = descriptionValue.trim();
                if (trimmed !== lastSavedDescription.current.trim()) {
                  lastSavedDescription.current = descriptionValue;
                  persist(() =>
                    updateWorkshopAction({
                      id: workshopId,
                      description: trimmed || null,
                    })
                  );
                }
              }}
              placeholder="Hintergrund, Auftrag, wichtige Rahmenbedingungen, Bullets …"
            />
          </div>
        </div>
      </div>

      <div className="glass-card flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-3 sm:gap-x-8 sm:p-4">
        <label className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            onBlur={() => {
              persist(() =>
                updateWorkshopAction({
                  id: workshopId,
                  startDate: dateValue || null,
                })
              );
            }}
            className="h-8 w-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <Clock3 className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Start:</span>
          <input
            type="time"
            value={startTimeValue}
            onChange={(e) => setStartTimeValue(e.target.value)}
            onBlur={() => {
              if (isValidHhmm(startTimeValue) && startTimeValue !== startTime) {
                persist(() =>
                  updateDayAction({ dayId, startTime: startTimeValue })
                );
              }
            }}
            className="h-8 bg-transparent text-sm font-medium tabular-nums outline-none focus:outline-none"
          />
          <span className="text-muted-foreground">→ Ende:</span>
          <span className="font-medium tabular-nums">{endTime}</span>
        </label>

        {totalMin > 0 ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatDuration(totalMin)}
          </span>
        ) : null}

        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <ListChecks className="size-4" />
          {blockCount} Blöcke
        </span>

        {pending ? (
          <span className="ml-auto text-xs text-muted-foreground">Speichere …</span>
        ) : null}
      </div>

      <WorkshopBoards
        workshopId={workshopId}
        boards={boards}
        masterBoards={masterBoards}
      />

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
