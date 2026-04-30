"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  ExternalLink,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  attachBoardToWorkshopAction,
  createBoardAction,
  detachBoardFromWorkshopAction,
  updateBoardAttachmentNotesAction,
} from "@/actions/board";
import { detectLinkKind, safeHost } from "@/lib/link-icon";
import { cn } from "@/lib/utils";
import type {
  MasterBoardItem,
  WorkshopBoardItem,
} from "@/lib/queries";

export function WorkshopBoards({
  workshopId,
  boards,
  masterBoards,
}: {
  workshopId: string;
  boards: WorkshopBoardItem[];
  masterBoards: MasterBoardItem[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<WorkshopBoardItem | null>(null);

  // boards already on this workshop — filter them out of the picker
  const attachedIds = new Set(boards.map((b) => b.id));
  const pickableMasters = masterBoards.filter((m) => !attachedIds.has(m.id));

  return (
    <div className="glass-card space-y-3 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
            Boards
          </h3>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {boards.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground">
            <Plus className="size-3.5" />
            Board hinzufügen
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-60">
            <DropdownMenuItem
              onClick={() => setPickerOpen(true)}
              disabled={pickableMasters.length === 0}
            >
              <Star className="mr-2 size-3.5" />
              <div className="flex flex-col">
                <span className="text-sm">Aus Master-Library</span>
                <span className="text-[11px] text-muted-foreground">
                  {pickableMasters.length} verfügbar
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-3.5" />
              <div className="flex flex-col">
                <span className="text-sm">Neues Board anlegen</span>
                <span className="text-[11px] text-muted-foreground">
                  Miro/Figma/Notion-URL
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {boards.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Noch keine Boards verknüpft. Hinterlege das Miro/Figma für diese
          Session — oder wähl ein Master-Board aus der Library.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {boards.map((b) => (
            <BoardRow
              key={b.id}
              workshopId={workshopId}
              board={b}
              onEditNotes={() => setEditing(b)}
            />
          ))}
        </ul>
      )}

      <MasterPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        workshopId={workshopId}
        masters={pickableMasters}
      />
      <CreateBoardForWorkshopDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workshopId={workshopId}
      />
      <EditAttachmentNotesDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        workshopId={workshopId}
        board={editing}
      />
    </div>
  );
}

function BoardRow({
  workshopId,
  board,
  onEditNotes,
}: {
  workshopId: string;
  board: WorkshopBoardItem;
  onEditNotes: () => void;
}) {
  const meta = detectLinkKind(board.url);
  const host = safeHost(board.url) ?? board.url;
  const [, startTransition] = useTransition();
  const displayNotes = board.workshopNotes ?? board.notes;

  const handleDetach = () => {
    if (!confirm(`Board „${board.title}" von dieser Session entfernen?`))
      return;
    startTransition(async () => {
      try {
        await detachBoardFromWorkshopAction(workshopId, board.id);
        toast.success("Board entfernt");
      } catch (e) {
        toast.error("Konnte nicht entfernen");
        console.error(e);
      }
    });
  };

  return (
    <li
      className="group relative flex items-start gap-2 rounded-xl border border-border/40 bg-background/40 p-3 transition-colors hover:border-border/80"
      style={{ borderLeft: `3px solid ${meta.accent}` }}
    >
      <a
        href={board.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-start gap-2.5"
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold uppercase"
          style={{
            backgroundColor: `${meta.accent}26`,
            color: meta.accent,
          }}
        >
          {meta.label.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">
              {board.title}
            </span>
            {board.isMaster ? (
              <Star className="size-3 shrink-0 fill-[var(--neon-violet)] text-[var(--neon-violet)]" />
            ) : null}
            <ExternalLink className="size-3 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-[var(--neon-violet)]" />
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {meta.label} · {host}
          </div>
          {displayNotes ? (
            <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/80">
              {displayNotes}
            </div>
          ) : null}
        </div>
      </a>
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-accent/60 hover:text-foreground group-hover:opacity-100 data-[popup-open]:bg-accent/60 data-[popup-open]:text-foreground data-[popup-open]:opacity-100"
          aria-label="Board-Aktionen"
        >
          <MoreVertical className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4} className="w-44">
          <DropdownMenuItem onClick={onEditNotes}>
            <Pencil className="mr-2 size-3.5" />
            Notiz bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDetach}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-3.5" />
            Aus Session entfernen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

// ────────────────── Master Picker ──────────────────

function MasterPickerDialog({
  open,
  onOpenChange,
  workshopId,
  masters,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workshopId: string;
  masters: MasterBoardItem[];
}) {
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = masters.filter((m) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.notes ?? "").toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handlePick = (boardId: string) => {
    startTransition(async () => {
      try {
        await attachBoardToWorkshopAction({ workshopId, boardId });
        toast.success("Board verknüpft");
        onOpenChange(false);
      } catch (e) {
        toast.error("Konnte nicht verknüpfen");
        console.error(e);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="size-4 fill-[var(--neon-violet)] text-[var(--neon-violet)]" />
            Master-Board verknüpfen
          </DialogTitle>
          <DialogDescription>
            Vorlagen aus der UNION-Library, die du dieser Session zuordnen
            kannst.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen …"
            className="h-9 pl-8"
          />
        </div>

        <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Keine passenden Master-Boards.
            </p>
          ) : (
            filtered.map((m) => {
              const meta = detectLinkKind(m.url);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handlePick(m.id)}
                  className="flex w-full items-start gap-2.5 rounded-lg border border-border/40 bg-background/40 p-2.5 text-left transition-colors hover:border-[var(--neon-violet)]/40 hover:bg-background/80"
                  style={{ borderLeft: `3px solid ${meta.accent}` }}
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold uppercase"
                    style={{
                      backgroundColor: `${meta.accent}26`,
                      color: meta.accent,
                    }}
                  >
                    {meta.label.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {m.title}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {meta.label}
                      {m.tags.length > 0 ? ` · ${m.tags.slice(0, 3).join(", ")}` : ""}
                    </div>
                    {m.notes ? (
                      <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/80">
                        {m.notes}
                      </div>
                    ) : null}
                  </div>
                  <Check className="mt-1 size-3.5 shrink-0 text-muted-foreground/30" />
                </button>
              );
            })
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────── Create new board (and attach) ──────────────────

function CreateBoardForWorkshopDialog({
  open,
  onOpenChange,
  workshopId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workshopId: string;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isMaster, setIsMaster] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setTitle("");
      setUrl("");
      setNotes("");
      setIsMaster(false);
    }
  }, [open]);

  const meta = url.trim() ? detectLinkKind(url.trim()) : null;

  const handleSubmit = () => {
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
    const detected = detectLinkKind(trimmedUrl);

    startTransition(async () => {
      try {
        await createBoardAction({
          title: trimmedTitle,
          url: trimmedUrl,
          kind: detected.kind === "generic" ? null : detected.kind,
          notes: notes.trim() || null,
          tags: [],
          isMaster,
          attachToWorkshopId: workshopId,
        });
        toast.success("Board verknüpft");
        onOpenChange(false);
      } catch (e) {
        toast.error("Konnte Board nicht erstellen");
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
            Neues Board für diese Session
          </DialogTitle>
          <DialogDescription>
            Wird sofort verknüpft. Markiere als Master, um es auch in anderen
            Sessions verfügbar zu machen.
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
              placeholder="z.B. Galliker Miro-Board"
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
          <button
            type="button"
            onClick={() => setIsMaster(!isMaster)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
              isMaster
                ? "border-[var(--neon-violet)]/40 bg-[var(--neon-violet)]/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            <Star
              className={cn(
                "size-3.5",
                isMaster && "fill-[var(--neon-violet)] text-[var(--neon-violet)]"
              )}
            />
            Auch als Master für andere Sessions verfügbar machen
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
            <Plus className="size-4" />
            Hinzufügen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────── Edit per-workshop notes ──────────────────

function EditAttachmentNotesDialog({
  open,
  onOpenChange,
  workshopId,
  board,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workshopId: string;
  board: WorkshopBoardItem | null;
}) {
  const [notes, setNotes] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (open && board) {
      setNotes(board.workshopNotes ?? "");
    }
  }, [open, board]);

  const handleSave = () => {
    if (!board) return;
    startTransition(async () => {
      try {
        await updateBoardAttachmentNotesAction({
          workshopId,
          boardId: board.id,
          notes: notes.trim() || null,
        });
        toast.success("Notiz aktualisiert");
        onOpenChange(false);
      } catch (e) {
        toast.error("Konnte nicht speichern");
        console.error(e);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4 text-[var(--neon-violet)]" />
            Notiz für diese Session
          </DialogTitle>
          <DialogDescription>
            Diese Notiz gilt nur für diese Session — die globale Board-Notiz
            bleibt unberührt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z.B. Verwende dieses Frame für Phase 2"
            rows={4}
            className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
          >
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
