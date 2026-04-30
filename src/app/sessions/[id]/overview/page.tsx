import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  AlignLeft,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  History,
  ListChecks,
  MessageCircle,
  Notebook,
  Package,
  Radio,
  Share2,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { auth } from "@/auth/auth";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  getWorkshopHeader,
  getWorkshopWithBlocks,
  getWorkshopLinks,
  getOrganization,
  listWorkshopVersions,
} from "@/lib/queries";
import { listEndedLiveSessionsForWorkshop } from "@/lib/debrief";
import { recalcBlocks, sumChildDurations, totalDuration } from "@/lib/recalc";
import { formatDuration } from "@/lib/time";
import { detectLinkKind, safeHost } from "@/lib/link-icon";
import { getMethodCategoryAccent } from "@/lib/method-categories";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Entwurf",
  SCHEDULED: "Geplant",
  RUNNING: "Läuft",
  COMPLETED: "Abgeschlossen",
  ARCHIVED: "Archiviert",
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: "bg-muted-foreground/40",
  SCHEDULED: "bg-[var(--neon-cyan)] shadow-[0_0_8px_oklch(0.82_0.16_200/0.6)]",
  RUNNING:
    "bg-[var(--neon-pink)] shadow-[0_0_8px_oklch(0.72_0.24_350/0.6)] animate-pulse",
  COMPLETED: "bg-[var(--neon-violet)]/60",
  ARCHIVED: "bg-muted-foreground/30",
};

const BLOCK_TYPE_LABEL: Record<string, string> = {
  BLOCK: "Block",
  GROUP: "Gruppe",
  BREAKOUT: "Breakout",
  NOTE: "Notiz",
};

