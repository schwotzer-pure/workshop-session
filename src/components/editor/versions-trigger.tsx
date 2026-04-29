"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { VersionsSheet } from "./versions-sheet";
import type { WorkshopVersionSummary } from "@/lib/queries";

export function VersionsTrigger({
  workshopId,
  initialVersions,
}: {
  workshopId: string;
  initialVersions: WorkshopVersionSummary[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
        title="Versionsverlauf"
      >
        <History className="size-4" />
        Versionen
        {initialVersions.length > 0 ? (
          <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
            {initialVersions.length}
          </span>
        ) : null}
      </button>
      <VersionsSheet
        open={open}
        onOpenChange={setOpen}
        workshopId={workshopId}
        initialVersions={initialVersions}
      />
    </>
  );
}
