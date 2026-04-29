"use client";

import { useMemo, useState, useTransition } from "react";
import { Clock, LibraryBig, Search, Tag, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MethodListItem } from "@/lib/queries";

const ALL = "Alle";

export type MethodPickerContext = {
  parentBlockId: string | null;
  column: number;
  position?: number;
};

export function MethodPickerDialog({
  open,
  onOpenChange,
  methods,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  methods: MethodListItem[];
  onPick: (methodId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [, startTransition] = useTransition();

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const m of methods) if (m.category) set.add(m.category);
    return [ALL, ...Array.from(set).sort()];
  }, [methods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return methods.filter((m) => {
      if (category !== ALL && m.category !== category) return false;
      if (!q) return true;
      const haystack = [
        m.title,
        m.description ?? "",
        m.category ?? "",
        ...m.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [methods, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, MethodListItem[]>();
    for (const m of filtered) {
      const cat = m.category ?? "Sonstige";
      const arr = map.get(cat) ?? [];
      arr.push(m);
      map.set(cat, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handlePick = (methodId: string) => {
    startTransition(async () => {
      try {
        await onPick(methodId);
        onOpenChange(false);
        setQuery("");
        setCategory(ALL);
      } catch (e) {
        toast.error("Konnte Methode nicht einfügen");
        console.error(e);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!flex !h-[90vh] !w-[95vw] !max-w-[1400px] !flex-col !gap-0 !overflow-hidden !p-0 sm:!max-w-[1400px]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <LibraryBig className="size-3.5 text-[var(--neon-violet)]" />
              Methoden-Bibliothek
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Methode auswählen
            </h2>
            <p className="text-xs text-muted-foreground">
              Tipp auf eine Methode — sie wird mit Titel, Beschreibung und
              Default-Dauer als Block eingefügt.
            </p>
          </div>
          <DialogClose
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="size-4" />
          </DialogClose>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav
            className={cn(
              "shrink-0 border-border/60 bg-background/40",
              "flex gap-0.5 overflow-x-auto p-2 md:flex-col md:overflow-visible md:overflow-y-auto",
              "md:w-56 md:border-r md:p-3",
              "border-b md:border-b-0"
            )}
          >
            <div className="hidden px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:block">
              Kategorie
            </div>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-left text-sm font-medium transition-colors md:w-full",
                  c === category
                    ? "bg-gradient-to-r from-[var(--neon-cyan)]/12 via-[var(--neon-violet)]/12 to-[var(--neon-pink)]/12 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-8 py-3 backdrop-blur">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Suche Methoden, Tags, Beschreibungen …"
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-8 py-6">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-12 text-center text-sm text-muted-foreground">
                  Keine Methoden gefunden.
                </div>
              ) : (
                <div className="space-y-7">
                  {grouped.map(([cat, items]) => (
                    <section key={cat} className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {cat}
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handlePick(m.id)}
                            className={cn(
                              "group flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-all",
                              "hover:-translate-y-0.5 hover:border-[var(--neon-violet)]/40 hover:shadow-[0_4px_20px_-8px_oklch(0.65_0.26_295/_0.3)]"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold leading-snug">
                                {m.title}
                              </h4>
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                                <Clock className="size-2.5" />
                                {m.defaultDuration}m
                              </span>
                            </div>
                            {m.description ? (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {m.description}
                              </p>
                            ) : null}
                            {m.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {m.tags.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    className="inline-flex items-center gap-0.5 rounded-full border border-border/40 bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                  >
                                    <Tag className="size-2" />
                                    {t}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
