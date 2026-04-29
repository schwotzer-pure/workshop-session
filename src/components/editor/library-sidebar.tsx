"use client";

import { useMemo, useState, useTransition } from "react";
import { LibraryBig, Search, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { insertMethodAsBlockAction } from "@/actions/method";
import { cn } from "@/lib/utils";
import type { MethodListItem } from "@/lib/queries";

export function LibrarySidebarTrigger({
  methods,
  dayId,
}: {
  methods: MethodListItem[];
  dayId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
        title="Methoden-Bibliothek"
      >
        <LibraryBig className="size-4" />
        Methoden
      </button>
      <LibrarySidebar
        open={open}
        onOpenChange={setOpen}
        methods={methods}
        dayId={dayId}
      />
    </>
  );
}

function LibrarySidebar({
  open,
  onOpenChange,
  methods,
  dayId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  methods: MethodListItem[];
  dayId: string;
}) {
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return methods;
    return methods.filter((m) => {
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
  }, [methods, query]);

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

  const handleInsert = (methodId: string) => {
    startTransition(async () => {
      try {
        await insertMethodAsBlockAction({ methodId, dayId });
        toast.success("Methode eingefügt");
      } catch (e) {
        toast.error("Konnte Methode nicht einfügen");
        console.error(e);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <LibraryBig className="size-4 text-[var(--neon-violet)]" />
            Methoden-Bibliothek
          </SheetTitle>
          <SheetDescription>
            Tipp auf eine Methode, um sie ans Ende der Timeline anzufügen.
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-border/60 px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suche Methoden …"
              className="h-9 pl-8"
              autoFocus
            />
          </div>
        </div>

        <div className="px-6 py-4">
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-background/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Keine Methoden gefunden.
            </p>
          ) : (
            <div className="space-y-5">
              {grouped.map(([cat, items]) => (
                <section key={cat} className="space-y-2">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {cat}
                  </h3>
                  <ul className="space-y-1.5">
                    {items.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => handleInsert(m.id)}
                          className={cn(
                            "group flex w-full items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left transition-all",
                            "hover:border-[var(--neon-violet)]/40 hover:bg-background/80"
                          )}
                        >
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-colors group-hover:text-[var(--neon-violet)]">
                            <Plus className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium leading-snug">
                                {m.title}
                              </span>
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-border/40 bg-background/60 px-1 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                                <Clock className="size-2.5" />
                                {m.defaultDuration}m
                              </span>
                            </div>
                            {m.description ? (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {m.description}
                              </p>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
