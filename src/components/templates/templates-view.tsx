"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Hourglass,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  approveTemplateAction,
  deleteTemplateAction,
  rateTemplateAction,
  rejectTemplateAction,
  useTemplateAction,
} from "@/actions/template";
import { isRedirectError } from "@/lib/is-redirect";
import { THEMES } from "@/lib/themes";
import type { TemplateListItem } from "@/lib/queries";

type Tab = "approved" | "mine" | "pending";

export function TemplatesView({
  currentTab,
  isAdmin,
  templates,
  currentUserId,
}: {
  currentTab: Tab;
  isAdmin: boolean;
  templates: TemplateListItem[];
  currentUserId: string;
}) {
  const tabs: Array<{ value: Tab; label: string; admin?: boolean }> = [
    { value: "approved", label: "Genehmigt" },
    { value: "mine", label: "Meine Anträge" },
    { value: "pending", label: "Anträge prüfen", admin: true },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Vorlagen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wiederverwendbare Workshops, gruppiert nach Thema und mit Bewertung
          aus dem Trainer-Team.
        </p>
      </div>

      <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
        {tabs
          .filter((t) => !t.admin || isAdmin)
          .map((t) => (
            <Link
              key={t.value}
              href={`/dashboard/templates?tab=${t.value}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                currentTab === t.value
                  ? "bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}
            >
              {t.value === "pending" ? (
                <ShieldCheck className="size-3.5" />
              ) : null}
              {t.label}
            </Link>
          ))}
      </div>

      {templates.length === 0 ? (
        <EmptyState tab={currentTab} />
      ) : currentTab === "approved" ? (
        <ApprovedView templates={templates} currentUserId={currentUserId} />
      ) : currentTab === "mine" ? (
        <MineView templates={templates} />
      ) : (
        <PendingView templates={templates} />
      )}
    </div>
  );
}

// ──────────────────── Approved (grouped by theme) ──────────────────────

function ApprovedView({
  templates,
  currentUserId,
}: {
  templates: TemplateListItem[];
  currentUserId: string;
}) {
  const grouped = new Map<string, TemplateListItem[]>();
  for (const t of templates) {
    const arr = grouped.get(t.theme) ?? [];
    arr.push(t);
    grouped.set(t.theme, arr);
  }
  const orderedThemes = THEMES.map((th) => th.key).filter((k) =>
    grouped.has(k)
  );
  for (const th of grouped.keys()) {
    if (!orderedThemes.includes(th)) orderedThemes.push(th);
  }

  return (
    <div className="space-y-8">
      {orderedThemes.map((theme) => {
        const themeMeta = THEMES.find((t) => t.key === theme);
        return (
          <section key={theme} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {themeMeta?.label ?? theme}
              {themeMeta?.description ? (
                <span className="ml-2 normal-case tracking-normal text-muted-foreground/70">
                  · {themeMeta.description}
                </span>
              ) : null}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.get(theme)?.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TemplateCard({
  template,
  currentUserId,
}: {
  template: TemplateListItem;
  currentUserId: string;
}) {
  const [, startTransition] = useTransition();
  const myRating = template.ratings[0]?.score ?? 0;

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

  return (
    <article className="group glass-card flex flex-col gap-3 rounded-2xl p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-snug">{template.title}</h3>
        {template.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {template.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {Math.floor(template.duration / 60) > 0
            ? `${Math.floor(template.duration / 60)}h ${template.duration % 60}m`
            : `${template.duration}m`}
        </span>
        {template.useCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3" />
            {template.useCount}× verwendet
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {template.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="border-t border-border/60 pt-3">
        <RatingStars
          value={myRating}
          avg={template.avgRating}
          count={template.ratingCount}
          onRate={handleRate}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span>von {template.createdBy.name}</span>
        <button
          type="button"
          onClick={handleUse}
          className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] px-3 py-1 text-xs font-medium text-white hover:opacity-95"
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
      <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Bewertung">
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

// ──────────────────── Mine ──────────────────────────────────────────

function MineView({ templates }: { templates: TemplateListItem[] }) {
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
          className="glass-card flex items-start justify-between gap-3 rounded-xl p-4"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={t.status} />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {t.theme}
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

// ──────────────────── Pending (admin) ───────────────────────────────

function PendingView({ templates }: { templates: TemplateListItem[] }) {
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
    if (reason === null) return; // user cancelled
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
        <li key={t.id} className="glass-card rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <StatusBadge status="PENDING" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t.theme}
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

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; sub: string }> = {
    approved: {
      title: "Noch keine Vorlagen freigegeben",
      sub: "Reiche im Editor einen Workshop als Vorlage ein — Admins prüfen, dann erscheint sie hier.",
    },
    mine: {
      title: "Du hast noch nichts eingereicht",
      sub: "Im Workshop-Editor: Button 'Als Vorlage einreichen' oben rechts.",
    },
    pending: {
      title: "Keine offenen Anträge",
      sub: "Wenn jemand eine Vorlage einreicht, erscheint sie hier zur Prüfung.",
    },
  };
  const m = messages[tab];
  return (
    <div className="glass-card flex flex-col items-center rounded-2xl p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20">
        <Award className="size-5 text-[var(--neon-violet)]" />
      </div>
      <h2 className="mt-3 text-lg font-semibold">{m.title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{m.sub}</p>
    </div>
  );
}
