"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Copy, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  archiveWorkshopAction,
  deleteWorkshopAction,
  duplicateWorkshopAction,
  unarchiveWorkshopAction,
} from "@/actions/workshop";
import { cn } from "@/lib/utils";
import { isRedirectError } from "@/lib/is-redirect";

export function WorkshopCardMenu({
  workshopId,
  title,
  isArchived,
  className,
}: {
  workshopId: string;
  title: string;
  isArchived: boolean;
  className?: string;
}) {
  const [, startTransition] = useTransition();

  const persist = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        if (isRedirectError(e)) throw e;
        toast.error("Aktion fehlgeschlagen");
        console.error(e);
      }
    });

  const handleDuplicate = () =>
    persist(() => duplicateWorkshopAction(workshopId));

  const handleArchive = () => persist(() => archiveWorkshopAction(workshopId));

  const handleUnarchive = () =>
    persist(() => unarchiveWorkshopAction(workshopId));

  const handleDelete = () => {
    if (!confirm(`Session "${title || "Unbenannt"}" endgültig löschen?`)) return;
    persist(() => deleteWorkshopAction(workshopId));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "pointer-events-auto flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-all",
          "opacity-0 hover:bg-accent/80 hover:text-foreground group-hover:opacity-100",
          "data-[popup-open]:opacity-100 data-[popup-open]:bg-accent/80 data-[popup-open]:text-foreground",
          className
        )}
        aria-label="Session-Aktionen"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-48">
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 size-3.5" />
          Duplizieren
        </DropdownMenuItem>
        {isArchived ? (
          <DropdownMenuItem onClick={handleUnarchive}>
            <ArchiveRestore className="mr-2 size-3.5" />
            Wiederherstellen
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="mr-2 size-3.5" />
            Archivieren
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-3.5" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
