"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { discardMethodDraftAction } from "@/actions/method";
import { SaveAsMethodDialog } from "./save-as-method-dialog";

export function MethodDraftHeaderActions({
  workshopId,
  defaultTitle,
  defaultDescription,
  defaultTags,
}: {
  workshopId: string;
  defaultTitle: string;
  defaultDescription: string | null;
  defaultTags: string[];
}) {
  const router = useRouter();
  const [saveOpen, setSaveOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleDiscard = () => {
    if (!confirm("Methoden-Entwurf verwerfen? Alle Blöcke gehen verloren.")) {
      return;
    }
    startTransition(async () => {
      try {
        await discardMethodDraftAction(workshopId);
        toast.success("Entwurf verworfen");
        router.push("/dashboard/library");
      } catch (e) {
        toast.error("Konnte nicht verwerfen");
        console.error(e);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDiscard}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
      >
        <Trash2 className="size-4" />
        Entwurf verwerfen
      </button>
      <Button
        type="button"
        size="sm"
        onClick={() => setSaveOpen(true)}
        className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white shadow-[0_4px_20px_-6px_oklch(0.65_0.26_295/_0.5)] hover:opacity-95"
      >
        <Save className="size-4" />
        Als Methode speichern
      </Button>
      <SaveAsMethodDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        workshopId={workshopId}
        defaultTitle={defaultTitle}
        defaultDescription={defaultDescription}
        defaultTags={defaultTags}
      />
    </>
  );
}
