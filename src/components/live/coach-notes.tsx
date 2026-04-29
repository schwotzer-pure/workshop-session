"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  Check,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  createCoachNoteAction,
  deleteCoachNoteAction,
  resolveCoachNoteAction,
} from "@/actions/coach";
import { isRedirectError } from "@/lib/is-redirect";
import { cn } from "@/lib/utils";
import type { LiveCoachNote } from "@/lib/live";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeTime(iso: string) {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 30) return "gerade eben";
  if (sec < 60) return `vor ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `vor ${min} min`;
  const h = Math.floor(min / 60);
  return `vor ${h}h`;
}

/**
 * Pop-over badge in the cockpit header. Shows count of unresolved notes
 * and opens a panel with the list.
 */
export function CoachNotesBadge({
  notes,
  liveSessionId,
  currentUserId,
  isAdmin,
}: {
  notes: LiveCoachNote[];
  liveSessionId: string;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const unresolvedCount = notes.filter((n) => !n.resolvedAt).length;

  const handleResolve = (id: string) => {
    startTransition(async () => {
      try {
        await resolveCoachNoteAction(id);
      } catch (e) {
        if (isRedirectError(e)) throw e;
        toast.error("Konnte Hinweis nicht abschließen");
        console.error(e);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCoachNoteAction(id);
      } catch (e) {
        if (isRedirectError(e)) throw e;
        toast.error("Konnte Hinweis nicht löschen");
        console.error(e);
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5",
          unresolvedCount > 0
            ? "border-[var(--neon-pink)]/40 bg-[var(--neon-pink)]/10 text-[var(--neon-pink)]"
            : "border-border/70 bg-background/60 text-muted-foreground hover:border-[var(--neon-violet)]/40 hover:text-foreground"
        )}
        aria-label="Co-Trainer-Hinweise"
      >
        <Bell className={cn("size-3.5", unresolvedCount > 0 && "animate-pulse")} />
        <span className="hidden sm:inline">Hinweise</span>
        {unresolvedCount > 0 ? (
          <span className="rounded-full bg-[var(--neon-pink)] px-1.5 text-[10px] tabular-nums text-white">
            {unresolvedCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-50 mt-1.5 max-h-[60vh] w-[min(95vw,380px)] overflow-y-auto rounded-xl border border-border/60 bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
            <div className="flex items-center justify-between border-b border-border/60 px-2 pb-2 text-xs">
              <span className="font-medium uppercase tracking-wider text-muted-foreground">
                Co-Trainer-Hinweise
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                aria-label="Schließen"
              >
                <X className="size-3" />
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="rounded-lg px-3 py-6 text-center text-xs text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 size-5 text-muted-foreground/40" />
                Noch keine Hinweise.
                <br />
                Co-Trainer:innen können dir hier leise Notizen schicken.
              </div>
            ) : (
              <ul className="space-y-1 py-2">
                {notes.map((n) => {
                  const isResolved = Boolean(n.resolvedAt);
                  const canDelete = n.author.id === currentUserId || isAdmin;
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "group rounded-lg px-2 py-2 text-sm transition-colors",
                        isResolved
                          ? "bg-background/30 text-muted-foreground"
                          : "bg-[var(--neon-pink)]/[0.05]"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="size-6 shrink-0 border border-border/70 bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]">
                          <AvatarFallback className="bg-transparent text-[10px] font-semibold text-white">
                            {initials(n.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="font-medium">{n.author.name}</span>
                            <span>·</span>
                            <span>{relativeTime(n.createdAt)}</span>
                          </div>
                          <p
                            className={cn(
                              "mt-0.5 whitespace-pre-wrap leading-snug",
                              isResolved && "line-through opacity-70"
                            )}
                          >
                            {n.content}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          {!isResolved ? (
                            <button
                              type="button"
                              onClick={() => handleResolve(n.id)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-[var(--neon-cyan)]/15 hover:text-[var(--neon-cyan)]"
                              title="Erledigt markieren"
                            >
                              <Check className="size-3" />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(n.id)}
                              className="rounded-md p-1 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                              title="Löschen"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : null}

      {/* Hidden but accessible compose for the controller themselves (rare) */}
      <input type="hidden" data-coach-session={liveSessionId} />
    </div>
  );
}

/**
 * Composer used on the Co-Trainer page (and optionally elsewhere) to send
 * a whisper to the controller.
 */
export function CoachNoteComposer({
  liveSessionId,
}: {
  liveSessionId: string;
}) {
  const [text, setText] = useState("");
  const [, startTransition] = useTransition();

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    startTransition(async () => {
      try {
        await createCoachNoteAction({ liveSessionId, content });
        toast.success("Hinweis gesendet");
      } catch (e) {
        if (isRedirectError(e)) throw e;
        toast.error("Konnte Hinweis nicht senden");
        console.error(e);
      }
    });
  };

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Hinweis an die Hauptmoderation, z.B. 'Person X spricht zum 4. Mal' oder 'Energie sinkt' …"
        rows={3}
        className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          ⌘+Enter zum Senden · der Hinweis ist nur im Cockpit sichtbar.
        </span>
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={!text.trim()}
        >
          <Send className="size-3.5" />
          Senden
        </Button>
      </div>
    </div>
  );
}
