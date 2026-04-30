"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Lock,
  Unlock,
  Minus,
  Plus,
  StickyNote,
  Notebook,
  ListChecks,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  updateBlockAction,
  toggleBlockLockAction,
} from "@/actions/block";
import { CategoryPicker } from "./category-picker";
import {
  DragHandle,
  DragHandleGhost,
  BlockActionsMenu,
} from "./block-quick-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { BlockData, EditorContext } from "./types";

function userInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function BlockCard({
  block,
  computedStartTime,
  computedEndTime,
  isActiveDrag,
  ctx,
  compact = false,
}: {
  block: BlockData;
  computedStartTime: string;
  computedEndTime: string;
  isActiveDrag: boolean;
  ctx: EditorContext;
  compact?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    transition: { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isActiveDrag && "invisible")}
    >
      <BlockCardBody
        block={block}
        computedStartTime={computedStartTime}
        computedEndTime={computedEndTime}
        ctx={ctx}
        compact={compact}
        dragAttributes={attributes as unknown as Record<string, unknown>}
        dragListeners={listeners as unknown as Record<string, unknown>}
      />
    </div>
  );
}

export function BlockCardGhost({
  block,
  computedStartTime,
  computedEndTime,
  ctx,
}: {
  block: BlockData;
  computedStartTime: string;
  computedEndTime: string;
  ctx: EditorContext;
}) {
  return (
    <BlockCardBody
      block={block}
      computedStartTime={computedStartTime}
      computedEndTime={computedEndTime}
      ctx={ctx}
      readOnly
      compact={block.type === "NOTE"}
      ghostStyle
    />
  );
}

function BlockIndicators({
  block,
  ctx,
  readOnly,
}: {
  block: BlockData;
  ctx: EditorContext;
  readOnly: boolean;
}) {
  const tasksDone = block.tasks.filter((t) => t.done).length;
  const tasksTotal = block.tasks.length;
  const materialsCount = block.materials.length;
  const open = () => !readOnly && ctx.onOpenBlockDetails(block.id);

  if (!block.assignedTo && tasksTotal === 0 && materialsCount === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {tasksTotal > 0 ? (
        <button
          type="button"
          onClick={open}
          disabled={readOnly}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition-colors",
            !readOnly && "hover:border-[var(--neon-violet)]/40 hover:bg-background/80",
            tasksDone === tasksTotal
              ? "text-[var(--neon-violet)]"
              : "text-muted-foreground"
          )}
          title="Aufgaben"
        >
          <ListChecks className="size-3" />
          {tasksDone}/{tasksTotal}
        </button>
      ) : null}
      {materialsCount > 0 ? (
        <button
          type="button"
          onClick={open}
          disabled={readOnly}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground transition-colors",
            !readOnly && "hover:border-[var(--neon-violet)]/40 hover:bg-background/80"
          )}
          title="Material"
        >
          <Package className="size-3" />
          {materialsCount}
        </button>
      ) : null}
      {block.assignedTo ? (
        <button
          type="button"
          onClick={open}
          disabled={readOnly}
          className="rounded-full transition-transform hover:scale-110"
          title={`Zugewiesen an ${block.assignedTo.name}`}
        >
          <Avatar className="size-5 border border-border/70 bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]">
            <AvatarFallback className="bg-transparent text-[9px] font-semibold text-white">
              {userInitials(block.assignedTo.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      ) : null}
    </div>
  );
}

