import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { listTemplatesForUser } from "@/lib/queries";
import { TemplatesView } from "@/components/templates/templates-view";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const templates = await listTemplatesForUser(session.user.id, "approved");

  return (
    <TemplatesView
      templates={templates}
      currentUserId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
