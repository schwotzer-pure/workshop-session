"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Check,
  ExternalLink,
  Layers,
  MoreVertical,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteBoardAction,
  toggleBoardMasterAction,
} from "@/actions/board";
import { detectLinkKind, safeHost, type LinkKind } from "@/lib/link-icon";
import { CreateBoardButton } from "./create-board-dialog";
import { EditBoardDialog } from "./edit-board-dialog";
import type { BoardListItem } from "@/lib/queries";

type Sort = "default" | "newest" | "most-used" | "alphabetical";
type Activity = "all" | "unused" | "few" | "many";

const KIND_FILTERS: Array<{ value: LinkKind; label: string }> = [
  { value: "miro", label: "Miro" },
  { value: "figma", label: "Figma" },
  { value: "notion", label: "Notion" },
  { value: "google-doc", label: "Google Doc" },
  { value: "google-slide", label: "Google Slides" },
  { value: "google-sheet", label: "Google Sheet" },
  { value: "loom", label: "Loom" },
  { value: "mural", label: "Mural" },
  { value: "menti", label: "Menti" },
];

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "default", label: "Master zuerst" },
  { value: "most-used", label: "Meist verwendet" },
  { value: "newest", label: "Neueste" },
  { value: "alphabetical", label: "A–Z" },
];

const ACTIVITY_BUCKETS: Array<{
  value: Activity;
  label: string;
  match: (count: number) => boolean;
}> = [
  { value: "all", label: "Alle", match: () => true },
  { value: "unused", label: "Noch nicht verwendet", match: (n) => n === 0 },
  { value: "few", label: "1–2 Sessions", match: (n) => n >= 1 && n <= 2 },
  { value: "many", label: "3+ Sessions", match: (n) => n >= 3 },
];

