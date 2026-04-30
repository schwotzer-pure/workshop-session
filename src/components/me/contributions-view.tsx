"use client";

import { useTransition } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Hourglass,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { deleteTemplateAction } from "@/actions/template";
import { deleteMethodAction } from "@/actions/method";
import { getThemeAccent } from "@/lib/themes";
import {
  getMethodCategoryAccent,
  getMethodCategoryLabel,
} from "@/lib/method-categories";
import type { MethodListItemForUser, TemplateListItem } from "@/lib/queries";

export function ContributionsView({
  templates,
  methods,
}: {
  templates: TemplateListItem[];
  methods: MethodListItemForUser[];
}) {
  const totalCount = templates.length + methods.length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Meine Beiträge</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hier siehst du den Status deiner eingereichten Vorlagen und Methoden.
        </p>
      </div>

      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Section
            title="Vorlagen"
            count={templates.length}
            emptyText="Du hast noch keine Vorlage eingereicht."
          >
            <TemplateList templates={templates} />
          </Section>
          <Section
            title="Methoden"
            count={methods.length}
            emptyText="Du hast noch keine Methode eingereicht."
          >
            <MethodList methods={methods} />
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
          {title}
        </h2>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        children
      )}
    </section>
  );
}

function TemplateList({ templates }: { templates: TemplateListItem[] }) {
  const [, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Vorlage "${title}" löschen?`)) return;
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
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={t.status} />
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
            {t.status === "REJECTED" && t.rejectedReason ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                Abgelehnt: {t.rejectedReason}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => handleDelete(t.id, t.title)}
            className="size-7 shrink-0 rounded-md text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
            title="Vorlage löschen"
          >
            <Trash2 className="mx-auto size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function MethodList({ methods }: { methods: MethodListItemForUser[] }) {
  const [, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Methode "${title}" löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteMethodAction(id);
        toast.success("Methode gelöscht");
      } catch (e) {
        toast.error("Konnte Methode nicht löschen");
        console.error(e);
      }
    });
  };

  return (
    <ul className="space-y-2">
      {methods.map((m) => {
        const cat = m.category ?? "Sonstige";
        const accent = getMethodCategoryAccent(cat);
        return (
          <li
            key={m.id}
            className="glass-card flex items-start justify-between gap-3 rounded-xl p-4 pl-5"
            style={{ borderLeft: `3px solid ${accent}` }}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={m.status} />
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${accent}26`,
                    color: accent,
                  }}
                >
                  {getMethodCategoryLabel(cat)}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="size-3" />
                  {m.defaultDuration}m
                </span>
              </div>
              <h3 className="text-base font-semibold">{m.title}</h3>
              {m.description ? (
                <p className="text-sm text-muted-foreground">{m.description}</p>
              ) : null}
              {m.status === "REJECTED" && m.rejectedReason ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  Abgelehnt: {m.rejectedReason}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(m.id, m.title)}
              className="size-7 shrink-0 rounded-md text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
              title="Methode löschen"
            >
              <Trash2 className="mx-auto size-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="glass-card flex flex-col items-center rounded-2xl p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20">
        <Award className="size-5 text-[var(--neon-violet)]" />
      </div>
      <h2 className="mt-3 text-lg font-semibold">Du hast noch nichts eingereicht</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Reiche Vorlagen aus dem Workshop-Editor oder Methoden aus der Methoden-Bibliothek ein.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neon-cyan)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--neon-cyan)]">
        <CheckCircle2 className="size-2.5" />
        Genehmigt
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
        <XCircle className="size-2.5" />
        Abgelehnt
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neon-pink)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--neon-pink)]">
      <Hourglass className="size-2.5" />
      Wartet
    </span>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
