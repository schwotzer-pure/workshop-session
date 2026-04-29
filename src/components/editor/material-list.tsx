"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createMaterialAction,
  updateMaterialAction,
  deleteMaterialAction,
} from "@/actions/material";

export type MaterialItem = {
  id: string;
  name: string;
  quantity: number | null;
  notes: string | null;
};

export function MaterialList({
  workshopId,
  blockId,
  items,
  onChange,
}: {
  workshopId: string;
  blockId: string;
  items: MaterialItem[];
  onChange: (items: MaterialItem[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
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

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const qty = newQty ? Number(newQty) : null;
    setNewName("");
    setNewQty("");
    persist(async () => {
      const created = await createMaterialAction({
        workshopId,
        blockId,
        name,
        quantity: qty && !Number.isNaN(qty) && qty > 0 ? qty : null,
      });
      onChange([
        ...items,
        {
          id: created.id,
          name: created.name,
          quantity: created.quantity,
          notes: created.notes,
        },
      ]);
    });
  };

  const handleEdit = (id: string, patch: Partial<MaterialItem>) => {
    onChange(items.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const handleEditBlur = (id: string, patch: Partial<MaterialItem>) => {
    persist(() => updateMaterialAction({ id, ...patch }));
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((m) => m.id !== id));
    persist(() => deleteMaterialAction(id));
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background/30 px-3 py-4 text-xs text-muted-foreground">
          <Package className="size-3.5" />
          Noch keine Materialien — leg los unten.
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((m) => (
            <div
              key={m.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/40"
            >
              <Package className="size-3.5 shrink-0 text-muted-foreground/60" />
              <input
                type="text"
                value={m.name}
                onChange={(e) => handleEdit(m.id, { name: e.target.value })}
                onBlur={(e) => handleEditBlur(m.id, { name: e.target.value })}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <input
                type="number"
                min={1}
                value={m.quantity ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  handleEdit(m.id, {
                    quantity: v === "" ? null : Number(v),
                  });
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  handleEditBlur(m.id, {
                    quantity: v === "" ? null : Number(v),
                  });
                }}
                placeholder="Anzahl"
                className="w-16 shrink-0 rounded-md border border-border/40 bg-background/40 px-2 py-0.5 text-right text-xs tabular-nums outline-none focus:border-[var(--neon-violet)]/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className="size-6 shrink-0 rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label="Material löschen"
              >
                <Trash2 className="mx-auto size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t border-border/60 pt-3">
        <Input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Material …"
          className="h-9 flex-1"
        />
        <Input
          type="number"
          min={1}
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Anz."
          className="h-9 w-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim()}
          size="sm"
          className="shrink-0"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
