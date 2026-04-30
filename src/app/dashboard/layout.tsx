import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { Sidebar, MobileSidebarTrigger } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import { getOrganization } from "@/lib/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
            <div className="truncate text-sm font-medium text-muted-foreground">
              Hallo, <span className="text-foreground">{session.user.name}</span>
            </div>
          </div>
          <UserMenu
            user={{
              name: session.user.name ?? "Trainer",
              email: session.user.email ?? "",
              role: session.user.role,
            }}
          />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
