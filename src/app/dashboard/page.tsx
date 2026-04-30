import Link from "next/link";
import {
  Plus,
  Clock3,
  ListChecks,
  CalendarDays,
  Sparkles,
  Building2,
  Archive,
  Users,
} from "lucide-react";
import { auth } from "@/auth/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  listWorkshopsForUser,
  getOrganization,
  getOrganizationsInUnion,
  type WorkshopFilter,
} from "@/lib/queries";
import { createWorkshopAction } from "@/actions/workshop";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { WorkshopCardMenu } from "@/components/workshop-card-menu";

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
  RUNNING: "bg-[var(--neon-pink)] shadow-[0_0_8px_oklch(0.72_0.24_350/0.6)] animate-pulse",
  COMPLETED: "bg-[var(--neon-violet)]/60",
  ARCHIVED: "bg-muted-foreground/30",
};

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

function formatDate(d: Date | string | null): string {
  if (!d) return "Noch ohne Datum";
  return new Date(d).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const filter: WorkshopFilter = params.filter ?? "mine";

  const [userOrg, allOrgs, workshops] = await Promise.all([
    session.user.organizationId
      ? getOrganization(session.user.organizationId)
      : Promise.resolve(null),
    getOrganizationsInUnion(),
    listWorkshopsForUser(
      session.user.id,
      session.user.organizationId,
      filter
    ),
  ]);

  const unionOrg = allOrgs.find((o) => o.parentOrgId === null) ?? null;
  const sisterOrgs = allOrgs
    .filter(
      (o) =>
        o.parentOrgId === (unionOrg?.id ?? null) &&
        o.id !== session.user.organizationId
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plane, gestalte und führe deine Workshops.
          </p>
        </div>
        <form action={createWorkshopAction} className="w-full sm:w-auto">
          <input type="hidden" name="title" value="" />
          <input type="hidden" name="startTime" value="09:00" />
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white shadow-[0_8px_30px_-8px_oklch(0.65_0.26_295/_0.5)] hover:opacity-95 sm:w-auto"
          >
            <Plus className="size-4" />
            Neue Session
          </Button>
        </form>
      </div>

      <FilterTabs
        current={filter}
        userOrg={userOrg}
        unionOrgId={unionOrg?.id ?? null}
        sisterOrgs={sisterOrgs}
      />

      {workshops.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((s) => (
            <div
              key={s.id}
              className="group glass-card relative overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_oklch(0.65_0.26_295/_0.25)] sm:p-6"
            >
              <Link
                href={`/sessions/${s.id}`}
                className="absolute inset-0 z-0 rounded-2xl"
                aria-label={s.title || "Session öffnen"}
              />
              <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/15 to-[var(--neon-pink)]/15 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="pointer-events-none relative space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", STATUS_DOT[s.status])} />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(s.updatedAt)}
                    </span>
                    <WorkshopCardMenu
                      workshopId={s.id}
                      title={s.title}
                      isArchived={s.status === "ARCHIVED"}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-semibold leading-tight tracking-tight">
                    {s.title || (
                      <span className="text-muted-foreground/50">
                        Ohne Titel
                      </span>
                    )}
                  </h3>
                  {s.clientName ? (
                    <p className="text-sm text-muted-foreground">{s.clientName}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {s.organization ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Building2 className="size-2.5" />
                      {s.organization.name}
                    </span>
                  ) : null}
                  {!s.isMine && s.createdBy ? (
                    <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {s.createdBy.name}
                    </span>
                  ) : null}
                  {s.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {formatDate(s.startDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-3.5" />
                    {s.startTime}–{s.endTime}
                    {s.durationMinutes > 0 ? ` · ${formatDuration(s.durationMinutes)}` : ""}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ListChecks className="size-3.5" />
                    {s.blockCount}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filter === "mine" ? (
            <form action={createWorkshopAction}>
              <input type="hidden" name="title" value="" />
              <input type="hidden" name="startTime" value="09:00" />
              <button
                type="submit"
                className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/70 bg-background/30 text-sm text-muted-foreground transition-all hover:border-[var(--neon-violet)]/40 hover:bg-background/60 hover:text-foreground"
              >
                <Plus className="size-5" />
                Neue Session erstellen
              </button>
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FilterTabs({
  current,
  userOrg,
  unionOrgId,
  sisterOrgs,
}: {
  current: WorkshopFilter;
  userOrg: { id: string; name: string } | null;
  unionOrgId: string | null;
  sisterOrgs: Array<{ id: string; name: string }>;
}) {
  type Tab = {
    value: string;
    label: string;
    icon?: "users" | "org";
  };
  const tabs: Tab[] = [
    { value: "mine", label: "Meine" },
    { value: "all", label: "UNION", icon: "users" },
    ...(userOrg
      ? [
          {
            value: userOrg.id,
            label: userOrg.name,
            icon: "org" as const,
          },
        ]
      : []),
    ...sisterOrgs.map((o) => ({
      value: o.id,
      label: o.name,
      icon: "org" as const,
    })),
  ];
  // Note: unionOrgId is referenced for future "UNION direct" filter; kept as
  // prop so the page can pass it without re-fetching.
  void unionOrgId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/dashboard?filter=${t.value}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              current === t.value
                ? "bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            )}
          >
            {t.icon === "users" ? <Users className="size-3.5" /> : null}
            {t.icon === "org" ? <Building2 className="size-3.5" /> : null}
            {t.label}
          </Link>
        ))}
      </div>
      <Link
        href={`/dashboard?filter=archived`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
          current === "archived"
            ? "border-[var(--neon-violet)]/40 bg-[var(--neon-violet)]/[0.08] text-foreground"
            : "border-border/60 bg-background/40 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
        )}
      >
        <Archive className="size-3.5" />
        Archiv
      </Link>
    </div>
  );
}

function EmptyState({ filter }: { filter: WorkshopFilter }) {
  let label: string;
  if (filter === "mine") label = "Keine eigenen Sessions";
  else if (filter === "all") label = "Noch keine Sessions in der UNION";
  else if (filter === "archived") label = "Archiv ist leer";
  else label = "Keine Sessions in dieser Firma";

  return (
    <div className="glass-card mx-auto flex max-w-2xl flex-col items-center rounded-2xl p-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20">
        <Sparkles className="size-6 text-[var(--neon-violet)]" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{label}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Lege eine Session an, baue deine Timeline mit Drag-and-Drop, locke
        wichtige Zeitpunkte und behalte den Überblick im Live-Modus.
      </p>
      {filter !== "archived" ? (
        <form action={createWorkshopAction} className="mt-6">
          <input type="hidden" name="title" value="" />
          <input type="hidden" name="startTime" value="09:00" />
          <Button
            type="submit"
            size="lg"
            className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
          >
            <Plus className="size-4" />
            Neue Session erstellen
          </Button>
        </form>
      ) : null}
    </div>
  );
}
