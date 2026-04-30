"use client";

import { useEffect, useState, useTransition } from "react";
import { Layers, Save, X } from "lucide-react";
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
import { updateBoardAction } from "@/actions/board";
import type { BoardListItem } from "@/lib/queries";

export function EditBoardDialog({
  open,
  onOpenChange,
  board,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  board: BoardListItem | null;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (open && board) {
      setTitle(board.title);
      setUrl(board.url);
      setNotes(board.notes ?? "");
      setTagsInput(board.tags.join(", "));
    }
  }, [open, board]);

  const handleSubmit = () => {
    if (!board) return;
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
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

    startTransition(async () => {
      try {
        await updateBoardAction({
          id: board.id,
          title: trimmedTitle,
          url: trimmedUrl,
          notes: notes.trim() || null,
          tags,
        });
        toast.success("Board aktualisiert");
        onOpenChange(false);
      } catch (e) {
        toast.error("Konnte Board nicht aktualisieren");
        console.error(e);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-4 text-[var(--neon-violet)]" />
            Board bearbeiten
          </DialogTitle>
          <DialogDescription>
            Änderungen wirken sich auf alle Sessions aus, in denen dieses Board
            verlinkt ist.
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
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notiz
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            <Save className="size-4" />
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
