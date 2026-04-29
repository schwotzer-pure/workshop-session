"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Search,
  UserMinus,
  UserPlus,
  Users,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  shareWorkshopAction,
  unshareWorkshopAction,
} from "@/actions/share";
import type { AppUserListItem } from "@/lib/queries";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export type ShareEntry = {
  user: AppUserListItem;
  canEdit: boolean;
};

export function ShareWorkshopButton({
  workshopId,
  ownerName,
  allUsers,
  currentUserId,
  initialShares,
}: {
  workshopId: string;
  ownerName: string;
  allUsers: AppUserListItem[];
  currentUserId: string;
  initialShares: ShareEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<ShareEntry[]>(initialShares);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const sharedUserIds = useMemo(
    () => new Set(shares.map((s) => s.user.id)),
    [shares]
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (u.id === currentUserId) return false;
      if (sharedUserIds.has(u.id)) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [allUsers, sharedUserIds, currentUserId, query]);

  const handleAdd = (user: AppUserListItem) => {
    setShares((prev) => [...prev, { user, canEdit: true }]);
    setQuery("");
    startTransition(async () => {
      try {
        await shareWorkshopAction({
          workshopId,
          userId: user.id,
          canEdit: true,
        });
        toast.success(`Mit ${user.name} geteilt`);
      } catch (e) {
        setShares((prev) => prev.filter((s) => s.user.id !== user.id));
        toast.error("Konnte nicht teilen");
        console.error(e);
      }
    });
  };

  const handleRemove = (userId: string) => {
    const removed = shares.find((s) => s.user.id === userId);
    setShares((prev) => prev.filter((s) => s.user.id !== userId));
    startTransition(async () => {
      try {
        await unshareWorkshopAction({ workshopId, userId });
      } catch (e) {
        if (removed) setShares((prev) => [...prev, removed]);
        toast.error("Konnte Freigabe nicht entfernen");
        console.error(e);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
      >
        <Users className="size-4" />
        Teilen
        {shares.length > 0 ? (
          <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
            {shares.length}
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-4 text-[var(--neon-violet)]" />
              Workshop teilen
            </DialogTitle>
            <DialogDescription>
              Andere Trainer:innen können den Workshop sehen und bearbeiten.
              Owner bleibt {ownerName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {shares.length > 0 ? (
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Aktuell geteilt mit
                </label>
                <ul className="space-y-1">
                  {shares.map((s) => (
                    <li
                      key={s.user.id}
                      className="group flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-2 py-1.5"
                    >
                      <Avatar className="size-7 border border-border/70 bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]">
                        <AvatarFallback className="bg-transparent text-[10px] font-semibold text-white">
                          {initials(s.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">
                          {s.user.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          @{s.user.username}
                          {s.canEdit ? " · darf bearbeiten" : " · liest nur"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(s.user.id)}
                        className="size-6 shrink-0 rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label="Freigabe entfernen"
                      >
                        <UserMinus className="mx-auto size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Person hinzufügen
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, Benutzername oder E-Mail …"
                  className="h-9 pl-8"
                  autoFocus
                />
              </div>
              {candidates.length > 0 ? (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-1">
                  {candidates.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => handleAdd(u)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent/60"
                        )}
                      >
                        <Avatar className="size-6 border border-border/70 bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]">
                          <AvatarFallback className="bg-transparent text-[10px] font-semibold text-white">
                            {initials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            @{u.username}
                          </div>
                        </div>
                        <UserPlus className="size-3.5 text-muted-foreground/60" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query.trim() ? (
                <p className="rounded-lg border border-dashed border-border/60 bg-background/30 px-3 py-3 text-xs text-muted-foreground">
                  Keine Person gefunden.
                </p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
