"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Clock3,
  CalendarDays,
  ListChecks,
  Package,
  User,
  Building2,
  Notebook,
  Layers,
  Columns3,
  StickyNote,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalcBlocks, sumChildDurations, totalDuration } from "@/lib/recalc";
import { formatDuration } from "@/lib/time";
import type { WorkshopWithBlocks } from "@/lib/queries";

type Block = WorkshopWithBlocks["days"][number]["blocks"][number];

export function PrintView({
  workshop,
  organization,
  trainerName,
}: {
  workshop: WorkshopWithBlocks;
  organization: { id: string; name: string; slug: string } | null;
  trainerName: string;
}) {
  const [autoPrintRequested, setAutoPrintRequested] = useState(false);

  useEffect(() => {
    // Auto-trigger the browser print dialog once on mount, but only if
    // requested via ?print=1 (so the user can browse the print view first
    // without the dialog popping immediately every time).
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "1" && !autoPrintRequested) {
      setAutoPrintRequested(true);
      // Slight delay so fonts and styles are loaded before the dialog opens
      const handle = setTimeout(() => window.print(), 400);
      return () => clearTimeout(handle);
    }
  }, [autoPrintRequested]);

  const day = workshop.days[0];
  const blocks = day?.blocks ?? [];
  const topBlocks = blocks.filter((b) => b.parentBlockId === null);
  const childrenByParent = new Map<string, Block[]>();
  for (const b of blocks) {
    if (b.parentBlockId) {
      const arr = childrenByParent.get(b.parentBlockId) ?? [];
      arr.push(b);
      childrenByParent.set(b.parentBlockId, arr);
    }
  }

  const recalcInputs = topBlocks.map((b) => {
    let effective = b.duration;
    if (b.type === "GROUP") {
      const ch = (childrenByParent.get(b.id) ?? []).filter(
        (c) => c.column === 0
      );
      effective = sumChildDurations(ch);
    } else if (b.type === "BREAKOUT") {
      const cols = new Map<number, number>();
      for (const c of childrenByParent.get(b.id) ?? []) {
        if (c.type === "NOTE") continue;
        cols.set(c.column, (cols.get(c.column) ?? 0) + c.duration);
      }
      effective = cols.size ? Math.max(...cols.values()) : 0;
    }
    return {
      id: b.id,
      position: b.position,
      duration: effective,
      locked: b.locked,
      startTime: b.startTime,
      type: b.type,
    };
  });
  const recalced = recalcBlocks(recalcInputs, day?.startTime ?? "09:00");
  const totalMinutes = totalDuration(
    recalcInputs.map((r) => ({ duration: r.duration, type: r.type }))
  );
  const startTime = day?.startTime ?? "09:00";
  const endTime = recalced.length
    ? recalced[recalced.length - 1].computedEndTime
    : startTime;

  const allTasks = blocks.flatMap((b) =>
    (b.tasks ?? []).map((t) => ({
      blockTitle: b.title || "Unbenannt",
      ...t,
    }))
  );
  const allMaterials = blocks.flatMap((b) => b.materials ?? []);
  // de-duplicate materials by id (in case block-level + workshop-level overlap later)
  const materialsById = new Map<string, (typeof allMaterials)[number]>();
  for (const m of allMaterials) materialsById.set(m.id, m);
  const uniqueMaterials = Array.from(materialsById.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // assigned trainers
  const trainersByBlock = topBlocks
    .filter((b) => b.assignedTo)
    .map((b) => ({
      blockTitle: b.title || "Unbenannt",
      person: b.assignedTo!,
    }));

  const dateStr = workshop.startDate
    ? new Date(workshop.startDate).toLocaleDateString("de-CH", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Datum offen";

  return (
    <main className="print-root mx-auto max-w-4xl bg-white px-10 py-12 text-black">
      {/* Toolbar — visible on screen, hidden in print */}
      <div className="print-hide mb-8 flex items-center justify-between border-b border-zinc-200 pb-4">
        <Link
          href={`/sessions/${workshop.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black"
        >
          <ArrowLeft className="size-4" />
          Zurück zum Editor
        </Link>
        <Button
          type="button"
          onClick={() => window.print()}
          className="bg-black text-white hover:bg-zinc-800"
        >
          <Printer className="size-4" />
          Drucken / Als PDF
        </Button>
      </div>

      {/* Header */}
      <header className="mb-8 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Sessions Workshop-Plan
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{workshop.title}</h1>
        {workshop.clientName ? (
          <p className="text-lg text-zinc-700">{workshop.clientName}</p>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <Meta icon={CalendarDays} label="Datum" value={dateStr} />
          <Meta
            icon={Clock3}
            label="Zeitfenster"
            value={`${startTime} – ${endTime}`}
            sub={totalMinutes > 0 ? formatDuration(totalMinutes) : undefined}
          />
          <Meta
            icon={ListChecks}
            label="Blöcke"
            value={`${topBlocks.length}`}
          />
          {organization ? (
            <Meta
              icon={Building2}
              label="Organisation"
              value={organization.name}
            />
          ) : null}
        </dl>

        {workshop.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {workshop.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-700"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <p className="pt-3 text-xs text-zinc-500">
          Erstellt von {trainerName} ·{" "}
          {new Date().toLocaleDateString("de-CH")}
        </p>
      </header>

      {/* Timeline */}
      <section className="mb-10 space-y-5 print-avoid-break">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Timeline
        </h2>
        <div className="space-y-4">
          {topBlocks.map((b, idx) => {
            const r = recalced[idx];
            const isGroup = b.type === "GROUP";
            const isBreakout = b.type === "BREAKOUT";
            const isNote = b.type === "NOTE";

            if (isNote) {
              return (
                <div
                  key={b.id}
                  className="flex items-start gap-3 rounded-lg border-l-4 border-yellow-300 bg-yellow-50 px-4 py-2 print-avoid-break"
                >
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-yellow-700" />
                  <div className="flex-1">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-yellow-800">
                      Notiz
                    </div>
                    <p className="text-sm">{b.title || "(leer)"}</p>
                  </div>
                </div>
              );
            }

            return (
              <article
                key={b.id}
                className="grid grid-cols-[100px_1fr] gap-4 print-avoid-break"
              >
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold tabular-nums">
                    {b.locked ? <Lock className="size-3" /> : null}
                    {r?.computedStartTime}
                  </div>
                  <div className="text-xs tabular-nums text-zinc-500">
                    bis {r?.computedEndTime}
                  </div>
                  <div className="mt-1 text-[11px] tabular-nums text-zinc-500">
                    {recalcInputs[idx]?.duration ?? b.duration} min
                  </div>
                </div>

                <div
                  className={
                    isGroup || isBreakout
                      ? "rounded-lg border-l-2 border-zinc-300 pl-4"
                      : "border-l-2 border-zinc-200 pl-4"
                  }
                >
                  <div className="flex items-start gap-2">
                    {isGroup ? <Layers className="mt-1 size-4" /> : null}
                    {isBreakout ? <Columns3 className="mt-1 size-4" /> : null}
                    <div className="flex-1">
                      <h3 className="text-base font-semibold leading-snug">
                        {b.title || "Unbenannt"}
                      </h3>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                        {b.category ? (
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="size-2 rounded-sm"
                              style={{ background: b.category.color }}
                            />
                            {b.category.name}
                          </span>
                        ) : null}
                        {b.assignedTo ? (
                          <span className="inline-flex items-center gap-1">
                            <User className="size-3" />
                            {b.assignedTo.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {b.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                      {b.description}
                    </p>
                  ) : null}

                  {b.notes ? (
                    <div className="mt-2 rounded border-l-2 border-violet-400 bg-violet-50 px-3 py-1.5">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-violet-700">
                        <Notebook className="mr-1 inline size-3" />
                        Trainer-Notiz
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs">
                        {b.notes}
                      </p>
                    </div>
                  ) : null}

                  {(b.tasks?.length ?? 0) > 0 ? (
                    <ul className="mt-2 space-y-0.5 text-xs">
                      {b.tasks.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-start gap-2 leading-snug"
                        >
                          <span className="mt-0.5 inline-block size-3 rounded border border-zinc-400" />
                          <span>{t.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {(b.materials?.length ?? 0) > 0 ? (
                    <p className="mt-2 text-xs text-zinc-600">
                      <Package className="mr-1 inline size-3" />
                      {b.materials
                        .map((m) =>
                          m.quantity ? `${m.quantity}× ${m.name}` : m.name
                        )
                        .join(" · ")}
                    </p>
                  ) : null}

                  {(isGroup || isBreakout) ? (
                    <ChildBlocks
                      block={b}
                      children={childrenByParent.get(b.id) ?? []}
                      parentStartTime={r?.computedStartTime ?? startTime}
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Aggregated material list */}
      {uniqueMaterials.length > 0 ? (
        <section className="mb-8 page-break-before print-avoid-break">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Material-Übersicht
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {uniqueMaterials.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <span className="inline-block size-3 rounded border border-zinc-400" />
                {m.quantity ? <span className="tabular-nums">{m.quantity}×</span> : null}
                <span>{m.name}</span>
                {m.notes ? (
                  <span className="text-xs text-zinc-500">— {m.notes}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Aggregated tasks */}
      {allTasks.length > 0 ? (
        <section className="mb-8 print-avoid-break">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Aufgaben-Übersicht
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {allTasks.map((t) => (
              <li key={t.id} className="flex items-start gap-2">
                <span className="mt-0.5 inline-block size-3 rounded border border-zinc-400" />
                <div>
                  <span>{t.text}</span>
                  <span className="ml-2 text-xs text-zinc-500">
                    ({t.blockTitle})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Trainer assignment overview */}
      {trainersByBlock.length > 0 ? (
        <section className="mb-8 print-avoid-break">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Trainer-Zuweisung
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {trainersByBlock.map((t, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="font-medium">{t.person.name}</span>
                <span className="text-zinc-500">— {t.blockTitle}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-12 border-t border-zinc-200 pt-4 text-[10px] uppercase tracking-wider text-zinc-400">
        Sessions · {workshop.title}
      </footer>
    </main>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        <Icon className="size-3" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums">
        {value}
        {sub ? <span className="ml-1 text-zinc-500">· {sub}</span> : null}
      </dd>
    </div>
  );
}

function ChildBlocks({
  block,
  children,
  parentStartTime,
}: {
  block: Block;
  children: Block[];
  parentStartTime: string;
}) {
  if (children.length === 0) return null;

  if (block.type === "GROUP") {
    const sequential = children
      .filter((c) => c.column === 0)
      .sort((a, b) => a.position - b.position);
    const recalced = recalcBlocks(
      sequential.map((c) => ({
        id: c.id,
        position: c.position,
        duration: c.duration,
        locked: c.locked,
        startTime: c.startTime,
        type: c.type,
      })),
      parentStartTime
    );
    return (
      <ol className="mt-3 space-y-2 border-l-2 border-zinc-200 pl-3 text-sm">
        {sequential.map((c, i) => {
          const cr = recalced[i];
          return (
            <li key={c.id} className="grid grid-cols-[80px_1fr] gap-3">
              <span className="text-right tabular-nums text-zinc-600">
                {cr?.computedStartTime}
                <span className="block text-[10px] text-zinc-400">
                  {c.duration}m
                </span>
              </span>
              <div>
                <div className="font-medium">
                  {c.title || (c.type === "NOTE" ? "Notiz" : "Unbenannt")}
                </div>
                {c.description ? (
                  <p className="mt-0.5 whitespace-pre-wrap text-xs text-zinc-600">
                    {c.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  // BREAKOUT — render parallel columns
  const cols = new Map<number, Block[]>();
  for (const c of children) {
    const arr = cols.get(c.column) ?? [];
    arr.push(c);
    cols.set(c.column, arr);
  }
  const colIndices = Array.from(cols.keys()).sort((a, b) => a - b);

  return (
    <div className="mt-3 space-y-2">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${colIndices.length}, minmax(0, 1fr))` }}>
        {colIndices.map((ci) => {
          const colChildren = (cols.get(ci) ?? []).sort(
            (a, b) => a.position - b.position
          );
          const colTotal = colChildren
            .filter((c) => c.type !== "NOTE")
            .reduce((s, c) => s + c.duration, 0);
          return (
            <div
              key={ci}
              className="rounded border border-zinc-200 px-2 py-1.5"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Track {ci + 1} · {colTotal}m
              </div>
              <ul className="mt-1 space-y-1">
                {colChildren.map((c) => (
                  <li key={c.id} className="text-xs leading-snug">
                    <span className="font-medium">
                      {c.title || "(leer)"}
                    </span>
                    <span className="ml-1 tabular-nums text-zinc-500">
                      · {c.duration}m
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
