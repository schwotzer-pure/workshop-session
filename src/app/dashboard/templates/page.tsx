import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { listTemplatesForUser } from "@/lib/queries";
import { TemplatesView } from "@/components/templates/templates-view";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const tab =
    params.tab === "mine"
      ? "mine"
      : params.tab === "pending" && session.user.role === "ADMIN"
      ? "pending"
      : "approved";

  const templates = await listTemplatesForUser(session.user.id, tab);

  return (
    <TemplatesView
      currentTab={tab}
      isAdmin={session.user.role === "ADMIN"}
      templates={templates}
      currentUserId={session.user.id}
    />
  );
}
