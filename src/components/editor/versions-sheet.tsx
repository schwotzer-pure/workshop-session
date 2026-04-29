"use client";

import { useEffect, useState, useTransition } from "react";
import {
  History,
  Plus,
  RotateCcw,
  Trash2,
  Save,
  Wand2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createVersionAction,
  restoreVersionAction,
  deleteVersionAction,
} from "@/actions/version";
import { isRedirectError } from "@/lib/is-redirect";
import { cn } from "@/lib/utils";
import type { WorkshopVersionSummary } from "@/lib/queries";

const KIND_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  manual: {
    label: "Manuell",
    icon: Save,
    color: "text-[var(--neon-violet)]",
  },
  auto: {
    label: "Automatisch",
    icon: Wand2,
    color: "text-muted-foreground",
  },
  before_restore: {
    label: "Vor Wiederherstellung",
    icon: ShieldCheck,
    color: "text-[var(--neon-cyan)]",
  },
};

function relativeTime(d: Date): string {
  const ms = Date.now() - d.getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "gerade eben";
  const min = Math.floor(sec / 60);
  if (min < 60) return `vor ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `vor ${days} Tagen`;
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fullTime(d: Date): string {
  return d.toLocaleString("de-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VersionsSheet({
  open,
  onOpenChange,
  workshopId,
  initialVersions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshopId: string;
  initialVersions: WorkshopVersionSummary[];
}) {
  const [versions, setVersions] =
    useState<WorkshopVersionSummary[]>(initialVersions);
  const [labelInput, setLabelInput] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setVersions(initialVersions);
  }, [initialVersions]);

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

  const handleCreate = () => {
    const label = labelInput.trim() || null;
    persist(async () => {
      await createVersionAction({ workshopId, label });
      setLabelInput("");
      toast.success(
        label ? `Version "${label}" gespeichert` : "Version gespeichert"
      );
    });
  };

  const handleRestore = (id: string, when: Date, label: string | null) => {
    const target = label || fullTime(when);
    if (
      !confirm(
        `Workshop auf den Stand von "${target}" zurücksetzen?\n\nDer aktuelle Stand wird automatisch als Sicherheits-Version gespeichert.`
      )
    )
      return;
    persist(async () => {
      await restoreVersionAction(id);
      toast.success("Version wiederhergestellt");
      onOpenChange(false);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Diese Version löschen? Sie kann nicht wiederhergestellt werden.")) return;
    setVersions((prev) => prev.filter((v) => v.id !== id));
    persist(() => deleteVersionAction(id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-[var(--neon-violet)]" />
            Versionsverlauf
          </SheetTitle>
          <SheetDescription>
            Speichere wichtige Stände als Version und stelle sie bei Bedarf
            wieder her.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 border-b border-border/60 px-6 py-4">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Neue Version speichern
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="Optional: Name (z.B. vor Galliker-Probe)"
              className="h-9"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              className="shrink-0 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
            >
              <Plus className="size-3.5" />
              Speichern
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Snapshot speichert alle Blöcke, Tasks, Materialien, Notizen und
            Trainer-Zuweisungen.
          </p>
        </div>

        <div className="px-6 py-4">
          {versions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Noch keine Versionen.
              <br />
              Speichere deinen aktuellen Stand mit dem Button oben.
            </div>
          ) : (
            <ol className="space-y-2">
              {versions.map((v, idx) => {
                const meta = KIND_META[v.kind] ?? KIND_META.manual;
                const Icon = meta.icon;
                const created = new Date(v.createdAt);
                return (
                  <li
                    key={v.id}
                    className={cn(
                      "group rounded-lg border bg-background/40 p-3 transition-colors",
                      idx === 0
                        ? "border-[var(--neon-violet)]/30"
                        : "border-border/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
                          <Icon className={cn("size-3", meta.color)} />
                          <span className={meta.color}>{meta.label}</span>
                          {idx === 0 ? (
                            <span className="rounded-full bg-[var(--neon-violet)]/15 px-1.5 text-[var(--neon-violet)]">
                              Neueste
                            </span>
                          ) : null}
                        </div>
                        {v.label ? (
                          <p className="mt-1 text-sm font-medium leading-snug">
                            {v.label}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm font-medium leading-snug text-muted-foreground">
                            (ohne Label)
                          </p>
                        )}
                        <p
                          className="mt-0.5 text-xs text-muted-foreground"
                          title={fullTime(created)}
                        >
                          {relativeTime(created)}
                          {v.createdBy ? ` · ${v.createdBy.name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleRestore(v.id, created, v.label)}
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
                          title="Wiederherstellen"
                        >
                          <RotateCcw className="size-3" />
                          Wiederherstellen
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v.id)}
                          className="size-7 rounded-md text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                          title="Version löschen"
                        >
                          <Trash2 className="mx-auto size-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
