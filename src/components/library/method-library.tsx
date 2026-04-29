"use client";

import { useMemo, useState } from "react";
import { Search, Clock, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MethodListItem } from "@/lib/queries";

const ALL = "Alle";

export function MethodLibrary({ methods }: { methods: MethodListItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);

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

  return (
    <div className="space-y-6">
      <div className="glass-card flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche Methoden, Tags, Beschreibungen …"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                c === category
                  ? "bg-gradient-to-r from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                  : "border border-border/60 bg-background/40 text-muted-foreground hover:border-[var(--neon-violet)]/30 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Keine Methoden gefunden.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([cat, items]) => (
            <section key={cat} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {cat}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <article
                    key={m.id}
                    className="group glass-card rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--neon-violet)]/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold leading-snug">
                        {m.title}
                      </h3>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                        <Clock className="size-3" />
                        {m.defaultDuration}m
                      </span>
                    </div>
                    {m.description ? (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {m.description}
                      </p>
                    ) : null}
                    {m.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {m.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            <Tag className="size-2.5" />
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
