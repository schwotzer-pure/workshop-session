"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Award,
  Check,
  Clock,
  Flame,
  MoreVertical,
  Search,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  deleteTemplateAction,
  rateTemplateAction,
  useTemplateAction,
} from "@/actions/template";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isRedirectError } from "@/lib/is-redirect";
import { THEMES, getThemeAccent } from "@/lib/themes";
import type { TemplateListItem } from "@/lib/queries";

type DurationBucket = "all" | "short" | "half" | "full" | "multi";
type Sort = "rating" | "popular" | "newest" | "shortest";

const DURATION_BUCKETS: Array<{
  value: DurationBucket;
  label: string;
  match: (mins: number) => boolean;
}> = [
  { value: "all", label: "Alle", match: () => true },
  { value: "short", label: "< 2h", match: (m) => m < 120 },
  { value: "half", label: "Halbtag (2–4h)", match: (m) => m >= 120 && m < 240 },
  { value: "full", label: "Tagesworkshop (4–8h)", match: (m) => m >= 240 && m < 480 },
  { value: "multi", label: "Mehrtägig (8h+)", match: (m) => m >= 480 },
];

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "rating", label: "Beste Bewertung" },
  { value: "popular", label: "Meist verwendet" },
  { value: "newest", label: "Neueste zuerst" },
  { value: "shortest", label: "Kürzeste zuerst" },
];

