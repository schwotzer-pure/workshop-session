"use client";

import { useState, useTransition } from "react";
import { Award, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitTemplateAction } from "@/actions/template";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function SubmitTemplateButton({
  workshopId,
  defaultTitle,
  defaultDescription,
}: {
  workshopId: string;
  defaultTitle: string;
  defaultDescription: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [theme, setTheme] = useState<string>(THEMES[0].key);
  const [description, setDescription] = useState(defaultDescription ?? "");
  const [, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Titel ist Pflicht");
      return;
    }
    startTransition(async () => {
      try {
        await submitTemplateAction({
          workshopId,
          title: title.trim(),
          theme,
          description: description.trim() || null,
        });
        toast.success("Vorlage eingereicht — wartet auf Bestätigung durch einen Admin");
        setOpen(false);
      } catch (e) {
        toast.error("Konnte Vorlage nicht einreichen");
        console.error(e);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
        title="Diesen Workshop als Vorlage einreichen"
      >
        <Award className="size-4" />
        Als Vorlage einreichen
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="size-4 text-[var(--neon-violet)]" />
              Workshop als Vorlage einreichen
            </DialogTitle>
            <DialogDescription>
              Ein:e Admin prüft deinen Vorschlag. Bei Bestätigung wird die
              Vorlage UNION-weit verfügbar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Titel der Vorlage
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Quartalsstart-Workshop"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Thema *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTheme(t.key)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                      theme === t.key
                        ? "bg-gradient-to-r from-[var(--neon-cyan)]/20 via-[var(--neon-violet)]/20 to-[var(--neon-pink)]/20 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                        : "border border-border/60 bg-background/40 text-muted-foreground hover:border-[var(--neon-violet)]/30 hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Beschreibung (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Wann und wofür ist diese Vorlage gut? Was sollten andere Trainer:innen wissen?"
                rows={4}
                className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
            >
              <Award className="size-4" />
              Einreichen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
