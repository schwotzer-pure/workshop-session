"use client";

import { useTransition } from "react";
import {
  GripVertical,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Notebook,
  Palette,
  MoreVertical,
  PanelRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  toggleBlockLockAction,
  deleteBlockAction,
  duplicateBlockAction,
} from "@/actions/block";
import type { BlockData, EditorContext } from "./types";

/**
 * The drag-handle (6 dots, left side). ONLY for dragging — no menu.
 */
export function DragHandle({
  attributes,
  listeners,
  className,
  ariaLabel = "Block verschieben",
}: {
  attributes?: Record<string, unknown>;
  listeners?: Record<string, unknown>;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className={cn(
        "flex w-8 shrink-0 items-center justify-center rounded-l-2xl text-muted-foreground/40 transition-all touch-none",
        "hover:bg-gradient-to-b hover:from-[var(--neon-cyan)]/10 hover:to-[var(--neon-violet)]/10 hover:text-[var(--neon-violet)]",
        "cursor-grab active:cursor-grabbing",
        className
      )}
      aria-label={ariaLabel}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

/**
 * Read-only drag-handle for the DragOverlay ghost.
 */
export function DragHandleGhost() {
  return (
    <div className="flex w-8 shrink-0 items-center justify-center rounded-l-2xl text-[var(--neon-violet)]">
      <GripVertical className="size-4" />
    </div>
  );
}

/**
 * The 3-dots actions menu — independent of the drag-handle.
 * Sits at the top-right of the block.
 */
export function BlockActionsMenu({
  block,
  ctx,
  onCategoryClick,
  onTrainerNoteClick,
  className,
}: {
  block: BlockData;
  ctx: EditorContext;
  onCategoryClick: () => void;
  onTrainerNoteClick: () => void;
  className?: string;
}) {
  const [, startTransition] = useTransition();

  const persist = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error("Aktion fehlgeschlagen");
        console.error(e);
      }
    });

  const toggleLock = () => {
    ctx.onLocalUpdate(block.id, { locked: !block.locked });
    persist(() => toggleBlockLockAction(block.id));
  };

  const handleDuplicate = () => {
    persist(async () => {
      await duplicateBlockAction(block.id);
    });
  };

  const handleDelete = () => {
    const label =
      block.type === "GROUP"
        ? "Gruppe mit allen Blöcken"
        : block.type === "BREAKOUT"
        ? "Breakout mit allen Tracks"
        : block.type === "NOTE"
        ? "Notiz"
        : "Block";
    if (!confirm(`${label} wirklich löschen?`)) return;
    ctx.onLocalDelete(block.id);
    persist(() => deleteBlockAction(block.id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-all",
          "opacity-0 hover:bg-accent/60 hover:text-foreground group-hover:opacity-100",
          "data-[popup-open]:opacity-100 data-[popup-open]:bg-accent/60 data-[popup-open]:text-foreground",
          className
        )}
        aria-label="Block-Aktionen"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {block.type === "GROUP"
              ? "Gruppe"
              : block.type === "BREAKOUT"
              ? "Breakout"
              : block.type === "NOTE"
              ? "Notiz"
              : "Block"}
          </DropdownMenuLabel>
          {block.type !== "NOTE" ? (
            <DropdownMenuItem onClick={() => ctx.onOpenBlockDetails(block.id)}>
              <PanelRight className="mr-2 size-3.5" />
              Block-Details öffnen
            </DropdownMenuItem>
          ) : null}
          {block.type !== "NOTE" ? (
            <DropdownMenuItem onClick={toggleLock}>
              {block.locked ? (
                <>
                  <Unlock className="mr-2 size-3.5" />
                  Zeit entsperren
                </>
              ) : (
                <>
                  <Lock className="mr-2 size-3.5" />
                  Zeit fixieren
                </>
              )}
            </DropdownMenuItem>
          ) : null}
          {block.type !== "NOTE" ? (
            <DropdownMenuItem onClick={onCategoryClick}>
              <Palette className="mr-2 size-3.5" />
              Kategorie zuweisen …
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={onTrainerNoteClick}>
            <Notebook className="mr-2 size-3.5" />
            Trainer-Notiz {block.notes ? "bearbeiten" : "hinzufügen"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 size-3.5" />
          Duplizieren
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-3.5" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
