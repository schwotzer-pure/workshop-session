"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  Hourglass,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  approveTemplateAction,
  deleteTemplateAction,
  rejectTemplateAction,
} from "@/actions/template";
import type { TemplateListItem } from "@/lib/queries";
import { getThemeAccent } from "@/lib/themes";

type Tab = "pending" | "all";

export function AdminTemplatesView({
  currentTab,
  templates,
}: {
  currentTab: Tab;
  templates: TemplateListItem[];
}) {
  const tabs: Array<{ value: Tab; label: string; icon: typeof ShieldCheck }> = [
    { value: "pending", label: "Anträge prüfen", icon: Hourglass },
    { value: "all", label: "Alle Vorlagen", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.value}
              href={`/dashboard/admin/templates?tab=${t.value}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                currentTab === t.value
                  ? "bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {templates.length === 0 ? (
        <EmptyState tab={currentTab} />
      ) : currentTab === "pending" ? (
        <PendingList templates={templates} />
      ) : (
        <ApprovedList templates={templates} />
      )}
    </div>
  );
}

function PendingList({ templates }: { templates: TemplateListItem[] }) {
  const [, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveTemplateAction(id);
        toast.success("Vorlage genehmigt");
      } catch (e) {
        toast.error("Konnte nicht genehmigen");
        console.error(e);
      }
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Grund der Ablehnung (optional):");
    if (reason === null) return;
    startTransition(async () => {
      try {
        await rejectTemplateAction({ templateId: id, reason: reason || null });
        toast.success("Vorlage abgelehnt");
      } catch (e) {
        toast.error("Konnte nicht ablehnen");
        console.error(e);
      }
    });
  };

  return (
    <ul className="space-y-3">
      {templates.map((t) => (
        <li
          key={t.id}
          className="glass-card relative overflow-hidden rounded-xl p-4 pl-5"
          style={{ borderLeft: `3px solid ${getThemeAccent(t.theme)}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${getThemeAccent(t.theme)}26`,
                    color: getThemeAccent(t.theme),
                  }}
                >
                  {t.theme}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="size-3" />
                  {formatDuration(t.duration)}
                </span>
              </div>
              <h3 className="text-base font-semibold">{t.title}</h3>
              {t.description ? (
                <p className="text-sm text-muted-foreground">{t.description}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                eingereicht von {t.createdBy.name}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => handleApprove(t.id)}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-95"
              >
                <CheckCircle2 className="size-3.5" />
                Genehmigen
              </button>
              <button
                type="button"
                onClick={() => handleReject(t.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive/30 hover:text-destructive"
              >
                <X className="size-3.5" />
                Ablehnen
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ApprovedList({ templates }: { templates: TemplateListItem[] }) {
  const [, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Vorlage "${title}" endgültig löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteTemplateAction(id);
        toast.success("Vorlage gelöscht");
      } catch (e) {
        toast.error("Konnte Vorlage nicht löschen");
        console.error(e);
      }
    });
  };

  return (
    <ul className="space-y-2">
      {templates.map((t) => (
        <li
          key={t.id}
          className="glass-card flex items-start justify-between gap-3 rounded-xl p-4 pl-5"
          style={{ borderLeft: `3px solid ${getThemeAccent(t.theme)}` }}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${getThemeAccent(t.theme)}26`,
                  color: getThemeAccent(t.theme),
                }}
              >
                {t.theme}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="size-3" />
                {formatDuration(t.duration)}
              </span>
              {t.useCount > 0 ? (
                <span className="text-[10px] text-muted-foreground">
                  {t.useCount}× verwendet
                </span>
              ) : null}
            </div>
            <h3 className="text-base font-semibold">{t.title}</h3>
            <p className="text-xs text-muted-foreground">
              von {t.createdBy.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(t.id, t.title)}
            className="size-8 shrink-0 rounded-md text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
            title="Vorlage löschen"
          >
            <Trash2 className="mx-auto size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const m =
    tab === "pending"
      ? {
          title: "Keine offenen Anträge",
          sub: "Wenn jemand eine Vorlage einreicht, erscheint sie hier zur Prüfung.",
        }
      : {
          title: "Noch keine genehmigten Vorlagen",
          sub: "Genehmigte Vorlagen erscheinen hier zur Verwaltung.",
        };
  return (
    <div className="glass-card flex flex-col items-center rounded-2xl p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20">
        <ShieldCheck className="size-5 text-[var(--neon-violet)]" />
      </div>
      <h2 className="mt-3 text-lg font-semibold">{m.title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{m.sub}</p>
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
