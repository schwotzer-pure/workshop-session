"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, FileEdit, CalendarClock, Radio, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { setWorkshopStatusAction } from "@/actions/workshop";
import { cn } from "@/lib/utils";

export type WorkshopStatusValue =
  | "DRAFT"
  | "SCHEDULED"
  | "RUNNING"
  | "COMPLETED"
  | "ARCHIVED";

const STATUS_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    dot: string;
  }
> = {
  DRAFT: {
    label: "Entwurf",
    icon: FileEdit,
    color: "text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  SCHEDULED: {
    label: "Geplant",
    icon: CalendarClock,
    color: "text-[var(--neon-cyan)]",
    dot: "bg-[var(--neon-cyan)] shadow-[0_0_8px_oklch(0.82_0.16_200/0.6)]",
  },
  RUNNING: {
    label: "Läuft",
    icon: Radio,
    color: "text-[var(--neon-pink)]",
    dot: "bg-[var(--neon-pink)] shadow-[0_0_8px_oklch(0.72_0.24_350/0.6)] animate-pulse",
  },
  COMPLETED: {
    label: "Abgeschlossen",
    icon: CheckCircle2,
    color: "text-[var(--neon-violet)]",
    dot: "bg-[var(--neon-violet)]/70",
  },
  ARCHIVED: {
    label: "Archiviert",
    icon: FileEdit,
    color: "text-muted-foreground",
    dot: "bg-muted-foreground/30",
  },
};

const SELECTABLE: WorkshopStatusValue[] = [
  "DRAFT",
  "SCHEDULED",
  "RUNNING",
  "COMPLETED",
];

export function StatusPicker({
  workshopId,
  value,
}: {
  workshopId: string;
  value: WorkshopStatusValue;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const meta = STATUS_META[value] ?? STATUS_META.DRAFT;
  const Icon = meta.icon;

  const handleSet = (status: WorkshopStatusValue) => {
    if (status === value) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      try {
        await setWorkshopStatusAction({
          id: workshopId,
          status: status as "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED",
        });
      } catch (e) {
        toast.error("Konnte Status nicht ändern");
        console.error(e);
      }
    });
  };

  // Archived workshops have a dedicated unarchive flow — not selectable here.
  const disabled = value === "ARCHIVED";

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium transition-all",
          !disabled && "hover:border-[var(--neon-violet)]/40 hover:bg-background/80",
          disabled && "cursor-default opacity-70"
        )}
        disabled={disabled}
      >
        <span className={cn("size-1.5 rounded-full", meta.dot)} />
        <Icon className={cn("size-3", meta.color)} />
        <span className={meta.color}>{meta.label}</span>
        {!disabled ? (
          <ChevronDown className="size-3 text-muted-foreground/60" />
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        className="w-52 rounded-xl border border-border/60 p-1.5"
        align="start"
      >
        <div className="space-y-0.5">
          <div className="px-1.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Status setzen
          </div>
          {SELECTABLE.map((s) => {
            const m = STATUS_META[s];
            const SI = m.icon;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleSet(s)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/60",
                  value === s && "bg-accent/40"
                )}
              >
                <span className={cn("size-1.5 rounded-full", m.dot)} />
                <SI className={cn("size-3.5", m.color)} />
                <span className="flex-1">{m.label}</span>
                {value === s ? (
                  <Check className="size-3.5 text-[var(--neon-violet)]" />
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 border-t border-border/60 px-1.5 pt-1.5 text-[10px] text-muted-foreground">
          Live-Start setzt automatisch auf „Läuft", Live-Ende auf
          „Abgeschlossen". Du kannst manuell überschreiben.
        </p>
      </PopoverContent>
    </Popover>
  );
}
