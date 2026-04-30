import { auth } from "@/auth/auth";
import { redirect } from "next/navigation";
import { listMethodsForUser } from "@/lib/queries";
import { AdminMethodsView } from "@/components/admin/admin-methods-view";

export default async function AdminMethodsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const tab = params.tab === "all" ? "all" : "pending";

  const methods = await listMethodsForUser(
    session.user.id,
    tab === "pending" ? "pending" : "approved"
  );

  return <AdminMethodsView currentTab={tab} methods={methods} />;
}
