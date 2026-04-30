import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth/auth";
import {
  getActiveLiveSessionForWorkshop,
  getLiveState,
} from "@/lib/live";
import { startLiveSessionAction } from "@/actions/live";
import { Button } from "@/components/ui/button";
import { CockpitView } from "@/components/live/cockpit-view";
import { prisma } from "@/lib/prisma";

export default async function CockpitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const ws = await prisma.workshop.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!ws) notFound();

  const active = await getActiveLiveSessionForWorkshop(id);
  if (!active) {
    return (
      <main className="aurora-bg-strong relative flex min-h-screen items-center justify-center p-8" suppressHydrationWarning>
        <div className="glass-card max-w-md rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{ws.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Diese Session ist noch nicht live.
          </p>
          <form action={startLiveSessionAction.bind(null, id)} className="mt-6">
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
            >
              Jetzt live starten
            </Button>
          </form>
          <Link
            href={`/sessions/${id}`}
            className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Zurück zum Editor
          </Link>
        </div>
      </main>
    );
  }

  const initial = await getLiveState(active.id);
  if (!initial) notFound();

  return (
    <CockpitView
      workshopId={id}
      liveSessionId={active.id}
      initial={initial}
      currentUserId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
