"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createMethodDraftAction } from "@/actions/method";

/**
 * Starts a method-draft workshop and redirects to the regular editor where
 * the user builds the method with the full block-logic (Block/Group/Breakout/
 * Notiz). Saving snapshots the hierarchy into a Method.
 */
export function CreateMethodButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const id = await createMethodDraftAction();
        router.push(`/sessions/${id}`);
      } catch (e) {
        toast.error("Konnte Methoden-Entwurf nicht starten");
        console.error(e);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-95 disabled:opacity-60"
    >
      <Plus className="size-3.5" />
      {pending ? "Lade …" : "Neue Methode"}
    </button>
  );
}
