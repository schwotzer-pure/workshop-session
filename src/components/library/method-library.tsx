"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Clock,
  MoreVertical,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createSessionFromMethodAction,
  deleteMethodAction,
} from "@/actions/method";
import {
  METHOD_CATEGORIES,
  getMethodCategoryAccent,
  getMethodCategoryLabel,
} from "@/lib/method-categories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateMethodButton } from "./create-method-dialog";
import type { MethodListItem } from "@/lib/queries";

type DurationBucket = "all" | "short" | "medium" | "long" | "xlong";
type Sort = "default" | "newest" | "shortest" | "longest" | "alphabetical";

const DURATION_BUCKETS: Array<{
  value: DurationBucket;
  label: string;
  match: (mins: number) => boolean;
}> = [
  { value: "all", label: "Alle", match: () => true },
  { value: "short", label: "< 10 min", match: (m) => m < 10 },
  { value: "medium", label: "10–30 min", match: (m) => m >= 10 && m < 30 },
  { value: "long", label: "30–60 min", match: (m) => m >= 30 && m < 60 },
  { value: "xlong", label: "60+ min", match: (m) => m >= 60 },
];

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "default", label: "Standard (gruppiert)" },
  { value: "newest", label: "Neueste zuerst" },
  { value: "shortest", label: "Kürzeste zuerst" },
  { value: "longest", label: "Längste zuerst" },
  { value: "alphabetical", label: "A–Z" },
];

