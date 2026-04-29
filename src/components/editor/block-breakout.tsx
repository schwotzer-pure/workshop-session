"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Lock,
  Unlock,
  Columns3,
  Plus,
  X,
  Notebook,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  updateBlockAction,
  toggleBlockLockAction,
  addBreakoutTrackAction,
  removeBreakoutTrackAction,
} from "@/actions/block";
import { formatDuration } from "@/lib/time";
import { recalcBlocks } from "@/lib/recalc";
import { CategoryPicker } from "./category-picker";
import { BlockCard } from "./block-card";
import {
  DragHandle,
  DragHandleGhost,
  BlockActionsMenu,
} from "./block-quick-menu";
import { InsertGap } from "./insert-gap";
import type { BlockData, EditorContext } from "./types";

export function BlockBreakout({
  block,
  children,
  computedStartTime,
  computedEndTime,
  isActiveDrag,
  ctx,
  onAddChild,
  onInsertChildAt,
}: {
  block: BlockData;
  children: BlockData[];
  computedStartTime: string;
  computedEndTime: string;
  isActiveDrag: boolean;
  ctx: EditorContext;
  onAddChild: (
    parentId: string,
    type: "BLOCK" | "NOTE" | "METHOD",
    column: number
  ) => void;
  onInsertChildAt: (
    parentId: string,
    type: "BLOCK" | "NOTE" | "METHOD",
    column: number,
    position: number
  ) => void;
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

  // Group children by column
  const cols = new Map<number, BlockData[]>();
  for (const c of children) {
    const arr = cols.get(c.column) ?? [];
    arr.push(c);
    cols.set(c.column, arr);
  }
  const columnIndices = Array.from(cols.keys()).sort((a, b) => a - b);

  // Compute duration as max column total
  const colTotals = columnIndices.map((ci) =>
    (cols.get(ci) ?? [])
      .filter((c) => c.type !== "NOTE")
      .reduce((sum, c) => sum + c.duration, 0)
  );
  const breakoutDuration = colTotals.length ? Math.max(...colTotals) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-[var(--neon-cyan)]/25 bg-[var(--neon-cyan)]/[0.04] backdrop-blur-md",
        isActiveDrag && "invisible"
      )}
    >
      <BreakoutHeader
        block={block}
        computedStartTime={computedStartTime}
        computedEndTime={computedEndTime}
        ctx={ctx}
        breakoutDuration={breakoutDuration}
        dragHandle={
          <DragHandle
            attributes={attributes as unknown as Record<string, unknown>}
            listeners={listeners as unknown as Record<string, unknown>}
            ariaLabel="Breakout verschieben"
          />
        }
      />

      <div className="ml-8 px-3 pb-3">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${columnIndices.length}, minmax(0, 1fr))`,
          }}
        >
          {columnIndices.map((ci) => {
            const colChildren = (cols.get(ci) ?? []).sort(
              (a, b) => a.position - b.position
            );
            const childRecalc = recalcBlocks(
              colChildren.map((c) => ({
                id: c.id,
                position: c.position,
                duration: c.duration,
                locked: false,
                startTime: null,
                type: c.type,
              })),
              computedStartTime
            );
            const colIds = colChildren.map((c) => c.id);
            const colTotal = colTotals[columnIndices.indexOf(ci)];
            return (
              <BreakoutColumn
                key={ci}
                parentId={block.id}
                column={ci}
                colChildren={colChildren}
                childRecalc={childRecalc}
                colIds={colIds}
                colTotal={colTotal}
                ctx={ctx}
                onAddChild={onAddChild}
                onInsertChildAt={onInsertChildAt}
                canRemove={columnIndices.length > 1}
              />
            );
          })}
        </div>

        <div className="mt-3">
          <AddTrackButton parentId={block.id} />
        </div>
      </div>
    </div>
  );
}

export function BlockBreakoutGhost({
  block,
  children,
  computedStartTime,
  computedEndTime,
  ctx,
}: {
  block: BlockData;
  children: BlockData[];
  computedStartTime: string;
  computedEndTime: string;
  ctx: EditorContext;
}) {
  const cols = new Map<number, BlockData[]>();
  for (const c of children) {
    const arr = cols.get(c.column) ?? [];
    arr.push(c);
    cols.set(c.column, arr);
  }
  const colTotals = Array.from(cols.values()).map((arr) =>
    arr.filter((c) => c.type !== "NOTE").reduce((s, c) => s + c.duration, 0)
  );
  const dur = colTotals.length ? Math.max(...colTotals) : 0;
  return (
    <div className="rotate-[-1.2deg] scale-[1.02] rounded-2xl border-2 border-[var(--neon-violet)]/40 bg-[var(--neon-cyan)]/[0.05] shadow-[0_20px_50px_-10px_oklch(0.65_0.26_295/_0.45)]">
      <BreakoutHeader
        block={block}
        computedStartTime={computedStartTime}
        computedEndTime={computedEndTime}
        ctx={ctx}
        breakoutDuration={dur}
        readOnly
        dragHandle={<DragHandleGhost />}
      />
      <div className="ml-8 px-3 pb-3 text-xs italic text-muted-foreground">
        {cols.size} parallele Tracks
      </div>
    </div>
  );
}

function BreakoutColumn({
  parentId,
  column,
  colChildren,
  childRecalc,
  colIds,
  colTotal,
  ctx,
  onAddChild,
  onInsertChildAt,
  canRemove,
}: {
  parentId: string;
  column: number;
  colChildren: BlockData[];
  childRecalc: ReturnType<typeof recalcBlocks>;
  colIds: string[];
  colTotal: number;
  ctx: EditorContext;
  onAddChild: (
    parentId: string,
    type: "BLOCK" | "NOTE" | "METHOD",
    column: number
  ) => void;
  onInsertChildAt: (
    parentId: string,
    type: "BLOCK" | "NOTE" | "METHOD",
    column: number,
    position: number
  ) => void;
  canRemove: boolean;
}) {
  const [, startTransition] = useTransition();

  const handleRemoveTrack = () => {
    if (!confirm(`Track "${column + 1}" mit allen Blöcken löschen?`)) return;
    startTransition(async () => {
      try {
        await removeBreakoutTrackAction({ parentBlockId: parentId, column });
      } catch (e) {
        toast.error("Track konnte nicht entfernt werden");
        console.error(e);
      }
    });
  };

  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-2">
      <div className="mb-2 flex items-center justify-between px-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Track {column + 1}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatDuration(colTotal)}
          </span>
          {canRemove ? (
            <button
              type="button"
              onClick={handleRemoveTrack}
              className="size-5 rounded text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              aria-label="Track entfernen"
            >
              <X className="mx-auto size-3" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-0.5">
        <SortableContext items={colIds} strategy={verticalListSortingStrategy}>
          {colChildren.map((c, idx) => {
            const cr = childRecalc[idx];
            return (
              <div key={c.id} className="space-y-0.5">
                <InsertGap
                  onSelect={(type) => {
                    if (type === "BLOCK" || type === "NOTE" || type === "METHOD") {
                      onInsertChildAt(parentId, type, column, idx);
                    }
                  }}
                  allowContainers={false}
                />
                <BlockCard
                  block={c}
                  computedStartTime={cr?.computedStartTime ?? ""}
                  computedEndTime={cr?.computedEndTime ?? ""}
                  isActiveDrag={false}
                  ctx={ctx}
                />
              </div>
            );
          })}
          <InsertGap
            onSelect={(type) => {
              if (type === "BLOCK" || type === "NOTE" || type === "METHOD") {
                onAddChild(parentId, type, column);
              }
            }}
            allowContainers={false}
          />
        </SortableContext>

        <button
          type="button"
          onClick={() => onAddChild(parentId, "BLOCK", column)}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-background/40 px-2 py-2 text-xs text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:bg-background/60 hover:text-foreground"
        >
          <Plus className="size-3" />
          Block hinzufügen
        </button>
      </div>
    </div>
  );
}

function AddTrackButton({ parentId }: { parentId: string }) {
  const [, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      try {
        await addBreakoutTrackAction({ parentBlockId: parentId });
      } catch (e) {
        toast.error("Track konnte nicht angelegt werden");
        console.error(e);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/[0.08]"
    >
      <Plus className="size-3" />
      Track hinzufügen
    </button>
  );
}

function BreakoutHeader({
  block,
  computedStartTime,
  computedEndTime,
  ctx,
  breakoutDuration,
  dragHandle,
  readOnly = false,
}: {
  block: BlockData;
  computedStartTime: string;
  computedEndTime: string;
  ctx: EditorContext;
  breakoutDuration: number;
  dragHandle: React.ReactNode;
  readOnly?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [titleValue, setTitleValue] = useState(block.title);
  const [notesValue, setNotesValue] = useState(block.notes ?? "");
  const [showNotes, setShowNotes] = useState(Boolean(block.notes));
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (showNotes && notesRef.current) {
      notesRef.current.focus();
    }
  }, [showNotes]);

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

  const toggleLock = () => {
    ctx.onLocalUpdate(block.id, { locked: !block.locked });
    persist(() => toggleBlockLockAction(block.id));
  };

  const setCategory = (categoryId: string | null) => {
    ctx.onLocalUpdate(block.id, { categoryId });
    persist(() => updateBlockAction({ id: block.id, categoryId }));
  };

  return (
    <div className="group relative flex gap-2">
      {dragHandle}

      <div className="flex flex-col items-end justify-start gap-1 py-3 pl-2 pr-1 tabular-nums">
        <button
          type="button"
          onClick={toggleLock}
          disabled={readOnly}
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors",
            block.locked
              ? "text-[var(--neon-violet)] hover:bg-[var(--neon-violet)]/10"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            readOnly && "cursor-default"
          )}
        >
          {block.locked ? <Lock className="size-3" /> : <Unlock className="size-3 opacity-60" />}
          <span>{computedStartTime}</span>
        </button>
        <span className="px-1.5 text-[10px] text-muted-foreground/60">
          {computedEndTime}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-3 pr-3">
        <div className="flex items-center gap-2">
          <Columns3 className="size-4 shrink-0 text-[var(--neon-cyan)]" />
          {!readOnly ? (
            <CategoryPicker
              categories={ctx.categories}
              value={block.categoryId}
              onChange={setCategory}
              onCategoryAdded={ctx.onAddCategory}
              open={categoryPickerOpen}
              onOpenChange={setCategoryPickerOpen}
            />
          ) : null}

          <input
            type="text"
            value={titleValue}
            readOnly={readOnly}
            onChange={(e) => {
              setTitleValue(e.target.value);
              ctx.onLocalUpdate(block.id, { title: e.target.value });
            }}
            onBlur={() => {
              if (titleValue !== block.title) {
                persist(() =>
                  updateBlockAction({ id: block.id, title: titleValue })
                );
              }
            }}
            placeholder="Breakout-Titel (z.B. Diskussionsphase) …"
            className="min-w-0 flex-1 bg-transparent text-base font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 focus:outline-none"
          />

          <span className="shrink-0 rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-sm font-medium tabular-nums text-muted-foreground">
            {formatDuration(breakoutDuration)}
          </span>

          {!readOnly ? (
            <BlockActionsMenu
              block={block}
              ctx={ctx}
              onCategoryClick={() => setCategoryPickerOpen(true)}
              onTrainerNoteClick={() => setShowNotes(true)}
            />
          ) : null}
        </div>

        {category ? (
          <div className="ml-7 mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2 rounded-sm"
              style={{ background: category.color }}
            />
            {category.name}
          </div>
        ) : null}

        {showNotes || notesValue ? (
          <div className="ml-7 mt-2 rounded-lg border border-dashed border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.04] px-2.5 py-1.5">
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
                if (notesValue !== (block.notes ?? "")) {
                  persist(() =>
                    updateBlockAction({
                      id: block.id,
                      notes: notesValue.trim() || null,
                    })
                  );
                }
              }}
              placeholder="Hinweise für dich oder das Trainer-Team …"
              rows={2}
              className="w-full resize-none bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/40 focus:text-foreground focus:outline-none"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
