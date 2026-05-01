import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { Sparkles, Palette } from "lucide-react";
import { DashboardMockups } from "@/components/design-lab/dashboard-mockups";
import { TemplateMockups } from "@/components/design-lab/template-mockups";
import { MethodMockups } from "@/components/design-lab/method-mockups";

export const metadata = {
  title: "Design-Lab — MySession",
};

export default async function DesignLabPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[var(--neon-cyan)]/5 via-[var(--neon-violet)]/5 to-[var(--neon-pink)]/5 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-pink)]/20 blur-3xl" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--neon-violet)]">
            <Palette className="size-3" />
            Design-Lab
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Design-Vorschläge
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Drei Mockup-Varianten je Bereich, jeweils im Aurora-Stil. Wähle was dir
            gefällt — wir setzen es dann um.
          </p>
        </div>
      </section>

      <DashboardMockups />
      <TemplateMockups />
      <MethodMockups />

      <section className="rounded-2xl border border-dashed border-[var(--neon-violet)]/30 bg-[var(--neon-violet)]/[0.04] p-5">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--neon-violet)]" />
          <span>
            <span className="text-foreground/80">Hinweis:</span> Die Mockups sind
            statisch und nur zum Anschauen — keine Drag & Drop, keine echten
            Daten. Sag mir „Variante X für Dashboard, Y für Vorlagen, Z für
            Methoden" und ich setze es um.
          </span>
        </p>
      </section>
    </div>
  );
}
