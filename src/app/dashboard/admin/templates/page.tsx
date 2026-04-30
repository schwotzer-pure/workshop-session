import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { listTemplatesForUser } from "@/lib/queries";
import { AdminTemplatesView } from "@/components/admin/admin-templates-view";

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const tab = params.tab === "all" ? "all" : "pending";

  const templates =
    tab === "pending"
      ? await listTemplatesForUser(session.user.id, "pending")
      : await listTemplatesForUser(session.user.id, "approved");

  return <AdminTemplatesView currentTab={tab} templates={templates} />;
}
