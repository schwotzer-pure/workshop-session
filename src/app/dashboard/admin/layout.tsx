import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Verwaltung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anträge prüfen, Inhalte freigeben, Bestand pflegen.
        </p>
      </div>

      <AdminNav />

      {children}
    </div>
  );
}
