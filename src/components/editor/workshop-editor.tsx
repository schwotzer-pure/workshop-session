"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addBlockAction,
  moveBlockAction,
  reorderBlocksAction,
} from "@/actions/block";
import { deleteWorkshopAction } from "@/actions/workshop";
import { isRedirectError } from "@/lib/is-redirect";
import { recalcBlocks, sumChildDurations, totalDuration } from "@/lib/recalc";
import type { WorkshopWithBlocks, Category, AppUserListItem } from "@/lib/queries";
import { WorkshopHeader } from "./workshop-header";
import { BlockCard, BlockCardGhost } from "./block-card";
import { BlockGroup, BlockGroupGhost } from "./block-group";
import { BlockBreakout, BlockBreakoutGhost } from "./block-breakout";
import { AddBlockMenu, type BlockKind } from "./add-block-menu";
import { InsertGap } from "./insert-gap";
import { BlockDetailPanel } from "./block-detail-panel";
import type { BlockData, EditorContext } from "./types";

type ServerBlock = WorkshopWithBlocks["days"][number]["blocks"][number];

function toBlockData(b: ServerBlock): BlockData {
  return {
    id: b.id,
    type: b.type as BlockData["type"],
    title: b.title,
    description: b.description,
    notes: b.notes,
    duration: b.duration,
    locked: b.locked,
    startTime: b.startTime,
    position: b.position,
    column: b.column,
    parentBlockId: b.parentBlockId,
    categoryId: b.categoryId,
    assignedToId: b.assignedToId,
    assignedTo: b.assignedTo,
    tasks: (b.tasks ?? []).map((t) => ({
      id: t.id,
      text: t.text,
      done: t.done,
      position: t.position,
    })),
    materials: (b.materials ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      quantity: m.quantity,
      notes: m.notes,
    })),
  };
}

const TOP_BUCKET = "top_0";
function bucketKey(parentId: string | null, column: number): string {
  return parentId === null ? TOP_BUCKET : `${parentId}_${column}`;
}
function parseBucketKey(key: string): { parentId: string | null; column: number } {
  if (key === TOP_BUCKET) return { parentId: null, column: 0 };
  const idx = key.lastIndexOf("_");
  return {
    parentId: key.slice(0, idx),
    column: Number(key.slice(idx + 1)),
  };
}

