"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  MessageSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/components/ui/dialog";
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
import { CommentList, type CommentItem } from "./comment-list";

const TYPE_LABEL = {
  BLOCK: { label: "Block", Icon: Square },
  GROUP: { label: "Gruppe", Icon: Layers },
  BREAKOUT: { label: "Breakout", Icon: Columns3 },
  NOTE: { label: "Notiz", Icon: StickyNote },
} as const;

export type BlockDetailData = BlockData & {
  tasks: TaskItem[];
  materials: MaterialItem[];
  comments: CommentItem[];
  assignedTo: AppUserListItem | null;
};

type TabKey = "overview" | "tasks" | "materials" | "people" | "comments";

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
  currentUserId,
  isAdmin,
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
  currentUserId: string;
  isAdmin: boolean;
  onUpdate: (id: string, patch: Partial<BlockDetailData>) => void;
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [, startTransition] = useTransition();

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

  const tabs: Array<{
    value: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    accent?: string;
  }> = [
    { value: "overview", label: "Details", icon: FileText },
    {
      value: "tasks",
      label: "Aufgaben",
      icon: ListChecks,
      count: block.tasks.length,
      accent: block.tasks.length > 0
        ? `${block.tasks.filter((t) => !t.done).length}/${block.tasks.length}`
        : undefined,
    },
    {
      value: "materials",
      label: "Material",
      icon: Package,
      count: block.materials.length,
    },
    { value: "people", label: "Personen", icon: Users },
    {
      value: "comments",
      label: "Kommentare",
      icon: MessageSquare,
      count: block.comments.length,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!flex !h-[90vh] !w-[95vw] !max-w-[1400px] !flex-col !gap-0 !overflow-hidden !p-0 sm:!max-w-[1400px]"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Icon className="size-3.5 text-[var(--neon-violet)]" />
              {label}
              {categoryName ? (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-sm"
                      style={{ background: categoryColor ?? "transparent" }}
                    />
                    {categoryName}
                  </span>
                </>
              ) : null}
            </div>
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
              className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40"
            />
            <div className="flex items-center gap-3 text-xs tabular-nums">
              <button
                type="button"
                onClick={toggleLock}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors",
                  block.locked
                    ? "text-[var(--neon-violet)] hover:bg-[var(--neon-violet)]/10"
                    : "text-muted-foreground hover:bg-accent/60"
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
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {block.duration} Minuten
              </span>
              <span className="text-muted-foreground/60">
                · {workshopTitle}
              </span>
            </div>
          </div>

          <DialogClose
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="size-4" />
          </DialogClose>
        </header>

        {/* Body: vertical tabs (md+) / horizontal pills (mobile) + content */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav
            className={cn(
              "shrink-0 border-border/60 bg-background/40",
              "flex gap-0.5 overflow-x-auto p-2 md:flex-col md:overflow-visible",
              "md:w-56 md:border-r md:p-4",
              "border-b md:border-b-0"
            )}
          >
            {tabs.map((t) => {
              const TabIcon = t.icon;
              const isActive = tab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "group inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    "md:w-full",
                    isActive
                      ? "bg-gradient-to-r from-[var(--neon-cyan)]/12 via-[var(--neon-violet)]/12 to-[var(--neon-pink)]/12 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <TabIcon
                    className={cn(
                      "size-4 transition-colors",
                      isActive
                        ? "text-[var(--neon-violet)]"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="flex-1">{t.label}</span>
                  {t.accent ? (
                    <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                      {t.accent}
                    </span>
                  ) : t.count && t.count > 0 ? (
                    <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                      {t.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-8 py-6">
              {tab === "overview" ? (
                <div className="space-y-5">
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
                      rows={6}
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
                      rows={5}
                      className="w-full resize-y rounded-lg border border-dashed border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.04] px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/60"
                    />
                  </Field>
                </div>
              ) : null}

              {tab === "tasks" ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Vorbereitungs-Aufgaben für diesen Block. Beim Workshop
                    abhaken.
                  </p>
                  <TaskList
                    blockId={block.id}
                    tasks={block.tasks}
                    onChange={(tasks) => onUpdate(block.id, { tasks })}
                  />
                </div>
              ) : null}

              {tab === "materials" ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Material das du für diesen Block brauchst — in der
                    Workshop-Übersicht wird alles aggregiert.
                  </p>
                  <MaterialList
                    workshopId={workshopId}
                    blockId={block.id}
                    items={block.materials}
                    onChange={(materials) =>
                      onUpdate(block.id, { materials })
                    }
                  />
                </div>
              ) : null}

              {tab === "people" ? (
                <div className="space-y-4">
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
                </div>
              ) : null}

              {tab === "comments" ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Diskussion zu diesem Block — sichtbar für alle
                    Trainer:innen mit Zugriff auf den Workshop.
                  </p>
                  <CommentList
                    workshopId={workshopId}
                    blockId={block.id}
                    comments={block.comments}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
