import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BarChart3, PlayCircle, Printer, Radio } from "lucide-react";
import { auth } from "@/auth/auth";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import {
  getWorkshopWithBlocks,
  getCategoriesForUser,
  listAllUsers,
  getOrganization,
  listWorkshopVersions,
  listMethods,
} from "@/lib/queries";
import { getActiveLiveSessionForWorkshop } from "@/lib/live";
import { startLiveSessionAction } from "@/actions/live";
import { WorkshopEditor } from "@/components/editor/workshop-editor";
import { VersionsTrigger } from "@/components/editor/versions-trigger";
import { LibrarySidebarTrigger } from "@/components/editor/library-sidebar";
import { SubmitTemplateButton } from "@/components/editor/submit-template-dialog";
import { ShareWorkshopButton } from "@/components/editor/share-dialog";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [workshop, categories, users, activeLive, userOrg, versions, methods] =
    await Promise.all([
      getWorkshopWithBlocks(id),
      getCategoriesForUser(session.user.id),
      listAllUsers(),
      getActiveLiveSessionForWorkshop(id),
      session.user.organizationId
        ? getOrganization(session.user.organizationId)
        : Promise.resolve(null),
      listWorkshopVersions(id),
      listMethods(),
    ]);
  if (!workshop) notFound();
  const dayId = workshop.days[0]?.id ?? "";

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
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Zurück zu Sessions
          </Link>
          <div className="flex items-center gap-3">
            {dayId ? (
              <LibrarySidebarTrigger methods={methods} dayId={dayId} />
            ) : null}
            <ShareWorkshopButton
              workshopId={id}
              ownerName={workshop.createdBy.name}
              allUsers={users}
              currentUserId={session.user.id}
              initialShares={workshop.shares.map((s) => ({
                user: {
                  id: s.user.id,
                  name: s.user.name,
                  username: s.user.username,
                  email: s.user.email,
                  avatarUrl: null,
                },
                canEdit: s.canEdit,
              }))}
            />
            <SubmitTemplateButton
              workshopId={id}
              defaultTitle={workshop.title}
              defaultDescription={workshop.description}
            />
            <VersionsTrigger workshopId={id} initialVersions={versions} />
            <Link
              href={`/sessions/${id}/overview`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
              title="Workshop-Übersicht"
            >
              <BarChart3 className="size-4" />
              Übersicht
            </Link>
            <Link
              href={`/sessions/${id}/print`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
              title="Druckansicht / als PDF speichern"
            >
              <Printer className="size-4" />
              Drucken
            </Link>
            {activeLive ? (
              <Link
                href={`/sessions/${id}/live/cockpit`}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--neon-pink)]/15 px-3 py-1.5 text-sm font-medium text-[var(--neon-pink)] hover:bg-[var(--neon-pink)]/25"
              >
                <Radio className="size-4 animate-pulse" />
                Live ist aktiv
              </Link>
            ) : (
              <form action={startLiveSessionAction.bind(null, id)}>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white shadow-[0_4px_20px_-6px_oklch(0.65_0.26_295/_0.5)] hover:opacity-95"
                >
                  <PlayCircle className="size-4" />
                  Live starten
                </Button>
              </form>
            )}
            <UserMenu
              user={{
                name: session.user.name ?? "Trainer",
                email: session.user.email ?? "",
                role: session.user.role,
              }}
            />
          </div>
        </header>
        <main className="flex-1 px-8 py-8">
          <WorkshopEditor
            workshop={workshop}
            categories={categories}
            users={users}
            methods={methods}
            currentUserId={session.user.id}
            isAdmin={session.user.role === "ADMIN"}
          />
        </main>
      </div>
    </div>
  );
}