function BlockCardBody({
  block,
  computedStartTime,
  computedEndTime,
  ctx,
  readOnly = false,
  ghostStyle = false,
  compact = false,
  dragAttributes,
  dragListeners,
}: {
  block: BlockData;
  computedStartTime: string;
  computedEndTime: string;
  ctx: EditorContext;
  readOnly?: boolean;
  ghostStyle?: boolean;
  compact?: boolean;
  dragAttributes?: Record<string, unknown>;
  dragListeners?: Record<string, unknown>;
}) {
  const [, startTransition] = useTransition();
  const [titleValue, setTitleValue] = useState(block.title);
  const lastSavedTitle = useRef(block.title);
  const [descValue, setDescValue] = useState(block.description ?? "");
  const lastSavedDesc = useRef(block.description ?? "");
  const [notesValue, setNotesValue] = useState(block.notes ?? "");
  const lastSavedNotes = useRef(block.notes ?? "");
  const [duration, setDuration] = useState(block.duration);
  const [showDesc, setShowDesc] = useState(Boolean(block.description));
  const [showNotes, setShowNotes] = useState(Boolean(block.notes));
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (showNotes && notesRef.current) {
      notesRef.current.focus();
    }
  }, [showNotes]);

  const isNote = block.type === "NOTE";
  const isCompact = compact || isNote;
  const category = ctx.categories.find((c) => c.id === block.categoryId);

  const persist = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error("Speichern fehlgeschlagen");
        console.error(e);
      }
    });

  const setDurationDelta = (delta: number) => {
    const next = Math.max(0, Math.min(720, duration + delta));
    if (next === duration) return;
    setDuration(next);
    ctx.onLocalUpdate(block.id, { duration: next });
    persist(() => updateBlockAction({ id: block.id, duration: next }));
  };

  const setDurationValue = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    const next = Math.max(0, Math.min(720, n));
    setDuration(next);
    ctx.onLocalUpdate(block.id, { duration: next });
    persist(() => updateBlockAction({ id: block.id, duration: next }));
  };

  const toggleLockInline = () => {
    ctx.onLocalUpdate(block.id, { locked: !block.locked });
    persist(() => toggleBlockLockAction(block.id));
  };

  const setCategory = (categoryId: string | null) => {
    ctx.onLocalUpdate(block.id, { categoryId });
    persist(() => updateBlockAction({ id: block.id, categoryId }));
  };

  const dragHandle = readOnly ? (
    <DragHandleGhost />
  ) : (
    <DragHandle attributes={dragAttributes} listeners={dragListeners} />
  );

  const actionsMenu = readOnly ? null : (
    <BlockActionsMenu
      block={block}
      ctx={ctx}
      onCategoryClick={() => setCategoryPickerOpen(true)}
      onTrainerNoteClick={() => setShowNotes(true)}
    />
  );

  // ---------------------- NOTE-style body ----------------------
  if (isNote) {
    return (
      <div
        className={cn(
          "group relative flex gap-2 rounded-2xl border bg-[oklch(0.96_0.08_95)] backdrop-blur-md",
          "border-[oklch(0.85_0.16_95)]/60",
          ghostStyle &&
            "border-2 border-[var(--neon-violet)]/40 shadow-[0_20px_50px_-10px_oklch(0.65_0.26_295/_0.45)] cursor-grabbing rotate-[-1.2deg] scale-[1.02]"
        )}
      >
        {dragHandle}
        <div className="min-w-0 flex-1 py-2.5 pr-2">
          <div className="flex items-start gap-2">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-[oklch(0.5_0.15_85)]" />
            <textarea
              value={titleValue}
              readOnly={readOnly}
              autoFocus={!block.title && !readOnly}
              onChange={(e) => {
                setTitleValue(e.target.value);
                ctx.onLocalUpdate(block.id, { title: e.target.value });
              }}
              onBlur={() => {
                if (titleValue !== lastSavedTitle.current) {
                  lastSavedTitle.current = titleValue;
                  persist(() =>
                    updateBlockAction({ id: block.id, title: titleValue })
                  );
                }
              }}
              placeholder="Notiz für dich oder das Trainer-Team …"
              rows={Math.max(1, titleValue.split("\n").length)}
              className="min-w-0 flex-1 resize-none bg-transparent text-sm text-[oklch(0.25_0.05_85)] outline-none placeholder:text-[oklch(0.55_0.05_85)]/60 focus:outline-none"
            />
            {actionsMenu}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------- BLOCK-style body ----------------------
  return (
    <div
      className={cn(
        "group relative flex gap-2 rounded-2xl border bg-card/80 backdrop-blur-md transition-colors",
        "border-border/60 hover:border-[var(--neon-violet)]/25",
        ghostStyle &&
          "border-2 border-[var(--neon-violet)]/40 shadow-[0_20px_50px_-10px_oklch(0.65_0.26_295/_0.45)] cursor-grabbing rotate-[-1.2deg] scale-[1.02]"
      )}
    >
      {category ? (
        <div
          className="absolute left-8 top-2 bottom-2 w-1 rounded-full"
          style={{ background: category.color }}
        />
      ) : null}

      {dragHandle}

      <div className="flex flex-col items-end justify-start gap-1 py-3 pl-2 pr-1 tabular-nums">
        <button
          type="button"
          onClick={toggleLockInline}
          disabled={readOnly}
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors",
            block.locked
              ? "text-[var(--neon-violet)] hover:bg-[var(--neon-violet)]/10"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            readOnly && "cursor-default"
          )}
          title={block.locked ? "Zeit entsperren" : "Zeit fixieren"}
        >
          {block.locked ? (
            <Lock className="size-3" />
          ) : (
            <Unlock className="size-3 opacity-60" />
          )}
          <span>{computedStartTime}</span>
        </button>
        <span className="px-1.5 text-[10px] text-muted-foreground/60">
          {computedEndTime}
        </span>
      </div>

      <div className={cn("min-w-0 flex-1 pr-3", isCompact ? "py-2" : "py-3")}>
        <div className="flex items-center gap-2">
          {!readOnly ? (
            <CategoryPicker
              categories={ctx.categories}
              value={block.categoryId}
              onChange={setCategory}
              onCategoryAdded={ctx.onAddCategory}
              open={categoryPickerOpen}
              onOpenChange={setCategoryPickerOpen}
            />
          ) : (
            <div
              className="size-7 shrink-0 rounded-md ring-1 ring-border/70"
              style={
                category
                  ? {
                      background: `color-mix(in oklch, ${category.color} 25%, transparent)`,
                    }
                  : undefined
              }
            >
              {category ? (
                <span
                  className="m-2 block size-3 rounded-sm"
                  style={{ background: category.color }}
                />
              ) : null}
            </div>
          )}

          <input
            type="text"
            value={titleValue}
            readOnly={readOnly}
            autoFocus={!block.title && !readOnly}
            onChange={(e) => {
              setTitleValue(e.target.value);
              ctx.onLocalUpdate(block.id, { title: e.target.value });
            }}
            onBlur={() => {
              if (titleValue !== lastSavedTitle.current) {
                lastSavedTitle.current = titleValue;
                persist(() =>
                  updateBlockAction({ id: block.id, title: titleValue })
                );
              }
            }}
            placeholder="Titel des Blocks …"
            className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/40 focus:outline-none"
          />

          <BlockIndicators block={block} ctx={ctx} readOnly={readOnly} />

          {!readOnly ? (
            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-background/40 px-1 py-0.5">
              <button
                type="button"
                onClick={() => setDurationDelta(-5)}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                aria-label="Dauer −5min"
              >
                <Minus className="size-3" />
              </button>
              <input
                type="number"
                value={duration}
                min={0}
                max={720}
                onChange={(e) => setDurationValue(e.target.value)}
                className="w-10 bg-transparent text-center text-sm font-medium tabular-nums outline-none [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="px-0.5 text-xs text-muted-foreground">min</span>
              <button
                type="button"
                onClick={() => setDurationDelta(5)}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                aria-label="Dauer +5min"
              >
                <Plus className="size-3" />
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-background/40 px-2 py-1 text-sm font-medium tabular-nums">
              {duration}
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          )}

          {actionsMenu}
        </div>

        {showDesc || descValue ? (
          <textarea
            value={descValue}
            readOnly={readOnly}
            onChange={(e) => setDescValue(e.target.value)}
            onBlur={() => {
              const trimmed = descValue.trim();
              if (trimmed !== lastSavedDesc.current.trim()) {
                lastSavedDesc.current = descValue;
                persist(() =>
                  updateBlockAction({
                    id: block.id,
                    description: trimmed || null,
                  })
                );
              }
            }}
            placeholder="Beschreibung, Anleitung, Talking Points …"
            rows={2}
            className="mt-2 w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/40 focus:text-foreground focus:outline-none"
          />
        ) : !readOnly ? (
          <button
            type="button"
            onClick={() => setShowDesc(true)}
            className="mt-1 text-xs text-muted-foreground/60 hover:text-foreground"
          >
            + Beschreibung
          </button>
        ) : null}

        {showNotes || notesValue ? (
          <div className="mt-2 rounded-lg border border-dashed border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.04] px-2.5 py-1.5">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--neon-violet)]/80">
              <Notebook className="size-3" />
              Trainer-Notiz
            </div>
            <textarea
              ref={notesRef}
              value={notesValue}
              readOnly={readOnly}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={() => {
                const trimmed = notesValue.trim();
                if (trimmed !== lastSavedNotes.current.trim()) {
                  lastSavedNotes.current = notesValue;
                  persist(() =>
                    updateBlockAction({
                      id: block.id,
                      notes: trimmed || null,
                    })
                  );
                }
              }}
              placeholder="Hinweise für dich, nicht sichtbar für Teilnehmende …"
              rows={2}
              className="w-full resize-none bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/40 focus:text-foreground focus:outline-none"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