export function WorkshopEditor({
  workshop,
  categories: initialCategories,
  users,
}: {
  workshop: WorkshopWithBlocks;
  categories: Category[];
  users: AppUserListItem[];
}) {
  const day = workshop.days[0];
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const dragStartBucket = useRef<string | null>(null);

  const initialBlocks = useMemo(() => {
    const map = new Map<string, BlockData>();
    for (const b of day?.blocks ?? []) {
      map.set(b.id, toBlockData(b));
    }
    return map;
  }, [day?.blocks]);

  const initialBuckets = useMemo(() => {
    const m = new Map<string, string[]>();
    const arr = Array.from(initialBlocks.values()).sort(
      (a, b) => a.position - b.position
    );
    for (const b of arr) {
      const k = bucketKey(b.parentBlockId, b.column);
      const list = m.get(k) ?? [];
      list.push(b.id);
      m.set(k, list);
    }
    return m;
  }, [initialBlocks]);

  const [blocks, setBlocks] = useState<Map<string, BlockData>>(initialBlocks);
  const [buckets, setBuckets] = useState<Map<string, string[]>>(initialBuckets);
  const [categories, setCategories] = useState(initialCategories);

  useSyncFromServer(initialBlocks, initialBuckets, setBlocks, setBuckets);

  const topOrderedIds = buckets.get(TOP_BUCKET) ?? [];
  const topBlocks = useMemo(
    () =>
      topOrderedIds
        .map((id) => blocks.get(id))
        .filter((b): b is BlockData => Boolean(b)),
    [topOrderedIds, blocks]
  );

  const childrenForBucket = (parentId: string, column: number): BlockData[] => {
    const k = bucketKey(parentId, column);
    return (buckets.get(k) ?? [])
      .map((id) => blocks.get(id))
      .filter((b): b is BlockData => Boolean(b));
  };

  // Compute effective duration for each top-level block (containers aggregate)
  const recalcInputs = useMemo(
    () =>
      topBlocks.map((b) => {
        let effective = b.duration;
        if (b.type === "GROUP") {
          const ch = childrenForBucket(b.id, 0);
          effective = sumChildDurations(ch);
        } else if (b.type === "BREAKOUT") {
          // collect all column buckets for this parent
          const colTotals = new Map<number, number>();
          for (const [k, ids] of buckets.entries()) {
            const parsed = parseBucketKey(k);
            if (parsed.parentId === b.id) {
              const sum = ids
                .map((id) => blocks.get(id))
                .filter((bb): bb is BlockData => Boolean(bb))
                .filter((bb) => bb.type !== "NOTE")
                .reduce((s, bb) => s + bb.duration, 0);
              colTotals.set(parsed.column, sum);
            }
          }
          effective = colTotals.size ? Math.max(...colTotals.values()) : 0;
        }
        return {
          id: b.id,
          position: b.position,
          duration: effective,
          locked: b.locked,
          startTime: b.startTime,
          type: b.type,
        };
      }),
    [topBlocks, buckets, blocks]
  );

  const recalced = useMemo(
    () => recalcBlocks(recalcInputs, day?.startTime ?? "09:00"),
    [recalcInputs, day?.startTime]
  );

  const totalMin = totalDuration(
    recalcInputs.map((r) => ({ duration: r.duration, type: r.type }))
  );
  const startTime = day?.startTime ?? "09:00";
  const endTime = recalced.length
    ? recalced[recalced.length - 1].computedEndTime
    : startTime;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ---------- Drag handlers ----------

  const findBucketOf = (id: string): string | null => {
    for (const [k, ids] of buckets.entries()) {
      if (ids.includes(id)) return k;
    }
    return null;
  };

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    setActiveId(id);
    dragStartBucket.current = findBucketOf(id);
  };

  /**
   * Cross-bucket live-move: when the active block hovers over a block in a
   * DIFFERENT bucket, we splice it into that bucket immediately so dnd-kit can
   * animate the drop and consider it a valid target.
   */
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeBucket = findBucketOf(activeId);
    const overBucket = findBucketOf(overId);
    if (!activeBucket || !overBucket) return;
    if (activeBucket === overBucket) return;

    // Containers can not be dropped INTO other containers
    const activeBlock = blocks.get(activeId);
    if (!activeBlock) return;
    if (activeBlock.type === "GROUP" || activeBlock.type === "BREAKOUT") return;

    // Move active out of activeBucket and into overBucket at over's index
    setBuckets((prev) => {
      const m = new Map(prev);
      const fromList = (m.get(activeBucket) ?? []).filter((id) => id !== activeId);
      const toList = [...(m.get(overBucket) ?? [])];
      const overIdx = toList.indexOf(overId);
      if (overIdx < 0) {
        toList.push(activeId);
      } else {
        toList.splice(overIdx, 0, activeId);
      }
      m.set(activeBucket, fromList);
      m.set(overBucket, toList);
      return m;
    });

    // Update block's parentBlockId / column to match new bucket
    const parsed = parseBucketKey(overBucket);
    setBlocks((prev) => {
      const cur = prev.get(activeId);
      if (!cur) return prev;
      if (cur.parentBlockId === parsed.parentId && cur.column === parsed.column)
        return prev;
      const m = new Map(prev);
      m.set(activeId, {
        ...cur,
        parentBlockId: parsed.parentId,
        column: parsed.column,
      });
      return m;
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const startBucket = dragStartBucket.current;
    setActiveId(null);
    dragStartBucket.current = null;

    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const currentBucket = findBucketOf(activeId);
    if (!currentBucket) return;

    const list = buckets.get(currentBucket) ?? [];
    const activeIdx = list.indexOf(activeId);
    const overIdx = list.indexOf(overId);

    let nextList = list;
    if (activeIdx >= 0 && overIdx >= 0 && activeIdx !== overIdx) {
      nextList = arrayMove(list, activeIdx, overIdx);
      setBuckets((prev) => {
        const m = new Map(prev);
        m.set(currentBucket, nextList);
        return m;
      });
    }

    const isCrossContainer = startBucket !== null && startBucket !== currentBucket;

    if (isCrossContainer) {
      const parsed = parseBucketKey(currentBucket);
      const fromList = buckets.get(startBucket) ?? [];
      const fromOrderedIds = fromList.filter((id) => id !== activeId);
      startTransition(async () => {
        try {
          await moveBlockAction({
            blockId: activeId,
            toParentBlockId: parsed.parentId,
            toColumn: parsed.column,
            fromOrderedIds,
            toOrderedIds: nextList,
          });
        } catch (err) {
          toast.error("Konnte Block nicht verschieben");
          console.error(err);
        }
      });
    } else if (activeIdx !== overIdx && overIdx >= 0) {
      const parsed = parseBucketKey(currentBucket);
      startTransition(async () => {
        try {
          await reorderBlocksAction({
            dayId: day!.id,
            parentBlockId: parsed.parentId,
            column: parsed.column,
            orderedIds: nextList,
          });
        } catch (err) {
          toast.error("Konnte Reihenfolge nicht speichern");
          console.error(err);
        }
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    dragStartBucket.current = null;
  };

  // ---------- Local mutations ----------

  const updateBlockLocal = (id: string, patch: Partial<BlockData>) => {
    setBlocks((prev) => {
      const cur = prev.get(id);
      if (!cur) return prev;
      const next = new Map(prev);
      next.set(id, { ...cur, ...patch });
      return next;
    });
  };

  const deleteBlockLocal = (id: string) => {
    const block = blocks.get(id);
    setBlocks((prev) => {
      const next = new Map(prev);
      next.delete(id);
      // Also remove descendants
      for (const b of prev.values()) {
        if (b.parentBlockId === id) next.delete(b.id);
      }
      return next;
    });
    setBuckets((prev) => {
      const next = new Map<string, string[]>();
      for (const [k, ids] of prev.entries()) {
        const filtered = ids.filter((bid) => bid !== id);
        // also drop entries for the deleted container's columns
        if (block) {
          const parsed = parseBucketKey(k);
          if (parsed.parentId === id) continue;
        }
        next.set(k, filtered);
      }
      return next;
    });
  };

  const ctx: EditorContext = {
    dayId: day?.id ?? "",
    workshopId: workshop.id,
    categories,
    users,
    onAddCategory: (cat) => setCategories((prev) => [...prev, cat]),
    onLocalUpdate: updateBlockLocal,
    onLocalDelete: deleteBlockLocal,
    onOpenBlockDetails: (blockId) => setSelectedBlockId(blockId),
  };

  const handleAddTopBlock = (type: BlockKind, atPosition?: number) => {
    if (!day) return;
    startTransition(async () => {
      try {
        const created = await addBlockAction({
          dayId: day.id,
          type,
          title: "",
          duration: type === "NOTE" ? 0 : 15,
          ...(atPosition !== undefined ? { position: atPosition } : {}),
        });
        setBlocks((prev) => {
          const m = new Map(prev);
          m.set(created.id, toBlockData(created as ServerBlock));
          return m;
        });
        setBuckets((prev) => {
          const m = new Map(prev);
          const top = [...(m.get(TOP_BUCKET) ?? [])];
          if (atPosition !== undefined && atPosition <= top.length) {
            top.splice(atPosition, 0, created.id);
          } else {
            top.push(created.id);
          }
          m.set(TOP_BUCKET, top);
          return m;
        });
      } catch (err) {
        toast.error("Konnte Block nicht hinzufügen");
        console.error(err);
      }
    });
  };

  const handleAddChildBlock = (
    parentId: string,
    type: "BLOCK" | "NOTE",
    column = 0
  ) => {
    if (!day) return;
    startTransition(async () => {
      try {
        const created = await addBlockAction({
          dayId: day.id,
          type,
          title: "",
          duration: type === "NOTE" ? 0 : 15,
          parentBlockId: parentId,
          column,
        });
        setBlocks((prev) => {
          const m = new Map(prev);
          m.set(created.id, toBlockData(created as ServerBlock));
          return m;
        });
        setBuckets((prev) => {
          const m = new Map(prev);
          const k = bucketKey(parentId, column);
          const list = [...(m.get(k) ?? []), created.id];
          m.set(k, list);
          return m;
        });
      } catch (err) {
        toast.error("Konnte Block nicht hinzufügen");
        console.error(err);
      }
    });
  };

  const handleInsertChildAt = (
    parentId: string,
    type: "BLOCK" | "NOTE",
    column: number,
    position: number
  ) => {
    if (!day) return;
    startTransition(async () => {
      try {
        const created = await addBlockAction({
          dayId: day.id,
          type,
          title: "",
          duration: type === "NOTE" ? 0 : 15,
          parentBlockId: parentId,
          column,
          position,
        });
        setBlocks((prev) => {
          const m = new Map(prev);
          m.set(created.id, toBlockData(created as ServerBlock));
          return m;
        });
        setBuckets((prev) => {
          const m = new Map(prev);
          const k = bucketKey(parentId, column);
          const list = [...(m.get(k) ?? [])];
          list.splice(position, 0, created.id);
          m.set(k, list);
          return m;
        });
      } catch (err) {
        toast.error("Konnte Block nicht hinzufügen");
        console.error(err);
      }
    });
  };

  const handleDeleteWorkshop = () => {
    if (!confirm(`Session "${workshop.title}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteWorkshopAction(workshop.id);
      } catch (err) {
        if (isRedirectError(err)) throw err;
        toast.error("Konnte Session nicht löschen");
        console.error(err);
      }
    });
  };

  const activeBlock = activeId ? blocks.get(activeId) : null;
  const activeIdx = activeId ? topOrderedIds.indexOf(activeId) : -1;
  const activeRecalc = activeIdx >= 0 ? recalced[activeIdx] : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <WorkshopHeader
        workshopId={workshop.id}
        title={workshop.title}
        clientName={workshop.clientName}
        tags={workshop.tags}
        startDate={workshop.startDate}
        startTime={startTime}
        endTime={endTime}
        totalDuration={totalMin}
        blockCount={topBlocks.length}
        dayId={day?.id ?? ""}
      />

      <div className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={topOrderedIds} strategy={verticalListSortingStrategy}>
            {topBlocks.length === 0 ? (
              <EmptyTimeline />
            ) : (
              <div className="space-y-0.5">
                {topBlocks.map((block, idx) => {
                  const computed = recalced[idx];
                  const startTimeForBlock = computed?.computedStartTime ?? startTime;
                  const endTimeForBlock = computed?.computedEndTime ?? startTime;
                  const isActive = activeId === block.id;
                  let blockNode: React.ReactNode;
                  if (block.type === "GROUP") {
                    const children = childrenForBucket(block.id, 0);
                    blockNode = (
                      <BlockGroup
                        block={block}
                        children={children}
                        computedStartTime={startTimeForBlock}
                        computedEndTime={endTimeForBlock}
                        isActiveDrag={isActive}
                        ctx={ctx}
                        onAddChild={handleAddChildBlock}
                        onInsertChildAt={handleInsertChildAt}
                      />
                    );
                  } else if (block.type === "BREAKOUT") {
                    const allChildren: BlockData[] = [];
                    for (const [k, ids] of buckets.entries()) {
                      const parsed = parseBucketKey(k);
                      if (parsed.parentId === block.id) {
                        for (const id of ids) {
                          const b = blocks.get(id);
                          if (b) allChildren.push(b);
                        }
                      }
                    }
                    blockNode = (
                      <BlockBreakout
                        block={block}
                        children={allChildren}
                        computedStartTime={startTimeForBlock}
                        computedEndTime={endTimeForBlock}
                        isActiveDrag={isActive}
                        ctx={ctx}
                        onAddChild={handleAddChildBlock}
                        onInsertChildAt={handleInsertChildAt}
                      />
                    );
                  } else {
                    blockNode = (
                      <BlockCard
                        block={block}
                        computedStartTime={startTimeForBlock}
                        computedEndTime={endTimeForBlock}
                        isActiveDrag={isActive}
                        ctx={ctx}
                      />
                    );
                  }
                  return (
                    <div key={block.id} className="space-y-0.5">
                      <InsertGap
                        onSelect={(type) => handleAddTopBlock(type, idx)}
                      />
                      {blockNode}
                    </div>
                  );
                })}
                <InsertGap onSelect={(type) => handleAddTopBlock(type)} />
              </div>
            )}
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              duration: 220,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {activeBlock ? (
              activeBlock.type === "GROUP" ? (
                <BlockGroupGhost
                  block={activeBlock}
                  children={childrenForBucket(activeBlock.id, 0)}
                  computedStartTime={activeRecalc?.computedStartTime ?? startTime}
                  computedEndTime={activeRecalc?.computedEndTime ?? startTime}
                  ctx={ctx}
                />
              ) : activeBlock.type === "BREAKOUT" ? (
                (() => {
                  const allChildren: BlockData[] = [];
                  for (const [k, ids] of buckets.entries()) {
                    const parsed = parseBucketKey(k);
                    if (parsed.parentId === activeBlock.id) {
                      for (const id of ids) {
                        const b = blocks.get(id);
                        if (b) allChildren.push(b);
                      }
                    }
                  }
                  return (
                    <BlockBreakoutGhost
                      block={activeBlock}
                      children={allChildren}
                      computedStartTime={activeRecalc?.computedStartTime ?? startTime}
                      computedEndTime={activeRecalc?.computedEndTime ?? startTime}
                      ctx={ctx}
                    />
                  );
                })()
              ) : (
                <BlockCardGhost
                  block={activeBlock}
                  computedStartTime={activeRecalc?.computedStartTime ?? startTime}
                  computedEndTime={activeRecalc?.computedEndTime ?? startTime}
                  ctx={ctx}
                />
              )
            ) : null}
          </DragOverlay>
        </DndContext>

        <AddBlockMenu variant="ghost" onSelect={handleAddTopBlock} />
      </div>

      <div className="flex justify-end pt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteWorkshop}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Session löschen
        </Button>
      </div>

      {(() => {
        const sel = selectedBlockId ? blocks.get(selectedBlockId) : null;
        const recalcIdx = sel
          ? topOrderedIds.indexOf(sel.id)
          : -1;
        const computed = recalcIdx >= 0 ? recalced[recalcIdx] : undefined;
        const cat = sel?.categoryId
          ? categories.find((c) => c.id === sel.categoryId)
          : null;
        return (
          <BlockDetailPanel
            open={Boolean(selectedBlockId)}
            onOpenChange={(o) => {
              if (!o) setSelectedBlockId(null);
            }}
            block={
              sel
                ? {
                    ...sel,
                    tasks: sel.tasks,
                    materials: sel.materials,
                    assignedTo: sel.assignedTo,
                  }
                : null
            }
            workshopId={workshop.id}
            workshopTitle={workshop.title}
            users={users}
            categoryName={cat?.name ?? null}
            categoryColor={cat?.color ?? null}
            computedStartTime={computed?.computedStartTime ?? startTime}
            computedEndTime={computed?.computedEndTime ?? startTime}
            onUpdate={(id, patch) => updateBlockLocal(id, patch)}
          />
        );
      })()}
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div className="glass-card rounded-2xl p-10 text-center">
      <p className="text-sm text-muted-foreground">
        Noch keine Blöcke. Lege deinen ersten Block an, um die Timeline zu
        starten.
      </p>
      <p className="mt-2 text-xs text-muted-foreground/70">
        <strong className="text-foreground/80">Block</strong> = Aktivität ·
        <strong className="text-foreground/80"> Gruppe</strong> = Phase mit Sub-Blöcken ·
        <strong className="text-foreground/80"> Breakout</strong> = parallele Tracks ·
        <strong className="text-foreground/80"> Notiz</strong> = Trainer-Hinweis
      </p>
    </div>
  );
}

function useSyncFromServer(
  initialBlocks: Map<string, BlockData>,
  initialBuckets: Map<string, string[]>,
  setBlocks: (m: Map<string, BlockData>) => void,
  setBuckets: (m: Map<string, string[]>) => void
) {
  const lastKey = useRef<string>("");
  useEffect(() => {
    const arr = Array.from(initialBlocks.values()).sort(
      (a, b) => a.position - b.position
    );
    const key = arr
      .map(
        (b) =>
          `${b.id}:${b.position}:${b.column}:${b.parentBlockId ?? ""}:${b.duration}:${b.locked}:${b.title}`
      )
      .join("|");
    if (key !== lastKey.current) {
      lastKey.current = key;
      setBlocks(new Map(initialBlocks));
      setBuckets(new Map(initialBuckets));
    }
  }, [initialBlocks, initialBuckets, setBlocks, setBuckets]);
}