export function MethodLibrary({
  methods,
  isAdmin,
}: {
  methods: MethodListItem[];
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [duration, setDuration] = useState<DurationBucket>("all");
  const [sort, setSort] = useState<Sort>("default");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const bucket = DURATION_BUCKETS.find((b) => b.value === duration)!;
    return methods.filter((m) => {
      const cat = m.category ?? "Sonstige";
      if (selectedCategories.length > 0 && !selectedCategories.includes(cat))
        return false;
      if (!bucket.match(m.defaultDuration)) return false;
      if (q) {
        const haystack = [
          m.title,
          m.description ?? "",
          m.category ?? "",
          ...m.tags,
          m.createdBy?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [methods, search, selectedCategories, duration]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sort === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sort === "shortest") return a.defaultDuration - b.defaultDuration;
      if (sort === "longest") return b.defaultDuration - a.defaultDuration;
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [filtered, sort]);

  const showGrouped =
    sort === "default" && !search.trim() && duration === "all";

  const grouped = useMemo(() => {
    const map = new Map<string, MethodListItem[]>();
    for (const m of sorted) {
      const cat = m.category ?? "Sonstige";
      const arr = map.get(cat) ?? [];
      arr.push(m);
      map.set(cat, arr);
    }
    const ordered = METHOD_CATEGORIES.map((c) => c.key).filter((k) =>
      map.has(k)
    );
    for (const k of map.keys()) {
      if (!ordered.includes(k)) ordered.push(k);
    }
    return { map, ordered };
  }, [sorted]);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setDuration("all");
    setSort("default");
  };

  const anyActive =
    search.trim().length > 0 ||
    selectedCategories.length > 0 ||
    duration !== "all" ||
    sort !== "default";

  const isFilterActive =
    search.trim().length > 0 || duration !== "all" || sort !== "default";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Methoden</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Wiederverwendbare Workshop-Bausteine. Filtere nach Kategorie oder
            Dauer.
          </p>
        </div>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
          <div className="text-xs text-muted-foreground tabular-nums">
            {sorted.length} von {methods.length}
          </div>
          <CreateMethodButton />
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        duration={duration}
        onDurationChange={setDuration}
        sort={sort}
        onSortChange={setSort}
        anyActive={anyActive}
        onClear={clearFilters}
      />

      {sorted.length === 0 ? (
        <EmptyState
          filtered={isFilterActive || selectedCategories.length > 0}
        />
      ) : showGrouped ? (
        <div className="space-y-8">
          {grouped.ordered.map((cat) => {
            const accent = getMethodCategoryAccent(cat);
            const meta = METHOD_CATEGORIES.find((c) => c.key === cat);
            return (
              <section key={cat} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
                    {meta?.label ?? cat}
                  </h2>
                  {meta?.description ? (
                    <span className="text-[11px] text-muted-foreground">
                      · {meta.description}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped.map.get(cat)?.map((m) => (
                    <MethodCard key={m.id} method={m} isAdmin={isAdmin} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => (
            <MethodCard key={m.id} method={m} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────── Filter Bar ────────────────────

function FilterBar({
  search,
  onSearchChange,
  selectedCategories,
  onToggleCategory,
  duration,
  onDurationChange,
  sort,
  onSortChange,
  anyActive,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  selectedCategories: string[];
  onToggleCategory: (key: string) => void;
  duration: DurationBucket;
  onDurationChange: (v: DurationBucket) => void;
  sort: Sort;
  onSortChange: (v: Sort) => void;
  anyActive: boolean;
  onClear: () => void;
}) {
  return (
    <div className="glass-card space-y-4 rounded-2xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Suche Methoden, Tags, Beschreibungen …"
            className="h-10 w-full rounded-xl border border-border/60 bg-background/40 pl-10 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-[var(--neon-violet)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--neon-violet)]/20"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as Sort)}
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
            onClick={onClear}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-background/60 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
            Zurücksetzen
          </button>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
          Kategorie
        </p>
        <div className="flex flex-wrap gap-1.5">
          {METHOD_CATEGORIES.map((c) => {
            const active = selectedCategories.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onToggleCategory(c.key)}
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
                {active ? (
                  <Check className="size-3" />
                ) : (
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: c.accent }}
                  />
                )}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
          Dauer
        </p>
        <div className="flex flex-wrap gap-1">
          {DURATION_BUCKETS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => onDurationChange(b.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                duration === b.value
                  ? "bg-foreground/10 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────── Card ────────────────────

function MethodCard({
  method,
  isAdmin,
}: {
  method: MethodListItem;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const cat = method.category ?? "Sonstige";
  const accent = getMethodCategoryAccent(cat);
  const catLabel = getMethodCategoryLabel(cat);

  const handleDelete = () => {
    if (!confirm(`Methode "${method.title}" endgültig löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteMethodAction(method.id);
        toast.success("Methode gelöscht");
      } catch (e) {
        toast.error("Konnte Methode nicht löschen");
        console.error(e);
      }
    });
  };

  const handleUse = () => {
    startTransition(async () => {
      try {
        const id = await createSessionFromMethodAction(method.id);
        router.push(`/sessions/${id}`);
      } catch (e) {
        toast.error("Konnte Session nicht erstellen");
        console.error(e);
      }
    });
  };

  return (
    <article className="group glass-card relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_oklch(0.65_0.26_295/_0.25)]">
      {/* Big category bubble + meta header */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_-2px_8px_rgba(0,0,0,0.05)]"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklch, ${accent} 25%, transparent), color-mix(in oklch, ${accent} 8%, transparent))`,
            color: accent,
          }}
        >
          <Zap className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.25em]"
            style={{ color: accent }}
          >
            {catLabel}
          </span>
          <h3 className="mt-0.5 text-base font-semibold leading-tight tracking-tight">
            {method.title}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {method.defaultDuration} min
          </span>
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-all hover:bg-accent/80 hover:text-foreground group-hover:opacity-100 data-[popup-open]:bg-accent/80 data-[popup-open]:text-foreground data-[popup-open]:opacity-100"
                aria-label="Methoden-Aktionen"
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-44">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Methode löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {method.description ? (
        <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
          {method.description}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2">
        {method.tags.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1 text-[11px] text-muted-foreground/70">
            <Tag className="size-3 shrink-0 text-muted-foreground/60" />
            {method.tags.slice(0, 3).map((t) => (
              <span key={t} className="truncate">
                #{t}
              </span>
            ))}
          </div>
        ) : (
          <span className="truncate text-[11px] text-muted-foreground/60">
            {method.createdBy?.name ? `von ${method.createdBy.name}` : ""}
          </span>
        )}
        <button
          type="button"
          onClick={handleUse}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 px-3 py-1.5 text-[11px] font-medium text-foreground transition-all hover:from-[var(--neon-cyan)]/25 hover:via-[var(--neon-violet)]/25 hover:to-[var(--neon-pink)]/25"
        >
          <Sparkles className="size-3" />
          Session erstellen
        </button>
      </div>
    </article>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="glass-card flex flex-col items-center rounded-2xl p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20">
        <Sparkles className="size-5 text-[var(--neon-violet)]" />
      </div>
      <h2 className="mt-3 text-lg font-semibold">
        {filtered ? "Keine Methode passt zum Filter" : "Noch keine Methoden freigegeben"}
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {filtered
          ? "Setz die Filter zurück oder leg eine neue Methode an."
          : "Erstelle eine neue Methode oder reiche aus dem Editor einen Block als Methodenbaustein ein."}
      </p>
    </div>
  );
}
