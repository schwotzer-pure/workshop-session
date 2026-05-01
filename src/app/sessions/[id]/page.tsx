import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  ClipboardCheck,
  PlayCircle,
  Radio,
} from "lucide-react";
import { auth } from "@/auth/auth";
import { Sidebar, MobileSidebarTrigger } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import {
  getWorkshopWithBlocks,
  listBoardsForWorkshop,
  listMasterBoards,
  getCategoriesForUser,
  listAllUsers,
  getOrganization,
  listWorkshopVersions,
  listMethods,
  listShareLinksForWorkshop,
} from "@/lib/queries";
import { getActiveLiveSessionForWorkshop } from "@/lib/live";
import { startLiveSessionAction } from "@/actions/live";
import { WorkshopEditor } from "@/components/editor/workshop-editor";
import { VersionsTrigger } from "@/components/editor/versions-trigger";
import { LibrarySidebarTrigger } from "@/components/editor/library-sidebar";
import { SubmitTemplateButton } from "@/components/editor/submit-template-dialog";
import { ShareWorkshopButton } from "@/components/editor/share-dialog";
import { PrintMenu } from "@/components/editor/print-menu";
import { MethodDraftHeaderActions } from "@/components/editor/method-draft-header-actions";
import { EditorMobileMore } from "@/components/editor/editor-mobile-more";

