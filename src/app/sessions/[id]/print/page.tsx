import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import {
  getWorkshopWithBlocks,
  getOrganization,
} from "@/lib/queries";
import { PrintView } from "@/components/print/print-view";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const workshop = await getWorkshopWithBlocks(id);
  if (!workshop) notFound();

  const org = workshop.organizationId
    ? await getOrganization(workshop.organizationId)
    : null;

  return (
    <PrintView
      workshop={workshop}
      organization={org}
      trainerName={session.user.name ?? "Trainer"}
    />
  );
}

export const metadata = {
  title: "Druckansicht — MySession",
};
