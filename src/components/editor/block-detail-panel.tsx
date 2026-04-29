"use client";

import { useEffect, useState, useTransition } from "react";
import {
  FileText,
  ListChecks,
  Package,
  Users,
  Lock,
  Unlock,
  Layers,
  Columns3,
  StickyNote,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  updateBlockAction,
  toggleBlockLockAction,
} from "@/actions/block";
import { cn } from "@/lib/utils";
import type { AppUserListItem } from "@/lib/queries";
import type { BlockData } from "./types";
import { PersonPicker } from "./person-picker";
import { TaskList, type TaskItem } from "./task-list";
import { MaterialList, type MaterialItem } from "./material-list";

const TYPE_LABEL = {
  BLOCK: { label: "Block", Icon: Square },
  GROUP: { label: "Gruppe", Icon: Layers },
  BREAKOUT: { label: "Breakout", Icon: Columns3 },
  NOTE: { label: "Notiz", Icon: StickyNote },
} as const;

export type BlockDetailData = BlockData & {
  tasks: TaskItem[];
  materials: MaterialItem[];
  assignedTo: AppUserListItem | null;
};

export function BlockDetailPanel({
  open,
  onOpenChange,
  block,
  workshopId,
  workshopTitle,
  users,
  categoryName,
  categoryColor,
  computedStartTime,
  computedEndTime,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: BlockDetailData | null;
  workshopId: string;
  workshopTitle: string;
  users: AppUserListItem[];
  categoryName: string | null;
  categoryColor: string | null;
  computedStartTime: string;
  computedEndTime: string;
  onUpdate: (id: string, patch: Partial<BlockDetailData>) => void;
}) {
  const [tab, setTab] = useState<"overview" | "tasks" | "materials" | "people">(
    "overview"
  );
  const [, startTransition] = useTransition();

  // Local-edit state for description / notes — kept in sync with prop changes
  const [titleValue, setTitleValue] = useState(block?.title ?? "");
  const [descValue, setDescValue] = useState(block?.description ?? "");
  const [notesValue, setNotesValue] = useState(block?.notes ?? "");

  useEffect(() => {
    setTitleValue(block?.title ?? "");
    setDescValue(block?.description ?? "");
    setNotesValue(block?.notes ?? "");
    setTab("overview");
  }, [block?.id]);

  if (!block) return null;

  const { Icon, label } = TYPE_LABEL[block.type];

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
    onUpdate(block.id, { locked: !block.locked });
    persist(() => toggleBlockLockAction(block.id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-md md:max-w-lg"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Icon className="size-3.5 text-[var(--neon-violet)]" />
            {label}
            {categoryName ? (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-sm"
                    style={{
                      background: categoryColor ?? "transparent",
                    }}
                  />
                  {categoryName}
                </span>
              </>
            ) : null}
          </div>
          <SheetTitle className="text-lg">
            <input
              type="text"
              value={titleValue}
              onChange={(e) => {
                setTitleValue(e.target.value);
                onUpdate(block.id, { title: e.target.value });
              }}
              onBlur={() => {
                if (titleValue !== block.title) {
                  persist(() =>
                    updateBlockAction({ id: block.id, title: titleValue })
                  );
                }
              }}
              placeholder="Block-Titel …"
              className="w-full bg-transparent font-medium outline-none placeholder:text-muted-foreground/40"
            />
          </SheetTitle>
          <SheetDescription className="flex items-center gap-3 text-xs tabular-nums">
            <button
              type="button"
              onClick={toggleLock}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors",
                block.locked
                  ? "text-[var(--neon-violet)] hover:bg-[var(--neon-violet)]/10"
                  : "hover:bg-accent/60"
              )}
              title={block.locked ? "Zeit entsperren" : "Zeit fixieren"}
            >
              {block.locked ? (
                <Lock className="size-3" />
              ) : (
                <Unlock className="size-3 opacity-60" />
              )}
              {computedStartTime}–{computedEndTime}
            </button>
            <span className="text-muted-foreground/40">·</span>
            <span>{block.duration} Minuten</span>
          </SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">
              <FileText className="mr-1.5 size-3.5" />
              Details
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">
              <ListChecks className="mr-1.5 size-3.5" />
              Aufgaben
              {block.tasks.length > 0 ? (
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                  {block.tasks.filter((t) => !t.done).length}/
                  {block.tasks.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="materials" className="text-xs">
              <Package className="mr-1.5 size-3.5" />
              Material
              {block.materials.length > 0 ? (
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                  {block.materials.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="people" className="text-xs">
              <Users className="mr-1.5 size-3.5" />
              Personen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 px-6 py-4">
            <Field label="Beschreibung">
              <textarea
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={() => {
                  if (descValue !== (block.description ?? "")) {
                    persist(() =>
                      updateBlockAction({
                        id: block.id,
                        description: descValue.trim() || null,
                      })
                    );
                  }
                }}
                placeholder="Was passiert in diesem Block? Welche Anleitung, Talking Points, Übergänge?"
                rows={5}
                className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
              />
            </Field>

            <Field
              label="Trainer-Notiz"
              hint="Nur im Editor und im Live-Cockpit sichtbar — nicht auf der Beamer-Ansicht."
            >
              <textarea
                value={notesValue}
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
                placeholder="Hinweise nur für dich, z.B. Erinnerungen, Übergänge, Co-Trainer-Briefing"
                rows={4}
                className="w-full resize-y rounded-lg border border-dashed border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.04] px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/60"
              />
            </Field>
          </TabsContent>

          <TabsContent value="tasks" className="px-6 py-4">
            <p className="mb-4 text-xs text-muted-foreground">
              Vorbereitungs-Aufgaben für diesen Block. Beim Workshop abhaken.
            </p>
            <TaskList
              blockId={block.id}
              tasks={block.tasks}
              onChange={(tasks) => onUpdate(block.id, { tasks })}
            />
          </TabsContent>

          <TabsContent value="materials" className="px-6 py-4">
            <p className="mb-4 text-xs text-muted-foreground">
              Material das du für diesen Block brauchst — in der Workshop-Übersicht
              wird alles aggregiert.
            </p>
            <MaterialList
              workshopId={workshopId}
              blockId={block.id}
              items={block.materials}
              onChange={(materials) => onUpdate(block.id, { materials })}
            />
          </TabsContent>

          <TabsContent value="people" className="space-y-4 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Wer aus dem Trainer-Team führt diesen Block durch?
            </p>
            <PersonPicker
              blockId={block.id}
              users={users}
              value={block.assignedTo}
              onChange={(user) =>
                onUpdate(block.id, {
                  assignedTo: user,
                  assignedToId: user?.id ?? null,
                })
              }
            />
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Workshop: <span className="font-medium">{workshopTitle}</span>
            </p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-[11px] text-muted-foreground/70">{hint}</p>
      ) : null}
    </div>
  );
}
