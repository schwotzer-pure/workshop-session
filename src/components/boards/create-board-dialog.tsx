"use client";

import { useState, useTransition } from "react";
import { Layers, Plus, Star, X } from "lucide-react";
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
import { createBoardAction } from "@/actions/board";
import { detectLinkKind } from "@/lib/link-icon";
import { cn } from "@/lib/utils";

export function CreateBoardButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-95"
      >
        <Plus className="size-3.5" />
        Neues Board
      </button>
      <CreateBoardDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function CreateBoardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isMaster, setIsMaster] = useState(false);
  const [, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setUrl("");
    setNotes("");
    setTagsInput("");
    setIsMaster(false);
  };

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Titel ist Pflicht");
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      toast.error("Ungültige URL");
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    const meta = detectLinkKind(trimmedUrl);

    startTransition(async () => {
      try {
        await createBoardAction({
          title: trimmedTitle,
          url: trimmedUrl,
          kind: meta.kind === "generic" ? null : meta.kind,
          notes: notes.trim() || null,
          tags,
          isMaster,
        });
        toast.success(isMaster ? "Master-Board angelegt" : "Board angelegt");
        reset();
        onOpenChange(false);
      } catch (e) {
        toast.error("Konnte Board nicht erstellen");
        console.error(e);
      }
    });
  };

  const meta = url.trim() ? detectLinkKind(url.trim()) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-4 text-[var(--neon-violet)]" />
            Neues Board
          </DialogTitle>
          <DialogDescription>
            Verlinke ein Miro/Figma/Notion-Asset. Markiere als Master, um es als
            Vorlage in jeder Session verfügbar zu machen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Titel
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Strategie-Brainstorm-Board"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              URL
            </label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://miro.com/app/board/…"
              className="h-9"
            />
            {meta ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: meta.accent }}
                />
                Erkannt als{" "}
                <span className="font-medium text-foreground/80">
                  {meta.label}
                </span>
              </div>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notiz (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Wofür wird das Board genutzt?"
              rows={2}
              className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tags (kommagetrennt)
            </label>
            <Input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="z.B. Strategie, Onboarding, Brainstorming"
              className="h-9"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsMaster(!isMaster)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              isMaster
                ? "border-[var(--neon-violet)]/40 bg-[var(--neon-violet)]/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            <Star
              className={cn(
                "size-4",
                isMaster && "fill-[var(--neon-violet)] text-[var(--neon-violet)]"
              )}
            />
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">
                {isMaster ? "Als Master markieren" : "Als Master markieren"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Vorlage, die andere Trainer:innen einer Session zuweisen können
              </span>
            </div>
          </button>
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
            <Layers className="size-4" />
            Erstellen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
