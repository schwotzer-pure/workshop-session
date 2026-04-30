"use client";

import { useState, useTransition } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createMethodAction } from "@/actions/method";
import { METHOD_CATEGORIES } from "@/lib/method-categories";
import { cn } from "@/lib/utils";

export function CreateMethodButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-95"
      >
        <Plus className="size-3.5" />
        Neue Methode
      </button>
      <CreateMethodDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function CreateMethodDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [duration, setDuration] = useState("15");
  const [category, setCategory] = useState<string>(METHOD_CATEGORIES[0].key);
  const [tagsInput, setTagsInput] = useState("");
  const [, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setDescription("");
    setInstructions("");
    setDuration("15");
    setCategory(METHOD_CATEGORIES[0].key);
    setTagsInput("");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Titel ist Pflicht");
      return;
    }
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 1) {
      toast.error("Dauer muss mindestens 1 Minute sein");
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    startTransition(async () => {
      try {
        await createMethodAction({
          title: title.trim(),
          description: description.trim() || null,
          instructions: instructions.trim() || null,
          defaultDuration: durationNum,
          category,
          tags,
        });
        toast.success(
          "Methode eingereicht — wartet auf Bestätigung durch einen Admin"
        );
        reset();
        onOpenChange(false);
      } catch (e) {
        toast.error("Konnte Methode nicht erstellen");
        console.error(e);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--neon-violet)]" />
            Neue Methode anlegen
          </DialogTitle>
          <DialogDescription>
            Trag die Eckdaten ein. Für komplexere Methoden mit Gruppen oder
            Breakouts: bau einen Block in einer Session und reiche ihn über das
            3-Punkte-Menü ein.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Titel
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. 1-2-4-All"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Dauer (min)
              </label>
              <Input
                type="number"
                min={1}
                max={1440}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-9 w-24 text-right tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kategorie
            </label>
            <div className="flex flex-wrap gap-1.5">
              {METHOD_CATEGORIES.map((c) => {
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                      active
                        ? "font-semibold text-foreground"
                        : "border-border/60 font-medium text-muted-foreground hover:text-foreground"
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `${c.accent}80`,
                            borderColor: c.accent,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: c.accent }}
                    />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kurzbeschreibung (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was bewirkt die Methode? Wann ist sie sinnvoll?"
              rows={3}
              className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Anweisung / Ablauf (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Schritt-für-Schritt, wie die Methode durchgeführt wird"
              rows={5}
              className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tags (kommagetrennt, max. 10)
            </label>
            <Input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="z.B. Brainstorming, Visualisierung, Klein­gruppen"
              className="h-9"
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
          >
            <Sparkles className="size-4" />
            Einreichen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
