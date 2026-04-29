"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AddBlockOption } from "./add-block-menu";

import {
  Square,
  Layers,
  Columns3,
  StickyNote,
  LibraryBig,
} from "lucide-react";

const ICON_MAP = { Square, Layers, Columns3, StickyNote, LibraryBig };

const OPTIONS: Array<{
  type: AddBlockOption;
  title: string;
  desc: string;
  iconName: keyof typeof ICON_MAP;
}> = [
  { type: "BLOCK", title: "Block", desc: "Aktivität", iconName: "Square" },
  {
    type: "METHOD",
    title: "Methoden-Block",
    desc: "Aus der Bibliothek",
    iconName: "LibraryBig",
  },
  {
    type: "GROUP",
    title: "Gruppe",
    desc: "Phase mit Sub-Blöcken",
    iconName: "Layers",
  },
  {
    type: "BREAKOUT",
    title: "Breakout",
    desc: "Parallele Tracks",
    iconName: "Columns3",
  },
  {
    type: "NOTE",
    title: "Notiz",
    desc: "Trainer-Hinweis",
    iconName: "StickyNote",
  },
];

/**
 * Insert-Gap: a thin hover-zone that reveals a Plus button to insert a
 * new block AT THIS POSITION (between two existing blocks, or at the
 * very start / end of a list).
 */
export function InsertGap({
  onSelect,
  allowContainers = true,
}: {
  onSelect: (type: AddBlockOption) => void;
  /** Allow GROUP/BREAKOUT? Inside a group/track they make no sense. */
  allowContainers?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const opts = allowContainers
    ? OPTIONS
    : OPTIONS.filter(
        (o) => o.type === "BLOCK" || o.type === "NOTE" || o.type === "METHOD"
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "group relative -my-1 flex h-3 w-full cursor-pointer items-center justify-center",
          "transition-opacity",
          open ? "opacity-100" : "opacity-0 hover:opacity-100"
        )}
        aria-label="Block hier einfügen"
      >
        <span className="absolute inset-x-8 h-px bg-gradient-to-r from-transparent via-[var(--neon-violet)]/40 to-transparent" />
        <span className="relative z-10 flex size-5 items-center justify-center rounded-full border border-[var(--neon-violet)]/40 bg-background shadow-sm">
          <Plus className="size-3 text-[var(--neon-violet)]" />
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 rounded-xl border border-border/60 p-1.5"
        align="center"
      >
        <div className="space-y-0.5">
          {opts.map((opt) => {
            const Icon = ICON_MAP[opt.iconName];
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelect(opt.type);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/60 focus:bg-accent/60 focus:outline-none"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/60">
                  <Icon className="size-3.5 text-[var(--neon-violet)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{opt.title}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
