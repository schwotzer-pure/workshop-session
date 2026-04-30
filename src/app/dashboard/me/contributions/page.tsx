import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { listMethodsForUser, listTemplatesForUser } from "@/lib/queries";
import { ContributionsView } from "@/components/me/contributions-view";

export default async function MyContributionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [templates, methods] = await Promise.all([
    listTemplatesForUser(session.user.id, "mine"),
    listMethodsForUser(session.user.id, "mine"),
  ]);

  return <ContributionsView templates={templates} methods={methods} />;
}
