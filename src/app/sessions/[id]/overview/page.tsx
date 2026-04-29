import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ListChecks,
  Package,
  Users,
  Building2,
} from "lucide-react";
import { auth } from "@/auth/auth";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  getWorkshopWithBlocks,
  getOrganization,
} from "@/lib/queries";
import { recalcBlocks, sumChildDurations, totalDuration } from "@/lib/recalc";
import { formatDuration } from "@/lib/time";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const workshop = await getWorkshopWithBlocks(id);
  if (!workshop) notFound();

  const userOrg = session.user.organizationId
    ? await getOrganization(session.user.organizationId)
    : null;

  const allBlocks = workshop.days.flatMap((d) => d.blocks);

  // ────── Per-day duration calc ──────
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
    };
  });

  const totalMinutes = days.reduce((s, d) => s + d.duration, 0);

  // ────── Aggregated tasks ──────
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

  // ────── Aggregated materials ──────
  const materials = allBlocks.flatMap((b) =>
    (b.materials ?? []).map((m) => ({
      ...m,
      blockTitle: b.title || "Unbenannt",
    }))
  );
  const materialsByName = new Map<
    string,
    { name: string; quantity: number | null; blocks: string[] }
  >();
  for (const m of materials) {
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

  // ────── Trainer assignments ──────
  const trainerMap = new Map<
    string,
    { name: string; blocks: string[] }
  >();
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

  // ────── Comment count ──────
  const totalComments = allBlocks.reduce(
    (s, b) => s + (b.comments?.length ?? 0),
    0
  );

  return (
    <div className="aurora-bg flex min-h-screen">
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
            href={`/sessions/${workshop.id}`}
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

        <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-8 py-8">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Workshop-Übersicht
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {workshop.title}
            </h1>
            {workshop.clientName ? (
              <p className="text-sm text-muted-foreground">
                {workshop.clientName}
              </p>
            ) : null}
          </div>

          {/* KPIs */}
          <div className="glass-card grid grid-cols-2 gap-4 rounded-2xl p-4 sm:grid-cols-4">
            <Stat
              icon={CalendarDays}
              label="Tage"
              value={`${days.length}`}
            />
            <Stat
              icon={Clock3}
              label="Gesamt"
              value={formatDuration(totalMinutes)}
            />
            <Stat
              icon={ListChecks}
              label="Aufgaben"
              value={`${doneTasks}/${totalTasks}`}
            />
            <Stat
              icon={Package}
              label="Materialien"
              value={`${aggregatedMaterials.length}`}
            />
          </div>

          {/* Days breakdown */}
          {days.length > 1 ? (
            <Section title="Tage">
              <ul className="space-y-2">
                {days.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {d.title || `Tag ${d.position + 1}`}
                      </span>
                      <span className="text-sm tabular-nums">
                        {d.startTime} – {d.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{d.blockCount} Blöcke</span>
                      <span className="tabular-nums">
                        {formatDuration(d.duration)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

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
                        <li
                          key={t.id}
                          className="flex items-start gap-2 text-sm"
                        >
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

          {/* Trainers */}
          {trainers.length > 0 ? (
            <Section title="Trainer-Zuweisungen">
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

          {/* Sharing + Org info */}
          <Section title="Workshop-Info">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {workshop.organizationId ? (
                <InfoRow
                  icon={Building2}
                  label="Organisation"
                  value={
                    workshop.shares.length > 0
                      ? `${workshop.organizationId} (geteilt mit ${workshop.shares.length})`
                      : "siehe Sidebar"
                  }
                />
              ) : null}
              <InfoRow
                icon={Users}
                label="Erstellt von"
                value={workshop.createdBy.name}
              />
              {totalComments > 0 ? (
                <InfoRow
                  icon={Users}
                  label="Kommentare"
                  value={`${totalComments} insgesamt`}
                />
              ) : null}
            </div>
          </Section>
        </main>
      </div>
    </div>
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
