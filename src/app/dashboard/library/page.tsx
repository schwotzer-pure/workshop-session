export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Methoden</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deine Bibliothek an Workshop-Methoden — durchsuchbar, wiederverwendbar.
        </p>
      </div>
      <div className="glass-card flex min-h-[300px] items-center justify-center rounded-2xl p-12 text-center">
        <div>
          <p className="text-sm text-muted-foreground">In Phase 2 verfügbar.</p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Brainstorming, Retro, Icebreaker, Energizer — alles drin per Drag-and-Drop.
          </p>
        </div>
      </div>
    </div>
  );
}