export function TemplatesView({
  templates,
  currentUserId,
  isAdmin,
}: {
  templates: TemplateListItem[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [duration, setDuration] = useState<DurationBucket>("all");
  const [minRating4, setMinRating4] = useState(false);
  const [sort, setSort] = useState<Sort>("rating");

  const isFilterActive =
    search.trim().length > 0 ||
    duration !== "all" ||
    minRating4 ||
    sort !== "rating";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const bucket = DURATION_BUCKETS.find((b) => b.value === duration)!;
    return templates.filter((t) => {
      if (selectedThemes.length > 0 && !selectedThemes.includes(t.theme))
        return false;
      if (!bucket.match(t.duration)) return false;
      if (minRating4 && (t.avgRating ?? 0) < 4) return false;
      if (q) {
        const haystack = [
          t.title,
          t.description ?? "",
          t.tags.join(" "),
          t.theme,
          t.createdBy.name,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [templates, search, selectedThemes, duration, minRating4]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sort === "rating") {
        return (b.avgRating ?? 0) - (a.avgRating ?? 0) || b.useCount - a.useCount;
      }
      if (sort === "popular") {
        return b.useCount - a.useCount || (b.avgRating ?? 0) - (a.avgRating ?? 0);
      }
      if (sort === "newest") {
        const aDate = a.approvedAt ?? a.createdAt;
        const bDate = b.approvedAt ?? b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      }
      return a.duration - b.duration;
    });
    return list;
  }, [filtered, sort]);

  const showGrouped =
    !search.trim() && duration === "all" && !minRating4 && sort === "rating";

  const grouped = useMemo(() => {
    const map = new Map<string, TemplateListItem[]>();
    for (const t of sorted) {
      const arr = map.get(t.theme) ?? [];
      arr.push(t);
      map.set(t.theme, arr);
    }
    const ordered = THEMES.map((th) => th.key).filter((k) => map.has(k));
    for (const k of map.keys()) {
      if (!ordered.includes(k)) ordered.push(k);
    }
    return { map, ordered };
  }, [sorted]);

  const toggleTheme = (key: string) => {
    setSelectedThemes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedThemes([]);
    setDuration("all");
    setMinRating4(false);
    setSort("rating");
  };

  const anyActive =
    search.trim().length > 0 ||
    selectedThemes.length > 0 ||
    duration !== "all" ||
    minRating4 ||
    sort !== "rating";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vorlagen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Wiederverwendbare Workshops aus dem Trainer-Team. Filtere nach
            Thema, Dauer oder Bewertung.
          </p>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {sorted.length} von {templates.length}
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        selectedThemes={selectedThemes}
        onToggleTheme={toggleTheme}
        duration={duration}
        onDurationChange={setDuration}
        minRating4={minRating4}
        onMinRatingChange={setMinRating4}
        sort={sort}
        onSortChange={setSort}
        anyActive={anyActive}
        onClear={clearFilters}
      />

      {sorted.length === 0 ? (
        <EmptyState filtered={isFilterActive || selectedThemes.length > 0} />
      ) : showGrouped ? (
        <div className="space-y-8">
          {grouped.ordered.map((theme) => {
            const themeMeta = THEMES.find((t) => t.key === theme);
            const accent = getThemeAccent(theme);
            return (
              <section key={theme} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
                    {themeMeta?.label ?? theme}
                  </h2>
                  {themeMeta?.description ? (
                    <span className="text-[11px] text-muted-foreground">
                      · {themeMeta.description}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped.map.get(theme)?.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
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
  selectedThemes,
  onToggleTheme,
  duration,
  onDurationChange,
  minRating4,
  onMinRatingChange,
  sort,
  onSortChange,
  anyActive,
  onClear,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  selectedThemes: string[];
  onToggleTheme: (key: string) => void;
  duration: DurationBucket;
  onDurationChange: (v: DurationBucket) => void;
  minRating4: boolean;
  onMinRatingChange: (v: boolean) => void;
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
            placeholder="Suche nach Titel, Stichwort, Trainer …"
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
          Thema
        </p>
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((t) => {
            const active = selectedThemes.includes(t.key);
            const accent = getThemeAccent(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onToggleTheme(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                  active
                    ? "font-semibold text-foreground"
                    : "border-border/60 font-medium text-muted-foreground hover:text-foreground"
                )}
                style={
                  active
                    ? {
                        backgroundColor: `${accent}80`,
                        borderColor: accent,
                      }
                    : undefined
                }
              >
                {active ? (
                  <Check className="size-3" />
                ) : (
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                )}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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

        <div className="ml-auto">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
            Qualität
          </p>
          <button
            type="button"
            onClick={() => onMinRatingChange(!minRating4)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              minRating4
                ? "bg-[var(--neon-violet)]/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.4)]"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            )}
          >
            <Star
              className={cn(
                "size-3.5",
                minRating4 && "fill-[var(--neon-violet)] text-[var(--neon-violet)]"
              )}
            />
            Nur 4★ und mehr
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────── Card ────────────────────

function TemplateCard({
  template,
  currentUserId: _currentUserId,
  isAdmin,
}: {
  template: TemplateListItem;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [, startTransition] = useTransition();
  const myRating = template.ratings[0]?.score ?? 0;
  const accent = getThemeAccent(template.theme);

  const isTopRated =
    (template.avgRating ?? 0) >= 4.5 && template.ratingCount >= 3;
  const isPopular = template.useCount >= 5;

  const handleUse = () => {
    startTransition(async () => {
      try {
        await useTemplateAction(template.id);
      } catch (e) {
        if (isRedirectError(e)) throw e;
        toast.error("Konnte Vorlage nicht verwenden");
        console.error(e);
      }
    });
  };

  const handleRate = (score: number) => {
    startTransition(async () => {
      try {
        await rateTemplateAction({ templateId: template.id, score });
        toast.success(`Bewertet mit ${score} Stern${score === 1 ? "" : "en"}`);
      } catch (e) {
        toast.error("Konnte nicht bewerten");
        console.error(e);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Vorlage "${template.title}" endgültig löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteTemplateAction(template.id);
        toast.success("Vorlage gelöscht");
      } catch (e) {
        toast.error("Konnte Vorlage nicht löschen");
        console.error(e);
      }
    });
  };

  return (
    <article
      className="group glass-card relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 pl-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_oklch(0.65_0.26_295/_0.4)]"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: `${accent}26`, color: accent }}
        >
          {template.theme}
        </span>
        <div className="flex items-center gap-1">
          {isTopRated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--neon-cyan)]/20 to-[var(--neon-violet)]/20 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.3)]">
              <Award className="size-2.5" />
              Top
            </span>
          ) : null}
          {isPopular ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neon-pink)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--neon-pink)]">
              <Flame className="size-2.5" />
              Beliebt
            </span>
          ) : null}
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-all hover:bg-accent/80 hover:text-foreground group-hover:opacity-100 data-[popup-open]:bg-accent/80 data-[popup-open]:text-foreground data-[popup-open]:opacity-100"
                aria-label="Vorlagen-Aktionen"
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-44">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Vorlage löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-snug">{template.title}</h3>
        {template.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {template.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {formatDuration(template.duration)}
        </span>
        {template.useCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="size-3" />
            {template.useCount}× verwendet
          </span>
        ) : null}
      </div>

      {template.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {template.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <div className="border-t border-border/60 pt-3">
        <RatingStars
          value={myRating}
          avg={template.avgRating}
          count={template.ratingCount}
          onRate={handleRate}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span className="truncate">von {template.createdBy.name}</span>
        <button
          type="button"
          onClick={handleUse}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] px-3 py-1 text-xs font-medium text-white hover:opacity-95"
        >
          <Sparkles className="size-3" />
          Als Session erstellen
        </button>
      </div>
    </article>
  );
}

function RatingStars({
  value,
  avg,
  count,
  onRate,
}: {
  value: number;
  avg: number | null;
  count: number;
  onRate: (score: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div
        className="flex items-center gap-0.5"
        role="radiogroup"
        aria-label="Bewertung"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            aria-label={`${n} Sterne`}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "size-4 transition-colors",
                n <= value
                  ? "fill-[var(--neon-violet)] text-[var(--neon-violet)]"
                  : "text-muted-foreground/40 hover:text-[var(--neon-violet)]/60"
              )}
            />
          </button>
        ))}
      </div>
      <div className="text-[10px] tabular-nums text-muted-foreground">
        {avg ? `${avg.toFixed(1)} (${count})` : "Noch keine Bewertungen"}
      </div>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="glass-card flex flex-col items-center rounded-2xl p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20">
        <Award className="size-5 text-[var(--neon-violet)]" />
      </div>
      <h2 className="mt-3 text-lg font-semibold">
        {filtered ? "Keine Vorlage passt zum Filter" : "Noch keine Vorlagen freigegeben"}
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {filtered
          ? "Setz die Filter zurück oder reiche selbst eine Vorlage ein."
          : "Reiche im Editor einen Workshop als Vorlage ein — Admins prüfen, dann erscheint sie hier."}
      </p>
    </div>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
