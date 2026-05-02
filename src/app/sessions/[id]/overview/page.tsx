import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth/auth";
import { Sidebar, MobileSidebarTrigger } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  getWorkshopWithBlocks,
  listBoardsForWorkshop,
  getOrganization,
} from "@/lib/queries";
import {
  SharedWorkshopView,
  type ViewBoard,
} from "@/components/share/shared-workshop-view";

export const metadata = { title: "Übersicht — Sessions" };

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

  const sidebarUser = {
    name: session.user.name ?? "Trainer",
    username: session.user.username,
    role: session.user.role,
    organizationName: userOrg?.name ?? null,
  };

  return (
    <div className="aurora-bg flex min-h-screen" suppressHydrationWarning>
      <Sidebar user={sidebarUser} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <MobileSidebarTrigger user={sidebarUser} />
            <Link
              href={`/sessions/${id}`}
              className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="hidden truncate sm:inline">Zurück zum Editor</span>
            </Link>
          </div>
          <UserMenu
            user={{
              name: session.user.name ?? "Trainer",
              email: session.user.email ?? "",
              role: session.user.role,
            }}
          />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <Suspense fallback={<OverviewSkeleton />}>
            <OverviewContent id={id} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

async function OverviewContent({ id }: { id: string }) {
  const [workshop, workshopBoards] = await Promise.all([
    getWorkshopWithBlocks(id),
    listBoardsForWorkshop(id),
  ]);
  if (!workshop) notFound();

  const boards: ViewBoard[] = workshopBoards.map((b) => ({
    id: b.id,
    title: b.title,
    url: b.url,
    kind: b.kind,
    tags: b.tags,
  }));

  return <SharedWorkshopView workshop={workshop} boards={boards} />;
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="h-48 animate-pulse rounded-3xl bg-muted/20" />
      <div className="h-32 animate-pulse rounded-2xl bg-muted/20" />
      <div className="h-20 animate-pulse rounded-2xl bg-muted/20" />
      <div className="space-y-2">
        <div className="h-24 animate-pulse rounded-2xl bg-muted/20" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted/20" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted/20" />
      </div>
    </div>
  );
}