export default async function SessionDetailPage({
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

  const sessionUser = {
    id: session.user.id,
    name: session.user.name ?? "Trainer",
    username: session.user.username,
    role: session.user.role,
    email: session.user.email ?? "",
    organizationName: userOrg?.name ?? null,
  };

  return (
    <div className="aurora-bg flex min-h-screen" suppressHydrationWarning>
      <Sidebar
        user={{
          name: sessionUser.name,
          username: sessionUser.username,
          role: sessionUser.role,
          organizationName: sessionUser.organizationName,
        }}
      />
      <Suspense fallback={<SessionContentSkeleton userName={sessionUser.name} />}>
        <SessionContent id={id} sessionUser={sessionUser} />
      </Suspense>
    </div>
  );
}

async function SessionContent({
  id,
  sessionUser,
}: {
  id: string;
  sessionUser: {
    id: string;
    name: string;
    username: string;
    role: string;
    email: string;
    organizationName: string | null;
  };
}) {
  const [
    workshop,
    categories,
    users,
    activeLive,
    versions,
    methods,
    workshopBoards,
    masterBoards,
    shareLinks,
  ] = await Promise.all([
    getWorkshopWithBlocks(id),
    getCategoriesForUser(sessionUser.id),
    listAllUsers(),
    getActiveLiveSessionForWorkshop(id),
    listWorkshopVersions(id),
    listMethods(),
    listBoardsForWorkshop(id),
    listMasterBoards(),
    listShareLinksForWorkshop(id),
  ]);
  if (!workshop) notFound();
  const dayId = workshop.days[0]?.id ?? "";

  const sidebarUser = {
    name: sessionUser.name,
    username: sessionUser.username,
    role: sessionUser.role,
    organizationName: sessionUser.organizationName,
  };

  const shareEntries = workshop.shares.map((s) => ({
    user: {
      id: s.user.id,
      name: s.user.name,
      username: s.user.username,
      email: s.user.email,
      avatarUrl: null,
    },
    canEdit: s.canEdit,
  }));

  const overviewLink = (
    <Link
      href={`/sessions/${id}/overview`}
      className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
      title="Workshop-Übersicht"
    >
      <BarChart3 className="size-4" />
      Übersicht
    </Link>
  );
  const debriefLink = workshop.status === "COMPLETED" ? (
    <Link
      href={`/sessions/${id}/debrief`}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/[0.08] px-3 py-1.5 text-sm font-medium text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/15"
      title="Soll/Ist-Auswertung"
    >
      <ClipboardCheck className="size-4" />
      Auswertung
    </Link>
  ) : null;

  return (
    <div className="flex min-h-screen min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <MobileSidebarTrigger user={sidebarUser} />
          <Link
            href={workshop.isMethodDraft ? "/dashboard/library" : "/dashboard"}
            className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="hidden truncate sm:inline">
              {workshop.isMethodDraft ? "Zurück zu Methoden" : "Zurück zu Sessions"}
            </span>
          </Link>
        </div>
        {workshop.isMethodDraft ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs font-medium uppercase tracking-wider text-[var(--neon-violet)] sm:inline">
              Methoden-Entwurf
            </span>
            {dayId ? (
              <LibrarySidebarTrigger methods={methods} dayId={dayId} />
            ) : null}
            <MethodDraftHeaderActions
              workshopId={id}
              defaultTitle={workshop.title}
              defaultDescription={workshop.description}
              defaultTags={workshop.tags}
            />
            <UserMenu
              user={{
                name: sessionUser.name,
                email: sessionUser.email,
                role: sessionUser.role,
              }}
            />
          </div>
        ) : (
        <div className="flex items-center gap-2 sm:gap-3">
          {dayId ? (
            <LibrarySidebarTrigger methods={methods} dayId={dayId} />
          ) : null}

          {/* Desktop: alle sekundären Aktionen inline */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <ShareWorkshopButton
              workshopId={id}
              ownerName={workshop.createdBy.name}
              allUsers={users}
              currentUserId={sessionUser.id}
              initialShares={shareEntries}
              initialShareLinks={shareLinks}
            />
            <SubmitTemplateButton
              workshopId={id}
              defaultTitle={workshop.title}
              defaultDescription={workshop.description}
            />
            <VersionsTrigger workshopId={id} initialVersions={versions} />
            {overviewLink}
            {debriefLink}
            <PrintMenu workshopId={id} />
          </div>

          {/* Mobile/Tablet: gleiche Aktionen im Sheet */}
          <EditorMobileMore>
            <ShareWorkshopButton
              workshopId={id}
              ownerName={workshop.createdBy.name}
              allUsers={users}
              currentUserId={sessionUser.id}
              initialShares={shareEntries}
              initialShareLinks={shareLinks}
            />
            <SubmitTemplateButton
              workshopId={id}
              defaultTitle={workshop.title}
              defaultDescription={workshop.description}
            />
            <VersionsTrigger workshopId={id} initialVersions={versions} />
            {overviewLink}
            {debriefLink}
            <PrintMenu workshopId={id} />
          </EditorMobileMore>

          {activeLive ? (
            <Link
              href={`/sessions/${id}/live/cockpit`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[var(--neon-pink)]/15 px-2.5 py-1.5 text-sm font-medium text-[var(--neon-pink)] hover:bg-[var(--neon-pink)]/25 sm:px-3"
            >
              <Radio className="size-4 animate-pulse" />
              <span className="hidden sm:inline">Live ist aktiv</span>
              <span className="sm:hidden">Live</span>
            </Link>
          ) : (
            <form action={startLiveSessionAction.bind(null, id)}>
              <Button
                type="submit"
                size="sm"
                className="shrink-0 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white shadow-[0_4px_20px_-6px_oklch(0.65_0.26_295/_0.5)] hover:opacity-95"
              >
                <PlayCircle className="size-4" />
                <span className="hidden sm:inline">Live starten</span>
                <span className="sm:hidden">Live</span>
              </Button>
            </form>
          )}
          <UserMenu
            user={{
              name: sessionUser.name,
              email: sessionUser.email,
              role: sessionUser.role,
            }}
          />
        </div>
        )}
      </header>
      <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <WorkshopEditor
          workshop={workshop}
          categories={categories}
          users={users}
          methods={methods}
          workshopBoards={workshopBoards}
          masterBoards={masterBoards}
          currentUserId={sessionUser.id}
          isAdmin={sessionUser.role === "ADMIN"}
        />
      </main>
    </div>
  );
}

function SessionContentSkeleton({ userName }: { userName: string }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-8 backdrop-blur-xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Zurück zu Sessions
        </Link>
        <div className="text-xs text-muted-foreground">
          Lade Session für {userName} …
        </div>
      </header>
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted/20" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted/20" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted/20" />
          <div className="space-y-2">
            <div className="h-20 animate-pulse rounded-2xl bg-muted/20" />
            <div className="h-20 animate-pulse rounded-2xl bg-muted/20" />
            <div className="h-20 animate-pulse rounded-2xl bg-muted/20" />
          </div>
        </div>
      </main>
    </div>
  );
}
