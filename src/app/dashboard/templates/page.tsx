export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Vorlagen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wiederverwendbare Workshop-Strukturen für dich und dein Team.
        </p>
      </div>
      <div className="glass-card flex min-h-[300px] items-center justify-center rounded-2xl p-12 text-center">
        <div>
          <p className="text-sm text-muted-foreground">In Phase 2 verfügbar.</p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Hier kannst du bald Sessions als Templates speichern und teilen.
          </p>
        </div>
      </div>
    </div>
  );
}
