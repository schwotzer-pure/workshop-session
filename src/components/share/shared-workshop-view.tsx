import {
  AlignLeft,
  Building2,
  CalendarDays,
  Clock3,
  ExternalLink,
  Layers,
  ListChecks,
  Package,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import {
  recalcBlocks,
  sumChildDurations,
  maxColumnDuration,
  totalDuration,
} from "@/lib/recalc";
import { formatDuration } from "@/lib/time";
import { detectLinkKind, safeHost } from "@/lib/link-icon";
import { MarkdownView } from "@/components/ui/markdown-view";
import { cn } from "@/lib/utils";
import type { SharedWorkshop } from "@/lib/queries";

type Block = SharedWorkshop["days"][number]["blocks"][number];

/** Normalised board shape — works for both share-link and overview contexts. */
export type ViewBoard = {
  id: string;
  title: string;
  url: string;
  kind?: string | null;
  tags?: string[];
};

/** Workshop subset that both `SharedWorkshop` and `WorkshopWithBlocks` satisfy. */
type ViewWorkshop = {
  title: string;
  goals: string | null;
  description: string | null;
  clientName: string | null;
  tags: string[];
  startDate: Date | string | null;
  organization: { name: string } | null;
  createdBy: { name: string };
  days: SharedWorkshop["days"];
};

function formatDate(d: Date | string | null): string {
  if (!d) return "Noch ohne Datum";
  return new Date(d).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function effectiveDuration(block: Block, children: Block[]): number {
  if (block.type === "NOTE") return 0;
  if (block.type === "GROUP") {
    return sumChildDurations(children.filter((c) => c.column === 0));
  }
  if (block.type === "BREAKOUT") {
    return maxColumnDuration(children);
  }
  return block.duration;
}

export function SharedWorkshopView({
  workshop,
  boards,
}: {
  workshop: ViewWorkshop;
  /** Pass the boards separately. For share-pages, derive from workshop.boards. */
  boards?: ViewBoard[];
}) {
  const boardList: ViewBoard[] = boards ?? [];
  const day = workshop.days[0];
  const allBlocks = day?.blocks ?? [];
  const topBlocks = allBlocks.filter((b) => b.parentBlockId === null);
  const totalMin = totalDuration(
    topBlocks.map((b) => ({
      duration: effectiveDuration(
        b,
        allBlocks.filter((c) => c.parentBlockId === b.id)
      ),
      type: b.type,
    }))
  );

  const recalced = day
    ? recalcBlocks(
        topBlocks.map((b) => ({
          id: b.id,
          position: b.position,
          duration: effectiveDuration(
            b,
            allBlocks.filter((c) => c.parentBlockId === b.id)
          ),
          locked: b.locked,
          startTime: b.startTime,
          type: b.type,
        })),
        day.startTime
      )
    : [];

  const blockCount = topBlocks.filter((b) => b.type !== "NOTE").length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[var(--neon-cyan)]/5 via-[var(--neon-violet)]/5 to-[var(--neon-pink)]/5 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-pink)]/20 blur-3xl" />
        <div className="relative space-y-4">
          {workshop.organization ? (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Building2 className="size-3" />
              {workshop.organization.name}
            </div>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {workshop.title || "Ohne Titel"}
          </h1>
          {workshop.clientName ? (
            <p className="text-base text-muted-foreground">
              {workshop.clientName}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(workshop.startDate)}
            </span>
            {day ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                Start {day.startTime}
                {totalMin > 0 ? ` · ${formatDuration(totalMin)}` : ""}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <ListChecks className="size-3.5" />
              {blockCount} {blockCount === 1 ? "Block" : "Blöcke"}
            </span>
          </div>

          {workshop.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {workshop.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Goals + Description */}
      {workshop.goals || workshop.description ? (
        <div className="glass-card space-y-4 rounded-2xl p-5">
          {workshop.goals ? (
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 size-4 shrink-0 text-[var(--neon-violet)]" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
                  Zielsetzung
                </div>
                <MarkdownView className="mt-1" compact>
                  {workshop.goals}
                </MarkdownView>
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
                <MarkdownView className="mt-1 text-muted-foreground">
                  {workshop.description}
                </MarkdownView>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Boards */}
      {boardList.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-[var(--neon-cyan)]" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
              Tools & Links
            </h2>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {boardList.map((b) => {
              const kind = detectLinkKind(b.url);
              return (
                <li key={b.id}>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card flex items-center gap-3 rounded-xl p-3 transition-colors hover:border-[var(--neon-violet)]/30"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold uppercase"
                      style={{
                        background: `color-mix(in oklch, ${kind.accent} 15%, transparent)`,
                        color: kind.accent,
                      }}
                    >
                      {kind.label.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {b.title}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {safeHost(b.url)}
                      </div>
                    </div>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/60" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Timeline */}
      {topBlocks.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--neon-violet)]" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
              Ablauf
            </h2>
          </div>
          <ol className="space-y-2">
            {topBlocks
              .sort((a, b) => a.position - b.position)
              .map((b, idx) => (
                <BlockRow
                  key={b.id}
                  block={b}
                  computedStartTime={recalced[idx]?.computedStartTime ?? day?.startTime ?? "—"}
                  computedEndTime={recalced[idx]?.computedEndTime ?? "—"}
                  childBlocks={allBlocks.filter((c) => c.parentBlockId === b.id)}
                  allBlocks={allBlocks}
                />
              ))}
          </ol>
        </section>
      ) : null}

      {topBlocks.length === 0 ? (
        <div className="glass-card mx-auto max-w-md rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Für diese Session sind noch keine Inhalte erfasst.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-muted-foreground/70">
        <Users className="size-3" />
        Erstellt von {workshop.createdBy.name}
      </div>
    </div>
  );
}

function BlockRow({
  block,
  computedStartTime,
  computedEndTime,
  childBlocks,
  allBlocks,
}: {
  block: Block;
  computedStartTime: string;
  computedEndTime: string;
  childBlocks: Block[];
  allBlocks: Block[];
}) {
  if (block.type === "NOTE") {
    return (
      <li className="rounded-xl border border-[oklch(0.85_0.16_95)]/40 bg-[oklch(0.96_0.08_95)]/60 px-4 py-2.5 text-sm text-[oklch(0.30_0.05_85)]">
        {block.title || "Notiz"}
      </li>
    );
  }

  const accent = block.category?.color;
  const isContainer = block.type === "GROUP" || block.type === "BREAKOUT";

  return (
    <li
      className={cn(
        "glass-card relative overflow-hidden rounded-xl",
        isContainer ? "border-[var(--neon-violet)]/20" : ""
      )}
    >
      <div className="flex gap-3 p-4">
        <div className="flex w-16 shrink-0 flex-col items-end gap-0.5 tabular-nums">
          <span className="text-sm font-medium">{computedStartTime}</span>
          <span className="text-[11px] text-muted-foreground/70">
            {computedEndTime}
          </span>
        </div>

        {accent ? (
          <div
            className="w-1 shrink-0 self-stretch rounded-full"
            style={{ background: accent }}
          />
        ) : (
          <div className="w-1 shrink-0" />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug tracking-tight">
              {block.title || (
                <span className="text-muted-foreground/50">Ohne Titel</span>
              )}
            </h3>
            <span className="shrink-0 rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {formatDuration(
                block.type === "GROUP" || block.type === "BREAKOUT"
                  ? effectiveDuration(block, childBlocks)
                  : block.duration
              )}
            </span>
          </div>

          {block.category ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className="size-2 rounded-sm"
                style={{ background: block.category.color }}
              />
              {block.category.name}
            </div>
          ) : null}

          {block.description ? (
            <MarkdownView className="text-[13px] text-muted-foreground" compact>
              {block.description}
            </MarkdownView>
          ) : null}

          {block.tasks.length > 0 ? (
            <ul className="ml-1 space-y-0.5 text-xs text-muted-foreground">
              {block.tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-1.5">
                  <span className="mt-0.5">{t.done ? "✓" : "○"}</span>
                  <span className={t.done ? "line-through opacity-60" : ""}>
                    {t.text}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {block.materials.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <Package className="size-3" />
              {block.materials.map((m, i) => (
                <span key={m.id}>
                  {m.url ? (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--neon-violet)] underline-offset-2 hover:underline"
                    >
                      {m.name}
                    </a>
                  ) : (
                    m.name
                  )}
                  {m.quantity ? ` (${m.quantity}×)` : ""}
                  {i < block.materials.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>
          ) : null}

          {/* Container children */}
          {block.type === "GROUP" && childBlocks.length > 0 ? (
            <ol className="mt-3 space-y-1.5 border-l border-[var(--neon-violet)]/15 pl-3">
              {childBlocks
                .sort((a, b) => a.position - b.position)
                .map((c) => (
                  <BlockRow
                    key={c.id}
                    block={c}
                    computedStartTime="·"
                    computedEndTime=""
                    childBlocks={allBlocks.filter((x) => x.parentBlockId === c.id)}
                    allBlocks={allBlocks}
                  />
                ))}
            </ol>
          ) : null}

          {block.type === "BREAKOUT" && childBlocks.length > 0 ? (
            <BreakoutTracks childBlocks={childBlocks} allBlocks={allBlocks} />
          ) : null}
        </div>
      </div>
    </li>
  );
}

function BreakoutTracks({
  childBlocks,
  allBlocks,
}: {
  childBlocks: Block[];
  allBlocks: Block[];
}) {
  const cols = new Map<number, Block[]>();
  for (const c of childBlocks) {
    const arr = cols.get(c.column) ?? [];
    arr.push(c);
    cols.set(c.column, arr);
  }
  const colIndices = Array.from(cols.keys()).sort((a, b) => a - b);
  return (
    <div className="mt-3 flex flex-col gap-3 md:grid"
      style={{ gridTemplateColumns: `repeat(${colIndices.length}, minmax(0, 1fr))` }}
    >
      {colIndices.map((ci) => {
        const colBlocks = (cols.get(ci) ?? []).sort((a, b) => a.position - b.position);
        return (
          <div key={ci} className="space-y-1.5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Track {ci + 1}
            </div>
            <ol className="space-y-1.5">
              {colBlocks.map((c) => (
                <BlockRow
                  key={c.id}
                  block={c}
                  computedStartTime="·"
                  computedEndTime=""
                  childBlocks={allBlocks.filter((x) => x.parentBlockId === c.id)}
                  allBlocks={allBlocks}
                />
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