export function BoardsLibrary({
  boards,
  currentUserId,
  isAdmin,
}: {
  boards: BoardListItem[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<LinkKind[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [activity, setActivity] = useState<Activity>("all");
  const [masterOnly, setMasterOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("default");
  const [editing, setEditing] = useState<BoardListItem | null>(null);

  // ── Aggregated filter options derived from current boards list ──
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of boards) {
      for (const t of b.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [boards]);

  const allCreators = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const b of boards) {
      const c = b.createdBy;
      if (!c) continue;
      const existing = map.get(c.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(c.id, { id: c.id, name: c.name, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [boards]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const bucket = ACTIVITY_BUCKETS.find((a) => a.value === activity)!;
    return boards.filter((b) => {
      const kind = detectLinkKind(b.url).kind;
      if (selectedKinds.length > 0 && !selectedKinds.includes(kind))
        return false;
      if (selectedTags.length > 0 && !selectedTags.some((t) => b.tags.includes(t)))
        return false;
      if (
        selectedCreators.length > 0 &&
        (!b.createdBy || !selectedCreators.includes(b.createdBy.id))
      )
        return false;
      if (!bucket.match(b.workshops.length)) return false;
      if (masterOnly && !b.isMaster) return false;
      if (q) {
        const haystack = [
          b.title,
          b.url,
          b.notes ?? "",
          ...b.tags,
          b.createdBy?.name ?? "",
          ...b.workshops.map((w) => w.workshop.title),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    boards,
    search,
    selectedKinds,
    selectedTags,
    selectedCreators,
    activity,
    masterOnly,
  ]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sort === "alphabetical") return a.title.localeCompare(b.title);
      if (sort === "newest") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      if (sort === "most-used") {
        return b.workshops.length - a.workshops.length;
      }
      // default — master first then newest
      if (a.isMaster !== b.isMaster) return a.isMaster ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return list;
  }, [filtered, sort]);

  const toggleKind = (k: LinkKind) => {
    setSelectedKinds((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  };

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleCreator = (id: string) => {
    setSelectedCreators((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedKinds([]);
    setSelectedTags([]);
    setSelectedCreators([]);
    setActivity("all");
    setMasterOnly(false);
    setSort("default");
  };

  const anyActive =
    search.trim().length > 0 ||
    selectedKinds.length > 0 ||
    selectedTags.length > 0 ||
    selectedCreators.length > 0 ||
    activity !== "all" ||
    masterOnly ||
    sort !== "default";

  const masterCount = boards.filter((b) => b.isMaster).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Boards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Miro-, Figma- und Co.-Links über alle Sessions hinweg verwalten.
            <span className="text-foreground/80"> Master-Boards</span> sind
            wiederverwendbare Vorlagen.
          </p>
        </div>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
          <div className="text-xs text-muted-foreground tabular-nums">
            {sorted.length} von {boards.length}
            {masterCount > 0 ? ` · ${masterCount} Master` : ""}
          </div>
          <CreateBoardButton />
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card space-y-4 rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Title, URL, Tags, Workshop …"
              className="h-10 w-full rounded-xl border border-border/60 bg-background/40 pl-10 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-[var(--neon-violet)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--neon-violet)]/20"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-10 rounded-xl border border-border/60 bg-background/40 px-3 text-sm focus:border-[var(--neon-violet)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--neon-violet)]/20"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {anyActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-background/60 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              Zurücksetzen
            </button>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
            Tool-Typ
          </p>
          <div className="flex flex-wrap gap-1.5">
            {KIND_FILTERS.map((k) => {
              const active = selectedKinds.includes(k.value);
              return (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => toggleKind(k.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                    active
                      ? "border-[var(--neon-violet)] bg-[var(--neon-violet)]/15 font-semibold text-foreground"
                      : "border-border/60 font-medium text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active ? <Check className="size-3" /> : null}
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        {allTags.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
              Thema (Tags)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(({ tag, count }) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                      active
                        ? "border-[var(--neon-violet)] bg-[var(--neon-violet)]/15 font-semibold text-foreground"
                        : "border-border/60 font-medium text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active ? <Check className="size-3" /> : null}
                    {tag}
                    <span className="text-[10px] tabular-nums text-muted-foreground/70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
              Aktivität
            </p>
            <div className="flex flex-wrap gap-1">
              {ACTIVITY_BUCKETS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setActivity(a.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    activity === a.value
                      ? "bg-foreground/10 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {allCreators.length > 1 ? (
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                Trainer:in
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allCreators.map((c) => {
                  const active = selectedCreators.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCreator(c.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                        active
                          ? "border-[var(--neon-violet)] bg-[var(--neon-violet)]/15 font-semibold text-foreground"
                          : "border-border/60 font-medium text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {active ? <Check className="size-3" /> : null}
                      {c.name}
                      <span className="text-[10px] tabular-nums text-muted-foreground/70">
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMasterOnly(!masterOnly)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              masterOnly
                ? "bg-[var(--neon-violet)]/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.4)]"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            )}
          >
            <Star
              className={cn(
                "size-3.5",
                masterOnly && "fill-[var(--neon-violet)] text-[var(--neon-violet)]"
              )}
            />
            Nur Master-Boards
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState filtered={anyActive} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((b) => (
            <BoardCard
              key={b.id}
              board={b}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onEdit={() => setEditing(b)}
            />
          ))}
        </div>
      )}

      <EditBoardDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        board={editing}
      />
    </div>
  );
}

function BoardCard({
  board,
  currentUserId,
  isAdmin,
  onEdit,
}: {
  board: BoardListItem;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  const meta = detectLinkKind(board.url);
  const host = safeHost(board.url) ?? board.url;
  const canEdit = board.createdBy.id === currentUserId || isAdmin;
  const [, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Board „${board.title}" löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteBoardAction(board.id);
        toast.success("Board gelöscht");
      } catch (e) {
        toast.error("Konnte Board nicht löschen");
        console.error(e);
      }
    });
  };

  const handleToggleMaster = () => {
    startTransition(async () => {
      try {
        await toggleBoardMasterAction(board.id, !board.isMaster);
        toast.success(
          board.isMaster ? "Master-Status entfernt" : "Als Master markiert"
        );
      } catch (e) {
        toast.error("Konnte Status nicht ändern");
        console.error(e);
      }
    });
  };

  return (
    <article
      className="group glass-card relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 pl-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_oklch(0.65_0.26_295/_0.4)]"
      style={{ borderLeft: `3px solid ${meta.accent}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold uppercase"
            style={{ backgroundColor: `${meta.accent}26`, color: meta.accent }}
          >
            {meta.label.slice(0, 2)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {board.isMaster ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--neon-cyan)]/20 to-[var(--neon-violet)]/20 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.3)]">
              <Star className="size-2.5 fill-[var(--neon-violet)] text-[var(--neon-violet)]" />
              Master
            </span>
          ) : null}
          {canEdit ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-all hover:bg-accent/80 hover:text-foreground group-hover:opacity-100 data-[popup-open]:bg-accent/80 data-[popup-open]:text-foreground data-[popup-open]:opacity-100"
                aria-label="Board-Aktionen"
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-52">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 size-3.5" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleMaster}>
                  <Star
                    className={cn(
                      "mr-2 size-3.5",
                      board.isMaster &&
                        "fill-[var(--neon-violet)] text-[var(--neon-violet)]"
                    )}
                  />
                  {board.isMaster ? "Master entfernen" : "Als Master markieren"}
                </DropdownMenuItem>
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
          ) : null}
        </div>
      </div>

      <a
        href={board.url}
        target="_blank"
        rel="noopener noreferrer"
        className="space-y-1"
      >
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-base font-semibold leading-snug">
            {board.title}
          </h3>
          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-[var(--neon-violet)]" />
        </div>
        <div className="truncate text-[11px] text-muted-foreground">{host}</div>
      </a>

      {board.notes ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {board.notes}
        </p>
      ) : null}

      {board.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {board.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/40 bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {board.workshops.length > 0 ? (
        <div className="mt-auto border-t border-border/60 pt-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Verwendet in {board.workshops.length} Session
            {board.workshops.length === 1 ? "" : "s"}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {board.workshops.slice(0, 3).map((w) => (
              <Link
                key={w.workshopId}
                href={`/sessions/${w.workshopId}`}
                className="truncate rounded-md bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {w.workshop.title}
              </Link>
            ))}
            {board.workshops.length > 3 ? (
              <span className="rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground/60">
                +{board.workshops.length - 3}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-auto border-t border-border/60 pt-3 text-[11px] text-muted-foreground/60">
          Noch keiner Session zugeordnet
        </div>
      )}
    </article>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="glass-card flex flex-col items-center rounded-2xl p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20">
        <Layers className="size-5 text-[var(--neon-violet)]" />
      </div>
      <h2 className="mt-3 text-lg font-semibold">
        {filtered ? "Kein Board passt zum Filter" : "Noch keine Boards"}
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {filtered
          ? "Filter zurücksetzen oder ein neues Board hinzufügen."
          : "Lege das erste Miro-, Figma- oder Notion-Board an. Markiere es als Master, um es als Vorlage in Sessions zu reichen."}
      </p>
    </div>
  );
}
