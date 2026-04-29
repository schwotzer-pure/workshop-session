export default function LivePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Live-Modus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trainer-Cockpit und Beamer-Display für deinen laufenden Workshop.
        </p>
      </div>
      <div className="glass-card flex min-h-[300px] items-center justify-center rounded-2xl p-12 text-center">
        <div>
          <p className="text-sm text-muted-foreground">In Phase 4 verfügbar.</p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Soll/Ist-Vergleich, Countdown und großer Beamer-View für deine Teilnehmenden.
          </p>
        </div>
      </div>
    </div>
  );
}
