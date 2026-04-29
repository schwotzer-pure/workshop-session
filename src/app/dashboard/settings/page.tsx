import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Team, Branding und Integrationen.
        </p>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <p className="text-sm text-muted-foreground">In späteren Phasen ausgebaut.</p>
      </div>
    </div>
  );
}
