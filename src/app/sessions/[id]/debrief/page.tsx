import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { auth } from "@/auth/auth";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  analyzeLiveSession,
  listEndedLiveSessionsForWorkshop,
} from "@/lib/debrief";
import {
  getOrganization,
  getWorkshopWithBlocks,
} from "@/lib/queries";
import { DebriefView } from "@/components/debrief/debrief-view";

export default async function DebriefPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ live?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { live } = await searchParams;

  const workshop = await getWorkshopWithBlocks(id);
  if (!workshop) notFound();

  const userOrg = session.user.organizationId
    ? await getOrganization(session.user.organizationId)
    : null;

  const sessions = await listEndedLiveSessionsForWorkshop(id);

  if (sessions.length === 0) {
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
              href={`/sessions/${id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Editor
            </Link>
            <UserMenu
              user={{
                name: session.user.name ?? "Trainer",
                email: session.user.email ?? "",
                role: session.user.role,
              }}
            />
          </header>
          <main className="flex-1 px-8 py-12">
            <div className="glass-card mx-auto max-w-2xl rounded-2xl p-12 text-center">
              <Clock3 className="mx-auto size-8 text-muted-foreground" />
              <h1 className="mt-4 text-2xl font-semibold">
                Noch keine Auswertung
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sobald du diese Session live durchgeführt und beendet hast,
                erscheint hier ein Soll/Ist-Vergleich.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const targetSessionId = live ?? sessions[0].id;
  const analysis = await analyzeLiveSession(targetSessionId);
  if (!analysis) notFound();

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
            href={`/sessions/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Editor
          </Link>
          <UserMenu
            user={{
              name: session.user.name ?? "Trainer",
              email: session.user.email ?? "",
              role: session.user.role,
            }}
          />
        </header>
        <main className="flex-1 px-8 py-8">
          <DebriefView
            workshopId={id}
            analysis={analysis}
            sessions={sessions}
            currentSessionId={targetSessionId}
          />
        </main>
      </div>
    </div>
  );
}
