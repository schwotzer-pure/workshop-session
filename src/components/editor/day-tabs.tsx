"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addDayAction, removeDayAction } from "@/actions/workshop";
import { cn } from "@/lib/utils";

export type DayTab = {
  id: string;
  position: number;
  title: string | null;
  startTime: string;
  blockCount: number;
};

export function DayTabs({
  workshopId,
  days,
  activeDayId,
  onChange,
}: {
  workshopId: string;
  days: DayTab[];
  activeDayId: string;
  onChange: (dayId: string) => void;
}) {
  const [, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      try {
        const day = await addDayAction(workshopId);
        onChange(day.id);
        toast.success(`${day.title ?? `Tag ${day.position + 1}`} angelegt`);
      } catch (e) {
        toast.error("Konnte Tag nicht hinzufügen");
        console.error(e);
      }
    });
  };

  const handleRemove = (dayId: string, label: string) => {
    if (days.length <= 1) {
      toast.error("Der letzte Tag kann nicht gelöscht werden");
      return;
    }
    if (!confirm(`${label} mit allen Blöcken löschen?`)) return;
    startTransition(async () => {
      try {
        await removeDayAction(dayId);
        if (dayId === activeDayId) {
          const remaining = days.filter((d) => d.id !== dayId);
          if (remaining.length > 0) onChange(remaining[0].id);
        }
        toast.success("Tag gelöscht");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Konnte Tag nicht löschen"
        );
        console.error(e);
      }
    });
  };

  if (days.length <= 1) {
    // Single-day workshops: keep UI minimal — just an "Add day" hint button.
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
        >
          <Plus className="size-3" />
          Weiteren Tag hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 border-b border-border/60">
      <div className="flex flex-1 items-center gap-0.5 overflow-x-auto">
        {days.map((d) => {
          const label = d.title || `Tag ${d.position + 1}`;
          const active = d.id === activeDayId;
          return (
            <div
              key={d.id}
              className={cn(
                "group relative flex items-center gap-1 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-b-2 border-[var(--neon-violet)] bg-[var(--neon-violet)]/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}
            >
              <button
                type="button"
                onClick={() => onChange(d.id)}
                className="inline-flex items-center gap-1.5"
              >
                <span>{label}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  · {d.startTime}
                </span>
                {d.blockCount > 0 ? (
                  <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                    {d.blockCount}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => handleRemove(d.id, label)}
                className="ml-1 size-4 rounded-md text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label={`${label} löschen`}
              >
                <X className="mx-auto size-3" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
      >
        <Plus className="size-3" />
        Tag
      </button>
    </div>
  );
}
