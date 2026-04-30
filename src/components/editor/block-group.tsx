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
  Layers,
  Notebook,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  updateBlockAction,
  toggleBlockLockAction,
} from "@/actions/block";
import { formatDuration } from "@/lib/time";
import { sumChildDurations, recalcBlocks } from "@/lib/recalc";
import { CategoryPicker } from "./category-picker";
import { AddBlockMenu, type BlockKind } from "./add-block-menu";
import { BlockCard } from "./block-card";
import {
  DragHandle,
  DragHandleGhost,
  BlockActionsMenu,
} from "./block-quick-menu";
import { InsertGap } from "./insert-gap";
import type { BlockData, EditorContext } from "./types";

export function BlockGroup({
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
    column?: number
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

  const totalChildren = sumChildDurations(children);

  // Recalc for children, starting at the group's computed start time
  const childRecalc = recalcBlocks(
    children.map((c) => ({
      id: c.id,
      position: c.position,
      duration: c.duration,
      locked: c.locked,
      startTime: c.startTime,
      type: c.type,
    })),
    computedStartTime
  );

  const childIds = children
    .sort((a, b) => a.position - b.position)
    .map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-[var(--neon-violet)]/20 bg-[var(--neon-violet)]/[0.03] backdrop-blur-md",
        isActiveDrag && "invisible"
      )}
    >
      <GroupHeader
        block={block}
        computedStartTime={computedStartTime}
        computedEndTime={computedEndTime}
        ctx={ctx}
        totalChildrenDuration={totalChildren}
        dragHandle={
          <DragHandle
            attributes={attributes as unknown as Record<string, unknown>}
            listeners={listeners as unknown as Record<string, unknown>}
            ariaLabel="Gruppe verschieben"
          />
        }
      />

      <div className="ml-3 space-y-0.5 border-l border-[var(--neon-violet)]/15 px-2 pb-3 sm:ml-8 sm:px-3">
        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          {children
            .sort((a, b) => a.position - b.position)
            .map((c, idx) => {
              const cr = childRecalc[idx];
              return (
                <div key={c.id} className="space-y-0.5">
                  <InsertGap
                    onSelect={(type) => {
                      if (type === "BLOCK" || type === "NOTE" || type === "METHOD") {
                        onInsertChildAt(block.id, type, 0, idx);
                      } else {
                        toast.info("Gruppen können nur Blöcke und Notizen enthalten.");
                      }
                    }}
                    allowContainers={false}
                  />
                  <BlockCard
                    block={c}
                    computedStartTime={cr?.computedStartTime ?? computedStartTime}
                    computedEndTime={cr?.computedEndTime ?? computedStartTime}
                    isActiveDrag={false}
                    ctx={ctx}
                  />
                </div>
              );
            })}
          <InsertGap
            onSelect={(type) => {
              if (type === "BLOCK" || type === "NOTE" || type === "METHOD") {
                onAddChild(block.id, type);
              } else {
                toast.info("Gruppen können nur Blöcke und Notizen enthalten.");
              }
            }}
            allowContainers={false}
          />
        </SortableContext>
        <div className="pl-2 pt-1">
          <AddBlockMenu
            variant="ghost"
            label="Block in Gruppe hinzufügen"
            onSelect={(type) => {
              if (type === "BLOCK" || type === "NOTE" || type === "METHOD") {
                onAddChild(block.id, type);
              } else {
                toast.info("Gruppen können nur Blöcke und Notizen enthalten.");
              }
            }}
            allowedTypes={["BLOCK", "METHOD", "NOTE"]}
          />
        </div>
      </div>
    </div>
  );
}

export function BlockGroupGhost({
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
  const totalChildren = sumChildDurations(children);
  return (
    <div className="rotate-[-1.2deg] scale-[1.02] rounded-2xl border-2 border-[var(--neon-violet)]/40 bg-[var(--neon-violet)]/[0.05] shadow-[0_20px_50px_-10px_oklch(0.65_0.26_295/_0.45)]">
      <GroupHeader
        block={block}
        computedStartTime={computedStartTime}
        computedEndTime={computedEndTime}
        ctx={ctx}
        totalChildrenDuration={totalChildren}
        readOnly
        dragHandle={<DragHandleGhost />}
      />
      <div className="ml-8 px-3 pb-3 text-xs italic text-muted-foreground">
        + {children.length} Block{children.length === 1 ? "" : "e"} in dieser Gruppe
      </div>
    </div>
  );
}

function GroupHeader({
  block,
  computedStartTime,
  computedEndTime,
  ctx,
  totalChildrenDuration,
  dragHandle,
  readOnly = false,
}: {
  block: BlockData;
  computedStartTime: string;
  computedEndTime: string;
  ctx: EditorContext;
  totalChildrenDuration: number;
  dragHandle: React.ReactNode;
  readOnly?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [titleValue, setTitleValue] = useState(block.title);
  const lastSavedTitle = useRef(block.title);
  const [notesValue, setNotesValue] = useState(block.notes ?? "");
  const lastSavedNotes = useRef(block.notes ?? "");
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
          title={block.locked ? "Zeit entsperren" : "Zeit fixieren"}
        >
          {block.locked ? <Lock className="size-3" /> : <Unlock className="size-3 opacity-60" />}
          <span>{computedStartTime}</span>
        </button>
        <span className="px-1.5 text-[10px] text-muted-foreground/60">
          {computedEndTime}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-3 pr-2 sm:pr-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Layers className="size-4 shrink-0 text-[var(--neon-violet)]" />
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
            placeholder="Gruppen-Titel (z.B. Phase 1) …"
            className="min-w-0 flex-1 basis-40 bg-transparent text-base font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 focus:outline-none"
          />

          <span className="shrink-0 rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-sm font-medium tabular-nums text-muted-foreground">
            {formatDuration(totalChildrenDuration)}
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
