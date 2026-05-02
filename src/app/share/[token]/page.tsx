import Link from "next/link";
import { Eye, ShieldAlert } from "lucide-react";
import { getWorkshopByShareToken } from "@/lib/queries";
import { SharedWorkshopView } from "@/components/share/shared-workshop-view";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getWorkshopByShareToken(token);

  if (!result) {
    return <InvalidLinkView />;
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-[var(--neon-violet)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Workshop-Vorschau
          </span>
          {result.link.label ? (
            <span className="hidden text-xs text-muted-foreground/60 sm:inline">
              · {result.link.label}
            </span>
          ) : null}
        </div>
        <Link
          href="/"
          className="neon-text text-sm font-semibold tracking-tight"
          aria-label="Sessions"
        >
          Sessions
        </Link>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <SharedWorkshopView
          workshop={result.workshop}
          boards={result.workshop.boards.map((wb) => ({
            id: wb.board.id,
            title: wb.board.title,
            url: wb.board.url,
            kind: wb.board.kind,
            tags: wb.board.tags,
          }))}
        />
        <p className="mx-auto mt-12 max-w-3xl text-center text-[11px] text-muted-foreground/60">
          Diese Vorschau wurde mit Sessions erstellt — Workshop-Planung von{" "}
          <span className="text-foreground/70">UNION</span>.
        </p>
      </main>
    </>
  );
}

function InvalidLinkView() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="glass-card mx-auto max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-pink)]/20 via-[var(--neon-violet)]/15 to-[var(--neon-cyan)]/15">
          <ShieldAlert className="size-6 text-[var(--neon-pink)]" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Link ungültig oder abgelaufen
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dieser Vorschau-Link existiert nicht mehr, wurde widerrufen oder ist
          abgelaufen. Bitte frage die Workshop-Verantwortlichen nach einem
          neuen Link.
        </p>
      </div>
    </main>
  );
}
