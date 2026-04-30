"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ExternalLink,
  Link2,
  MoreVertical,
  Pencil,
  Plus,
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
  createMaterialAction,
  deleteMaterialAction,
  updateMaterialAction,
} from "@/actions/material";
import { detectLinkKind, safeHost } from "@/lib/link-icon";

export type WorkshopLink = {
  id: string;
  name: string;
  url: string;
  notes: string | null;
};

export function WorkshopLinks({
  workshopId,
  links,
}: {
  workshopId: string;
  links: WorkshopLink[];
}) {
  const [editing, setEditing] = useState<WorkshopLink | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="glass-card space-y-3 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
            Tools & Links
          </h3>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {links.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Link hinzufügen
        </button>
      </div>

      {links.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Noch keine Tools verlinkt. Hinterlege z.B. das Miro-Board oder die
          Figma-Slides für diese Session.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {links.map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              onEdit={() => setEditing(link)}
            />
          ))}
        </ul>
      )}

      <LinkDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        workshopId={workshopId}
        link={null}
      />
      <LinkDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        workshopId={workshopId}
        link={editing}
      />
    </div>
  );
}

function LinkRow({
  link,
  onEdit,
}: {
  link: WorkshopLink;
  onEdit: () => void;
}) {
  const meta = detectLinkKind(link.url);
  const host = safeHost(link.url) ?? link.url;
  const [, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Link "${link.name}" entfernen?`)) return;
    startTransition(async () => {
      try {
        await deleteMaterialAction(link.id);
        toast.success("Link entfernt");
      } catch (e) {
        toast.error("Konnte Link nicht entfernen");
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
        href={link.url}
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
              {link.name}
            </span>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-[var(--neon-violet)]" />
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {meta.label} · {host}
          </div>
          {link.notes ? (
            <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/80">
              {link.notes}
            </div>
          ) : null}
        </div>
      </a>
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-accent/60 hover:text-foreground group-hover:opacity-100 data-[popup-open]:bg-accent/60 data-[popup-open]:text-foreground data-[popup-open]:opacity-100"
          aria-label="Link-Aktionen"
        >
          <MoreVertical className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4} className="w-40">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 size-3.5" />
            Bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-3.5" />
            Entfernen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function LinkDialog({
  open,
  onOpenChange,
  workshopId,
  link,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshopId: string;
  link: WorkshopLink | null;
}) {
  const [name, setName] = useState(link?.name ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [notes, setNotes] = useState(link?.notes ?? "");
  const [, startTransition] = useTransition();

  // Sync local form state with the link prop whenever the dialog opens — covers
  // both "add" (link=null → empty) and "edit" (link=row → prefill).
  useEffect(() => {
    if (open) {
      setName(link?.name ?? "");
      setUrl(link?.url ?? "");
      setNotes(link?.notes ?? "");
    }
  }, [open, link]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name ist Pflicht");
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      toast.error("Ungültige URL");
      return;
    }
    startTransition(async () => {
      try {
        if (link) {
          await updateMaterialAction({
            id: link.id,
            name: trimmedName,
            url: trimmedUrl,
            notes: notes.trim() || null,
          });
          toast.success("Link aktualisiert");
        } else {
          await createMaterialAction({
            workshopId,
            blockId: null,
            name: trimmedName,
            url: trimmedUrl,
            notes: notes.trim() || null,
          });
          toast.success("Link hinzugefügt");
        }
        handleClose();
      } catch (e) {
        toast.error(link ? "Konnte Link nicht aktualisieren" : "Konnte Link nicht hinzufügen");
        console.error(e);
      }
    });
  };

  // Update local state when re-opening with a new link.
  // Cheap approach: derive from link prop when dialog opens.
  // Use uncontrolled defaultValue would also work but we need controlled inputs for live preview.
  const meta = url.trim() ? detectLinkKind(url.trim()) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-[var(--neon-violet)]" />
            {link ? "Link bearbeiten" : "Link hinzufügen"}
          </DialogTitle>
          <DialogDescription>
            Verlinke Tools wie Miro, Figma, Google Slides oder Notion direkt
            mit der Session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Workshop-Miro-Board"
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
                Erkannt als <span className="font-medium text-foreground/80">{meta.label}</span>
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
              placeholder="Wozu wird der Link gebraucht?"
              rows={2}
              className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            <X className="size-4" />
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
          >
            <Link2 className="size-4" />
            {link ? "Speichern" : "Hinzufügen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
