"use client";

import { useState } from "react";
import {
  Plus,
  Square,
  Layers,
  Columns3,
  StickyNote,
  LibraryBig,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type BlockKind = "BLOCK" | "GROUP" | "BREAKOUT" | "NOTE";
/** What the user can pick from the Add-Block menu — includes "METHOD" which
 * triggers a downstream picker for an existing library method. */
export type AddBlockOption = BlockKind | "METHOD";

const OPTIONS: Array<{
  type: AddBlockOption;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: "BLOCK",
    title: "Block",
    desc: "Eine Aktivität in deiner Session",
    Icon: Square,
  },
  {
    type: "METHOD",
    title: "Methoden-Block",
    desc: "Aus der Bibliothek (Brainstorming, Retro, …)",
    Icon: LibraryBig,
  },
  {
    type: "GROUP",
    title: "Gruppe",
    desc: "Mehrere Aktivitäten zu einer Phase zusammenfassen",
    Icon: Layers,
  },
  {
    type: "BREAKOUT",
    title: "Breakout",
    desc: "Parallele Tracks — Aktivitäten gleichzeitig in mehreren Gruppen",
    Icon: Columns3,
  },
  {
    type: "NOTE",
    title: "Notiz",
    desc: "Annotation für dich oder dein Trainer-Team",
    Icon: StickyNote,
  },
];

export function AddBlockMenu({
  onSelect,
  variant = "primary",
  label,
  allowedTypes,
}: {
  onSelect: (type: AddBlockOption) => void;
  variant?: "primary" | "ghost" | "compact";
  label?: string;
  /** Restrict which options are shown. Defaults to all. */
  allowedTypes?: AddBlockOption[];
}) {
  const [open, setOpen] = useState(false);
  const opts = allowedTypes
    ? OPTIONS.filter((o) => allowedTypes.includes(o.type))
    : OPTIONS;

  const triggerClass = cn(
    variant === "compact" &&
      "flex size-6 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-accent hover:text-foreground",
    variant === "ghost" &&
      "group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-background/30 px-4 py-4 text-sm font-medium text-muted-foreground transition-all hover:border-[var(--neon-violet)]/40 hover:bg-background/60 hover:text-foreground",
    variant === "primary" &&
      "inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_30px_-8px_oklch(0.65_0.26_295/_0.5)] hover:opacity-95"
  );

  const triggerLabel =
    variant === "compact" ? null : (
      <>
        <Plus className="size-4" />
        {label ?? "Block hinzufügen"}
      </>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={triggerClass}
        aria-label="Block hinzufügen"
      >
        {variant === "compact" ? <Plus className="size-3.5" /> : triggerLabel}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-xl border border-border/60 p-1.5"
        align="start"
      >
        <div className="space-y-0.5">
          {opts.map((opt) => {
            const Icon = opt.Icon;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelect(opt.type);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  "hover:bg-accent/60 focus:bg-accent/60 focus:outline-none"
                )}
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/60">
                  <Icon className="size-4 text-[var(--neon-violet)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{opt.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
