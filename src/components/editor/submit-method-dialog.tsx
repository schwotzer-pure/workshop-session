"use client";

import { useState, useTransition } from "react";
import { Sparkles, X } from "lucide-react";
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
import { submitBlockAsMethodAction } from "@/actions/method";
import { METHOD_CATEGORIES } from "@/lib/method-categories";
import { cn } from "@/lib/utils";

export function SubmitMethodDialog({
  open,
  onOpenChange,
  blockId,
  blockType,
  defaultTitle,
  defaultDescription,
  defaultInstructions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockId: string;
  blockType: "BLOCK" | "GROUP" | "BREAKOUT" | "NOTE";
  defaultTitle: string;
  defaultDescription: string | null;
  defaultInstructions: string | null;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription ?? "");
  const [instructions, setInstructions] = useState(defaultInstructions ?? "");
  const [category, setCategory] = useState<string>(METHOD_CATEGORIES[0].key);
  const [tagsInput, setTagsInput] = useState("");
  const [, startTransition] = useTransition();

  const isHierarchy = blockType === "GROUP" || blockType === "BREAKOUT";

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Titel ist Pflicht");
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    startTransition(async () => {
      try {
        await submitBlockAsMethodAction({
          blockId,
          title: title.trim(),
          description: description.trim() || null,
          instructions: instructions.trim() || null,
          category,
          tags,
        });
        toast.success(
          "Methode eingereicht — wartet auf Bestätigung durch einen Admin"
        );
        onOpenChange(false);
      } catch (e) {
        toast.error("Konnte Methode nicht einreichen");
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
            Block als Methode einreichen
          </DialogTitle>
          <DialogDescription>
            {isHierarchy
              ? "Die gesamte Block-Hierarchie wird gespeichert. Ein:e Admin prüft den Vorschlag — bei Bestätigung erscheint die Methode UNION-weit in der Bibliothek."
              : "Ein:e Admin prüft den Vorschlag — bei Bestätigung erscheint die Methode UNION-weit in der Bibliothek."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Titel der Methode
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
