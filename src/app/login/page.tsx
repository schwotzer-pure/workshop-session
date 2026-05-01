import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { LoginForm } from "./login-form";
import { SessionsLockup } from "@/components/brand/sessions-lockup";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const params = await searchParams;

  return (
    <main className="aurora-bg-strong relative min-h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,oklch(0.65_0.26_295/_0.18),transparent_60%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-stretch justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-10 self-center"
          aria-label="Sessions by UNION"
        >
          <SessionsLockup size={36} animate />
        </Link>

        <div className="glass-card rounded-3xl p-8 shadow-[0_8px_40px_-12px_oklch(0.65_0.26_295/_0.25)]">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Willkommen zurück</h1>
            <p className="text-sm text-muted-foreground">
              Melde dich an, um deine Workshops zu planen.
            </p>
          </div>

          <LoginForm
            redirectTo={params.from && params.from.startsWith("/") ? params.from : "/dashboard"}
            initialError={params.error}
          />

          <div className="mt-8 rounded-xl border border-dashed border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground/80">Pilot-Logins</p>
            <p className="mt-1 font-mono">admin / admin · user / user</p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Sessions by UNION · hellopure · Workshop-Planung neu gedacht
        </p>
      </div>
    </main>
  );
}
