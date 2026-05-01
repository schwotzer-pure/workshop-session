"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Copy,
  Eye,
  Link2,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  shareWorkshopAction,
  unshareWorkshopAction,
} from "@/actions/share";
import {
  createShareLinkAction,
  deleteShareLinkAction,
  revokeShareLinkAction,
} from "@/actions/share-link";
import type { AppUserListItem, ShareLinkItem } from "@/lib/queries";

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

type Tab = "internal" | "link";

export function ShareWorkshopButton({
  workshopId,
  ownerName,
  allUsers,
  currentUserId,
  initialShares,
  initialShareLinks,
}: {
  workshopId: string;
  ownerName: string;
  allUsers: AppUserListItem[];
  currentUserId: string;
  initialShares: ShareEntry[];
  initialShareLinks?: ShareLinkItem[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("internal");

  const [shares, setShares] = useState<ShareEntry[]>(initialShares);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const [shareLinks, setShareLinks] = useState<ShareLinkItem[]>(
    initialShareLinks ?? []
  );

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

  const linkCount = shareLinks.filter((l) => !l.revokedAt).length;
  const totalCount = shares.length + linkCount;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
      >
        <Users className="size-4" />
        Teilen
        {totalCount > 0 ? (
          <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
            {totalCount}
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-4 text-[var(--neon-violet)]" />
              Workshop teilen
            </DialogTitle>
            <DialogDescription>
              Owner bleibt {ownerName}.
            </DialogDescription>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="inline-flex w-full items-center gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
            <TabBtn
              active={tab === "internal"}
              onClick={() => setTab("internal")}
              icon={Users}
            >
              Mit Trainer:innen
              {shares.length > 0 ? (
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {shares.length}
                </span>
              ) : null}
            </TabBtn>
            <TabBtn
              active={tab === "link"}
              onClick={() => setTab("link")}
              icon={Link2}
            >
              Externer Link
              {linkCount > 0 ? (
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {linkCount}
                </span>
              ) : null}
            </TabBtn>
          </div>

          {tab === "internal" ? (
            <InternalTab
              shares={shares}
              candidates={candidates}
              query={query}
              onQueryChange={setQuery}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ) : (
            <LinkTab
              workshopId={workshopId}
              links={shareLinks}
              onLinksChange={setShareLinks}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}

// ─────────────── Internal Tab (existing functionality) ───────────────

function InternalTab({
  shares,
  candidates,
  query,
  onQueryChange,
  onAdd,
  onRemove,
}: {
  shares: ShareEntry[];
  candidates: AppUserListItem[];
  query: string;
  onQueryChange: (v: string) => void;
  onAdd: (user: AppUserListItem) => void;
  onRemove: (userId: string) => void;
}) {
  return (
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
                  <div className="text-sm font-medium">{s.user.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    @{s.user.username}
                    {s.canEdit ? " · darf bearbeiten" : " · liest nur"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(s.user.id)}
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
            onChange={(e) => onQueryChange(e.target.value)}
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
                  onClick={() => onAdd(u)}
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
  );
}

// ─────────────── External Link Tab ───────────────

function LinkTab({
  workshopId,
  links,
  onLinksChange,
}: {
  workshopId: string;
  links: ShareLinkItem[];
  onLinksChange: (links: ShareLinkItem[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const created = await createShareLinkAction({
          workshopId,
          label: label.trim() || null,
          email: email.trim() || null,
        });
        onLinksChange([
          {
            id: created.id,
            token: created.token,
            label: created.label,
            email: created.email,
            createdAt: new Date(created.createdAt),
            expiresAt: created.expiresAt ? new Date(created.expiresAt) : null,
            revokedAt: null,
            viewCount: created.viewCount,
            lastViewAt: created.lastViewAt ? new Date(created.lastViewAt) : null,
            createdBy: { id: "", name: "Du" },
          },
          ...links,
        ]);
        setLabel("");
        setEmail("");
        toast.success("Link erstellt");
      } catch (e) {
        toast.error("Konnte Link nicht erstellen");
        console.error(e);
      }
    });
  };

  const handleRevoke = (linkId: string) => {
    const original = links;
    onLinksChange(
      links.map((l) =>
        l.id === linkId ? { ...l, revokedAt: new Date() } : l
      )
    );
    startTransition(async () => {
      try {
        await revokeShareLinkAction(linkId);
        toast.success("Link widerrufen");
      } catch (e) {
        onLinksChange(original);
        toast.error("Konnte nicht widerrufen");
        console.error(e);
      }
    });
  };

  const handleDelete = (linkId: string) => {
    const original = links;
    onLinksChange(links.filter((l) => l.id !== linkId));
    startTransition(async () => {
      try {
        await deleteShareLinkAction(linkId);
        toast.success("Link gelöscht");
      } catch (e) {
        onLinksChange(original);
        toast.error("Konnte nicht löschen");
        console.error(e);
      }
    });
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link in Zwischenablage kopiert"),
      () => toast.error("Konnte nicht kopieren")
    );
  };

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-dashed border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.04] px-3 py-2 text-[11px] text-muted-foreground">
        <Eye className="mr-1 inline size-3 text-[var(--neon-violet)]" />
        Externe Personen können den Workshop nur ansehen — Trainer-Notizen
        bleiben verborgen. Kein Login nötig.
      </p>

      {/* Create new */}
      <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Neuen Link erstellen
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Bezeichnung (z.B. Pure AG)"
            className="h-9"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail (optional)"
            className="h-9"
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleCreate}
          disabled={pending}
          className="w-full bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white hover:opacity-95"
        >
          <Plus className="size-3.5" />
          Link erstellen
        </Button>
      </div>

      {/* Existing links */}
      {links.length > 0 ? (
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Aktive Links
          </label>
          <ul className="space-y-1.5">
            {links.map((l) => (
              <LinkRow
                key={l.id}
                link={l}
                onCopy={() => copyLink(l.token)}
                onRevoke={() => handleRevoke(l.id)}
                onDelete={() => handleDelete(l.id)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function LinkRow({
  link,
  onCopy,
  onRevoke,
  onDelete,
}: {
  link: ShareLinkItem;
  onCopy: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}) {
  const isRevoked = !!link.revokedAt;
  const isExpired = !!(link.expiresAt && new Date(link.expiresAt).getTime() < Date.now());
  const isInactive = isRevoked || isExpired;

  return (
    <li
      className={cn(
        "group rounded-xl border border-border/60 bg-background/40 px-3 py-2",
        isInactive && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2">
        <Link2 className="mt-0.5 size-4 shrink-0 text-[var(--neon-violet)]" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            {link.label || "Ohne Bezeichnung"}
            {isRevoked ? (
              <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                widerrufen
              </span>
            ) : isExpired ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                abgelaufen
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {link.email ? `${link.email} · ` : ""}
            {link.viewCount > 0
              ? `${link.viewCount} Aufruf${link.viewCount === 1 ? "" : "e"}`
              : "Noch nicht aufgerufen"}
            {link.lastViewAt ? ` · zuletzt ${formatRelative(link.lastViewAt)}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {!isInactive ? (
            <>
              <button
                type="button"
                onClick={onCopy}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                title="Link kopieren"
              >
                <Copy className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onRevoke}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                title="Widerrufen"
              >
                <Eye className="size-3.5" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
            title="Endgültig löschen"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}

function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `vor ${days} Tagen`;
  return d.toLocaleDateString("de-CH");
}