function formatDate(d: Date | null | string): string {
  if (!d) return "Noch ohne Datum";
  return new Date(d).toLocaleDateString("de-CH", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `vor ${days} Tagen`;
  return d.toLocaleDateString("de-CH");
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userOrg = session.user.organizationId
    ? await getOrganization(session.user.organizationId)
    : null;

  return (
    <div className="aurora-bg flex min-h-screen" suppressHydrationWarning>
      <Sidebar
        user={{
          name: session.user.name ?? "Trainer",
          username: session.user.username,
          role: session.user.role,
          organizationName: userOrg?.name ?? null,
        }}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-8 backdrop-blur-xl">
          <Link
            href={`/sessions/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Zurück zum Editor
          </Link>
          <UserMenu
            user={{
              name: session.user.name ?? "Trainer",
              email: session.user.email ?? "",
              role: session.user.role,
            }}
          />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-8 py-8">
          <Suspense fallback={<HeroSkeleton />}>
            <OverviewHero id={id} />
          </Suspense>
          <Suspense fallback={<BodySkeleton />}>
            <OverviewBody id={id} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// ──────────────────── HERO ────────────────────

async function OverviewHero({ id }: { id: string }) {
  const workshop = await getWorkshopHeader(id);
  if (!workshop) notFound();

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[var(--neon-cyan)]/5 via-[var(--neon-violet)]/5 to-[var(--neon-pink)]/5 p-8">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-pink)]/20 blur-3xl" />
        <div className="relative space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Workshop-Übersicht
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-background/60 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider backdrop-blur",
                workshop.status === "RUNNING"
                  ? "text-[var(--neon-pink)]"
                  : workshop.status === "SCHEDULED"
                  ? "text-[var(--neon-cyan)]"
                  : "text-muted-foreground"
              )}
            >
              <span className={cn("size-2 rounded-full", STATUS_DOT[workshop.status])} />
              {STATUS_LABEL[workshop.status]}
            </span>
            {workshop.organization ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur">
                <Building2 className="size-2.5" />
                {workshop.organization.name}
              </span>
            ) : null}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            {workshop.title}
          </h1>
          {workshop.clientName ? (
            <p className="text-base text-muted-foreground">
              {workshop.clientName}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(workshop.startDate)}
            </span>
          </div>
          {workshop.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {workshop.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-xs text-muted-foreground backdrop-blur"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {workshop.goals || workshop.description ? (
        <div className="glass-card space-y-4 rounded-2xl p-5">
          {workshop.goals ? (
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 size-4 shrink-0 text-[var(--neon-violet)]" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
                  Zielsetzung
                </div>
                <p className="mt-1 text-sm">{workshop.goals}</p>
              </div>
            </div>
          ) : null}
          {workshop.goals && workshop.description ? (
            <div className="border-t border-border/40" />
          ) : null}
          {workshop.description ? (
            <div className="flex items-start gap-3">
              <AlignLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
                  Beschreibung
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {workshop.description}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function HeroSkeleton() {
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[var(--neon-cyan)]/5 via-[var(--neon-violet)]/5 to-[var(--neon-pink)]/5 p-8">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-pink)]/20 blur-3xl" />
        <div className="relative space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-muted/30" />
          <div className="h-6 w-32 animate-pulse rounded-full bg-muted/20" />
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted/20" />
        </div>
      </div>
      <div className="glass-card h-32 animate-pulse rounded-2xl" />
    </>
  );
}

// ──────────────────── BODY ────────────────────

async function OverviewBody({ id }: { id: string }) {
  const [workshop, links, versions, liveSessions] = await Promise.all([
    getWorkshopWithBlocks(id),
    getWorkshopLinks(id),
    listWorkshopVersions(id),
    listEndedLiveSessionsForWorkshop(id),
  ]);
  if (!workshop) notFound();

  const allBlocks = workshop.days.flatMap((d) => d.blocks);
  const topBlocks = allBlocks.filter((b) => b.parentBlockId === null);

  // ────── Per-day duration calc + per-block timeline ──────
  const days = workshop.days.map((d) => {
    const top = d.blocks.filter((b) => b.parentBlockId === null);
    const childrenByParent = new Map<string, typeof d.blocks>();
    for (const b of d.blocks) {
      if (b.parentBlockId) {
        const arr = childrenByParent.get(b.parentBlockId) ?? [];
        arr.push(b);
        childrenByParent.set(b.parentBlockId, arr);
      }
    }
    const inputs = top.map((b) => {
      let eff = b.duration;
      if (b.type === "GROUP") {
        const ch = (childrenByParent.get(b.id) ?? []).filter(
          (c) => c.column === 0
        );
        eff = sumChildDurations(ch);
      } else if (b.type === "BREAKOUT") {
        const cols = new Map<number, number>();
        for (const c of childrenByParent.get(b.id) ?? []) {
          if (c.type === "NOTE") continue;
          cols.set(c.column, (cols.get(c.column) ?? 0) + c.duration);
        }
        eff = cols.size ? Math.max(...cols.values()) : 0;
      }
      return {
        id: b.id,
        position: b.position,
        duration: eff,
        locked: b.locked,
        startTime: b.startTime,
        type: b.type,
      };
    });
    const recalced = recalcBlocks(inputs, d.startTime);
    const recalcById = new Map(recalced.map((r) => [r.id, r]));
    const enrichedTop = top.map((b) => {
      const rc = recalcById.get(b.id);
      const eff = inputs.find((i) => i.id === b.id)?.duration ?? b.duration;
      return {
        ...b,
        startTime: rc?.computedStartTime ?? d.startTime,
        endTime: rc?.computedEndTime ?? d.startTime,
        effectiveDuration: eff,
        children: childrenByParent.get(b.id) ?? [],
      };
    });
    return {
      id: d.id,
      title: d.title,
      position: d.position,
      startTime: d.startTime,
      endTime:
        recalced.length > 0
          ? recalced[recalced.length - 1].computedEndTime
          : d.startTime,
      blockCount: top.length,
      duration: totalDuration(
        inputs.map((i) => ({ duration: i.duration, type: i.type }))
      ),
      enrichedTop,
    };
  });

  const totalMinutes = days.reduce((s, d) => s + d.duration, 0);

  const tasksByBlock = allBlocks
    .filter((b) => (b.tasks?.length ?? 0) > 0)
    .map((b) => ({
      blockId: b.id,
      blockTitle: b.title || "Unbenannt",
      tasks: b.tasks ?? [],
    }));
  const totalTasks = tasksByBlock.reduce((s, b) => s + b.tasks.length, 0);
  const doneTasks = tasksByBlock.reduce(
    (s, b) => s + b.tasks.filter((t) => t.done).length,
    0
  );

  const allMaterials = allBlocks.flatMap((b) =>
    (b.materials ?? []).map((m) => ({
      ...m,
      blockTitle: b.title || "Unbenannt",
    }))
  );
  const physicalMaterials = allMaterials.filter((m) => !m.url);
  const blockLinks = allMaterials.filter((m) => m.url);

  const materialsByName = new Map<
    string,
    { name: string; quantity: number | null; blocks: string[] }
  >();
  for (const m of physicalMaterials) {
    const existing = materialsByName.get(m.name);
    if (existing) {
      existing.quantity =
        (existing.quantity ?? 0) + (m.quantity ?? 0) || existing.quantity;
      existing.blocks.push(m.blockTitle);
    } else {
      materialsByName.set(m.name, {
        name: m.name,
        quantity: m.quantity,
        blocks: [m.blockTitle],
      });
    }
  }
  const aggregatedMaterials = Array.from(materialsByName.values()).sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  const trainerMap = new Map<string, { name: string; blocks: string[] }>();
  for (const b of allBlocks) {
    if (b.assignedTo) {
      const existing = trainerMap.get(b.assignedTo.id);
      if (existing) {
        existing.blocks.push(b.title || "Unbenannt");
      } else {
        trainerMap.set(b.assignedTo.id, {
          name: b.assignedTo.name,
          blocks: [b.title || "Unbenannt"],
        });
      }
    }
  }
  const trainers = Array.from(trainerMap.values());

  const blocksWithNotes = allBlocks
    .filter((b) => b.notes && b.notes.trim().length > 0)
    .map((b) => ({
      blockId: b.id,
      blockTitle: b.title || "Unbenannt",
      notes: b.notes ?? "",
    }));

  const categoryMap = new Map<
    string,
    { name: string; color: string; minutes: number }
  >();
  let uncategorisedMinutes = 0;
  for (const day of days) {
    for (const b of day.enrichedTop) {
      if (b.type === "NOTE") continue;
      const minutes = b.effectiveDuration;
      if (minutes <= 0) continue;
      if (b.category) {
        const existing = categoryMap.get(b.category.id);
        if (existing) {
          existing.minutes += minutes;
        } else {
          categoryMap.set(b.category.id, {
            name: b.category.name,
            color: b.category.color,
            minutes,
          });
        }
      } else {
        uncategorisedMinutes += minutes;
      }
    }
  }
  const categoryRows = Array.from(categoryMap.values()).sort(
    (a, b) => b.minutes - a.minutes
  );
  if (uncategorisedMinutes > 0) {
    categoryRows.push({
      name: "Ohne Kategorie",
      color: "oklch(0.70 0.04 280)",
      minutes: uncategorisedMinutes,
    });
  }

  const methodMap = new Map<
    string,
    { title: string; category: string | null; count: number }
  >();
  for (const b of allBlocks) {
    if (b.method) {
      const existing = methodMap.get(b.method.id);
      if (existing) {
        existing.count += 1;
      } else {
        methodMap.set(b.method.id, {
          title: b.method.title,
          category: b.method.category,
          count: 1,
        });
      }
    }
  }
  const methodsUsed = Array.from(methodMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  const totalComments = allBlocks.reduce(
    (s, b) => s + (b.comments?.length ?? 0),
    0
  );

  return (
    <>
      {/* Pills row above KPIs (live counter + auswertung CTA) */}
      <div className="flex flex-wrap items-center gap-2">
        {liveSessions.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--neon-pink)]/30 bg-[var(--neon-pink)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--neon-pink)]">
            <Radio className="size-2.5" />
            {liveSessions.length}× live durchgeführt
          </span>
        ) : null}
        {workshop.status === "COMPLETED" ? (
          <Link
            href={`/sessions/${workshop.id}/debrief`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/[0.08] px-3 py-1.5 text-xs font-medium text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/15"
          >
            <ClipboardCheck className="size-3.5" />
            Auswertung
          </Link>
        ) : null}
      </div>

      {/* KPIs */}
      <div className="glass-card grid grid-cols-2 gap-4 rounded-2xl p-4 sm:grid-cols-4">
        <Stat icon={CalendarDays} label="Tage" value={`${days.length}`} />
        <Stat
          icon={Clock3}
          label="Gesamt"
          value={formatDuration(totalMinutes)}
        />
        <Stat
          icon={ListChecks}
          label="Blöcke"
          value={`${topBlocks.length}`}
        />
        <Stat
          icon={Package}
          label="Materialien"
          value={`${aggregatedMaterials.length}`}
        />
      </div>

      {/* Timeline */}
      {days.some((d) => d.enrichedTop.length > 0) ? (
        <Section title="Zeitlicher Verlauf">
          <div className="space-y-3">
            {days.map((d) => {
              const dayMinutes = d.duration;
              if (dayMinutes <= 0) return null;
              return (
                <div key={d.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {d.title || `Tag ${d.position + 1}`}
                    </span>
                    <span className="tabular-nums">
                      {d.startTime} – {d.endTime} · {formatDuration(dayMinutes)}
                    </span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-background/60">
                    {d.enrichedTop
                      .filter(
                        (b) => b.type !== "NOTE" && b.effectiveDuration > 0
                      )
                      .map((b, i) => {
                        const pct = (b.effectiveDuration / dayMinutes) * 100;
                        const color =
                          b.category?.color ?? "oklch(0.70 0.04 280)";
                        return (
                          <div
                            key={b.id}
                            title={`${b.title || "Unbenannt"} · ${formatDuration(
                              b.effectiveDuration
                            )}`}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                            }}
                            className={cn(
                              "transition-opacity hover:opacity-80",
                              i > 0 && "border-l border-background/40"
                            )}
                          />
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Categories */}
      {categoryRows.length > 0 && totalMinutes > 0 ? (
        <Section title="Kategorien-Verteilung">
          <ul className="space-y-2">
            {categoryRows.map((c) => {
              const pct = (c.minutes / totalMinutes) * 100;
              return (
                <li key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium">{c.name}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatDuration(c.minutes)} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
                    <div
                      style={{
                        width: `${pct}%`,
                        backgroundColor: c.color,
                      }}
                      className="h-full"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {/* Tools & Links */}
      {links.length > 0 || blockLinks.length > 0 ? (
        <Section title={`Tools & Links (${links.length + blockLinks.length})`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {links.map((l) => (
              <LinkCard
                key={l.id}
                name={l.name}
                url={l.url}
                notes={l.notes}
                blockTitle={null}
              />
            ))}
            {blockLinks.map((l) => (
              <LinkCard
                key={l.id}
                name={l.name}
                url={l.url ?? ""}
                notes={l.notes}
                blockTitle={l.blockTitle}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Methods */}
      {methodsUsed.length > 0 ? (
        <Section title={`Methoden im Einsatz (${methodsUsed.length})`}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {methodsUsed.map((m) => {
              const accent = getMethodCategoryAccent(m.category);
              return (
                <div
                  key={m.title}
                  className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-background/40 p-3"
                  style={{ borderLeft: `3px solid ${accent}` }}
                >
                  <Sparkles
                    className="size-4 shrink-0"
                    style={{ color: accent }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {m.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.category ?? "Sonstige"} · {m.count}× verwendet
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Block list */}
      <Section title="Ablauf">
        <div className="space-y-5">
          {days.map((d) => (
            <div key={d.id} className="space-y-2">
              {days.length > 1 ? (
                <div className="flex items-baseline justify-between border-b border-border/40 pb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                    {d.title || `Tag ${d.position + 1}`}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {d.startTime} – {d.endTime} · {formatDuration(d.duration)}
                  </span>
                </div>
              ) : null}
              <ul className="space-y-1.5">
                {d.enrichedTop.map((b) => (
                  <BlockRow key={b.id} block={b} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Tasks */}
      {totalTasks > 0 ? (
        <Section title={`Aufgaben (${doneTasks}/${totalTasks} erledigt)`}>
          <div className="space-y-3">
            {tasksByBlock.map((b) => (
              <div
                key={b.blockId}
                className="rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {b.blockTitle}
                </div>
                <ul className="space-y-1">
                  {b.tasks.map((t) => (
                    <li key={t.id} className="flex items-start gap-2 text-sm">
                      <span
                        className={
                          t.done
                            ? "mt-0.5 inline-flex size-3.5 items-center justify-center rounded border border-[var(--neon-violet)] bg-[var(--neon-violet)] text-white"
                            : "mt-0.5 inline-block size-3.5 rounded border border-zinc-400"
                        }
                      >
                        {t.done ? (
                          <svg
                            viewBox="0 0 16 16"
                            className="size-2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M3 8l3 3 7-7" />
                          </svg>
                        ) : null}
                      </span>
                      <span
                        className={
                          t.done
                            ? "text-muted-foreground line-through"
                            : ""
                        }
                      >
                        {t.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Materials */}
      {aggregatedMaterials.length > 0 ? (
        <Section title={`Materialien (${aggregatedMaterials.length})`}>
          <ul className="space-y-1.5">
            {aggregatedMaterials.map((m) => (
              <li
                key={m.name}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
              >
                <span className="inline-block size-3 rounded border border-zinc-400" />
                {m.quantity ? (
                  <span className="tabular-nums">{m.quantity}×</span>
                ) : null}
                <span className="font-medium">{m.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {m.blocks.length === 1
                    ? m.blocks[0]
                    : `${m.blocks.length} Blöcke`}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Trainer notes */}
      {blocksWithNotes.length > 0 ? (
        <Section title={`Trainer-Notizen (${blocksWithNotes.length})`}>
          <div className="space-y-2">
            {blocksWithNotes.map((b) => (
              <div
                key={b.blockId}
                className="rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Notebook className="size-3" />
                  {b.blockTitle}
                </div>
                <p className="whitespace-pre-wrap text-sm">{b.notes}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Trainers */}
      {trainers.length > 0 ? (
        <Section title={`Trainer-Zuweisungen (${trainers.length})`}>
          <ul className="space-y-2">
            {trainers.map((t) => (
              <li
                key={t.name}
                className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Users className="size-3.5 text-muted-foreground" />
                  {t.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    · {t.blocks.length} Blöcke
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.blocks.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Meta */}
      <Section title="Meta-Info">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {workshop.organization ? (
            <InfoRow
              icon={Building2}
              label="Organisation"
              value={workshop.organization.name}
            />
          ) : null}
          <InfoRow
            icon={Users}
            label="Erstellt von"
            value={workshop.createdBy.name}
          />
          <InfoRow
            icon={CalendarDays}
            label="Angelegt am"
            value={formatDateTime(workshop.createdAt)}
          />
          <InfoRow
            icon={History}
            label="Zuletzt bearbeitet"
            value={relativeTime(workshop.updatedAt)}
          />
          {workshop.shares.length > 0 ? (
            <InfoRow
              icon={Share2}
              label="Geteilt mit"
              value={workshop.shares.map((s) => s.user.name).join(", ")}
            />
          ) : null}
          {versions.length > 0 ? (
            <InfoRow
              icon={History}
              label="Versionen"
              value={`${versions.length} gespeichert`}
            />
          ) : null}
          {liveSessions.length > 0 ? (
            <InfoRow
              icon={Radio}
              label="Live durchgeführt"
              value={`${liveSessions.length}×`}
            />
          ) : null}
          {totalComments > 0 ? (
            <InfoRow
              icon={MessageCircle}
              label="Kommentare"
              value={`${totalComments} insgesamt`}
            />
          ) : null}
        </div>
      </Section>
    </>
  );
}

function BodySkeleton() {
  return (
    <>
      <div className="glass-card grid grid-cols-2 gap-4 rounded-2xl p-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-12 animate-pulse rounded bg-muted/30" />
            <div className="h-7 w-16 animate-pulse rounded bg-muted/30" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded bg-muted/20" />
        <div className="h-3 w-full animate-pulse rounded-full bg-muted/30" />
      </div>
      <div className="glass-card h-48 animate-pulse rounded-2xl" />
      <div className="glass-card h-64 animate-pulse rounded-2xl" />
    </>
  );
}

// ──────────────────── Shared components ────────────────────

function BlockRow({
  block,
}: {
  block: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    duration: number;
    effectiveDuration: number;
    startTime: string;
    endTime: string;
    locked: boolean;
    category: { id: string; name: string; color: string } | null;
    method: { id: string; title: string; category: string | null } | null;
    assignedTo: { id: string; name: string } | null;
    children: Array<{
      id: string;
      title: string;
      type: string;
      duration: number;
      column: number;
    }>;
  };
}) {
  const isNote = block.type === "NOTE";
  const accent = block.category?.color ?? "oklch(0.70 0.04 280)";

  return (
    <li
      className={cn(
        "rounded-xl border border-border/40 bg-background/40 p-3",
        isNote && "border-dashed bg-background/20"
      )}
      style={
        !isNote && block.category
          ? { borderLeft: `3px solid ${accent}` }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {block.startTime}
              {!isNote && block.endTime ? `–${block.endTime}` : ""}
            </span>
            {block.type !== "BLOCK" ? (
              <span className="rounded-full border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {BLOCK_TYPE_LABEL[block.type] ?? block.type}
              </span>
            ) : null}
            {block.category ? (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${accent}26`,
                  color: accent,
                }}
              >
                {block.category.name}
              </span>
            ) : null}
            {block.method ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neon-violet)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--neon-violet)]">
                <Sparkles className="size-2.5" />
                {block.method.title}
              </span>
            ) : null}
            {block.locked ? (
              <span className="text-[10px] text-muted-foreground">🔒</span>
            ) : null}
          </div>
          <h3
            className={cn(
              "mt-1 text-sm font-medium",
              isNote && "italic text-muted-foreground"
            )}
          >
            {block.title || (isNote ? "Notiz" : "Unbenannt")}
          </h3>
          {block.description && !isNote ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {block.description}
            </p>
          ) : null}
          {block.children.length > 0 ? (
            <ul className="mt-2 space-y-0.5 border-l border-border/40 pl-3 text-xs text-muted-foreground">
              {block.children
                .sort((a, b) => a.column - b.column)
                .map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span className="tabular-nums">{c.duration}m</span>
                    <span>{c.title || "Unbenannt"}</span>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {!isNote ? (
            <span className="text-xs font-medium tabular-nums">
              {formatDuration(block.effectiveDuration)}
            </span>
          ) : null}
          {block.assignedTo ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="size-2.5" />
              {block.assignedTo.name}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function LinkCard({
  name,
  url,
  notes,
  blockTitle,
}: {
  name: string;
  url: string;
  notes: string | null;
  blockTitle: string | null;
}) {
  const meta = detectLinkKind(url);
  const host = safeHost(url) ?? url;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/40 p-3 transition-colors hover:border-border/80"
      style={{ borderLeft: `3px solid ${meta.accent}` }}
    >
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold uppercase"
        style={{ backgroundColor: `${meta.accent}26`, color: meta.accent }}
      >
        {meta.label.slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-[var(--neon-violet)]" />
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {meta.label} · {host}
          {blockTitle ? ` · ${blockTitle}` : null}
        </div>
        {notes ? (
          <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/80">
            {notes}
          </div>
        ) : null}
      </div>
    </a>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
