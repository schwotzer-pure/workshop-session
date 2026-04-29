import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import {
  getActiveLiveSessionForWorkshop,
  getLiveState,
} from "@/lib/live";
import { DisplayView } from "@/components/live/display-view";
import { prisma } from "@/lib/prisma";

export default async function DisplayPage({
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
      <main className="flex min-h-screen items-center justify-center bg-[oklch(0.14_0.02_280)] p-8 text-white">
        <div className="text-center">
          <p className="neon-text text-5xl font-semibold tracking-tight">
            {ws.title}
          </p>
          <p className="mt-6 text-2xl text-white/60">
            Workshop hat noch nicht begonnen.
          </p>
        </div>
      </main>
    );
  }

  const initial = await getLiveState(active.id);
  if (!initial) notFound();

  return <DisplayView liveSessionId={active.id} initial={initial} />;
}
