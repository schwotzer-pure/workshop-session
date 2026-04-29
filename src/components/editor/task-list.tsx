"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/actions/task";

export type TaskItem = {
  id: string;
  text: string;
  done: boolean;
  position: number;
};

export function TaskList({
  blockId,
  tasks,
  onChange,
}: {
  blockId: string;
  tasks: TaskItem[];
  onChange: (tasks: TaskItem[]) => void;
}) {
  const [newText, setNewText] = useState("");
  const [, startTransition] = useTransition();

  const persist = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error("Speichern fehlgeschlagen");
        console.error(e);
      }
    });

  const sorted = [...tasks].sort((a, b) => a.position - b.position);
  const doneCount = sorted.filter((t) => t.done).length;

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    setNewText("");
    persist(async () => {
      const created = await createTaskAction({ blockId, text });
      onChange([
        ...tasks,
        {
          id: created.id,
          text: created.text,
          done: created.done,
          position: created.position,
        },
      ]);
    });
  };

  const handleToggle = (id: string, done: boolean) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, done } : t)));
    persist(() => updateTaskAction({ id, done }));
  };

  const handleEdit = (id: string, text: string) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const handleEditBlur = (id: string, text: string) => {
    persist(() => updateTaskAction({ id, text }));
  };

  const handleDelete = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
    persist(() => deleteTaskAction(id));
  };

  return (
    <div className="space-y-3">
      {sorted.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ListChecks className="size-3.5" />
          <span className="tabular-nums">
            {doneCount} / {sorted.length} erledigt
          </span>
          <div className="ml-auto h-1 flex-1 max-w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] transition-all"
              style={{
                width: `${sorted.length === 0 ? 0 : (doneCount / sorted.length) * 100}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        {sorted.map((t) => (
          <div
            key={t.id}
            className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/40"
          >
            <Checkbox
              checked={t.done}
              onCheckedChange={(c) => handleToggle(t.id, Boolean(c))}
              className="mt-1"
            />
            <input
              type="text"
              value={t.text}
              onChange={(e) => handleEdit(t.id, e.target.value)}
              onBlur={(e) => handleEditBlur(t.id, e.target.value)}
              className={cn(
                "min-w-0 flex-1 bg-transparent text-sm outline-none",
                t.done && "text-muted-foreground line-through"
              )}
            />
            <button
              type="button"
              onClick={() => handleDelete(t.id)}
              className="size-6 shrink-0 rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              aria-label="Aufgabe löschen"
            >
              <Trash2 className="mx-auto size-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t border-border/60 pt-3">
        <Input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Neue Aufgabe …"
          className="h-9"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!newText.trim()}
          size="sm"
          className="shrink-0"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
