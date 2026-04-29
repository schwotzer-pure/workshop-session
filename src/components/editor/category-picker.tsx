"use client";

import { useState, useTransition } from "react";
import { Check, Palette, Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createCategoryAction } from "@/actions/category";
import { COLOR_SUGGESTIONS } from "@/lib/category-colors";
import type { Category } from "@/lib/queries";

export function CategoryPicker({
  categories,
  value,
  onChange,
  onCategoryAdded,
  open: openProp,
  onOpenChange,
}: {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
  onCategoryAdded?: (cat: Category) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_SUGGESTIONS[0]);
  const [, startTransition] = useTransition();

  const current = categories.find((c) => c.id === value) ?? null;

  const submitCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const cat = await createCategoryAction({ name: name.trim(), color });
        onCategoryAdded?.(cat);
        setCreating(false);
        setName("");
        onChange(cat.id);
        setOpen(false);
      } catch (err) {
        toast.error("Konnte Kategorie nicht anlegen");
        console.error(err);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "group flex size-7 shrink-0 items-center justify-center rounded-md transition-all",
          current
            ? "ring-1 ring-border/70"
            : "text-muted-foreground/50 hover:bg-accent/60 hover:text-foreground"
        )}
        style={
          current
            ? {
                background: `color-mix(in oklch, ${current.color} 25%, transparent)`,
              }
            : undefined
        }
        title={current ? `Kategorie: ${current.name}` : "Kategorie zuweisen"}
      >
        {current ? (
          <span
            className="size-3 rounded-sm"
            style={{ background: current.color }}
          />
        ) : (
          <Palette className="size-3.5" />
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-72 rounded-xl border border-border/60 p-3"
        align="start"
      >
        {creating ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Neue Kategorie</span>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (z.B. Reflexion)"
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && submitCreate()}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {COLOR_SUGGESTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-6 rounded-md ring-1 transition-all",
                    color === c
                      ? "scale-110 ring-2 ring-[var(--neon-violet)]"
                      : "ring-border/50 hover:scale-105"
                  )}
                  style={{ background: c }}
                  aria-label={`Farbe ${c}`}
                />
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={submitCreate}
              disabled={!name.trim()}
              className="w-full"
            >
              Anlegen
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="px-1 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kategorie zuweisen
            </div>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/60",
                value === null && "bg-accent/40"
              )}
            >
              <span className="size-3.5 rounded-sm border border-dashed border-muted-foreground/40" />
              <span className="flex-1">Keine</span>
              {value === null ? (
                <Check className="size-3.5 text-[var(--neon-violet)]" />
              ) : null}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/60",
                  value === c.id && "bg-accent/40"
                )}
              >
                <span
                  className="size-3.5 rounded-sm"
                  style={{ background: c.color }}
                />
                <span className="flex-1">{c.name}</span>
                {value === c.id ? (
                  <Check className="size-3.5 text-[var(--neon-violet)]" />
                ) : null}
              </button>
            ))}
            <div className="my-1 border-t border-border/50" />
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Eigene Kategorie anlegen
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
