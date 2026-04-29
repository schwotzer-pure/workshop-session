"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createCommentAction,
  deleteCommentAction,
} from "@/actions/comment";

export type CommentItem = {
  id: string;
  content: string;
  createdAt: Date | string;
  author: {
    id: string;
    name: string;
    username: string;
  };
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `vor ${days} Tagen`;
  return d.toLocaleDateString("de-CH");
}

export function CommentList({
  workshopId,
  blockId,
  comments: initialComments,
  currentUserId,
  isAdmin,
}: {
  workshopId: string;
  blockId: string;
  comments: CommentItem[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [text, setText] = useState("");
  const [, startTransition] = useTransition();

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    startTransition(async () => {
      try {
        const created = await createCommentAction({
          workshopId,
          blockId,
          content,
        });
        setComments((prev) => [
          ...prev,
          {
            id: created.id,
            content: created.content,
            createdAt: created.createdAt,
            author: created.author,
          },
        ]);
      } catch (e) {
        toast.error("Konnte Kommentar nicht senden");
        console.error(e);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Kommentar löschen?")) return;
    setComments((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      try {
        await deleteCommentAction(id);
      } catch (e) {
        toast.error("Konnte Kommentar nicht löschen");
        console.error(e);
      }
    });
  };

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background/30 px-3 py-4 text-xs text-muted-foreground">
          <MessageSquare className="size-3.5" />
          Noch keine Kommentare. Schreib einen, um Co-Trainer:innen zu briefen.
        </div>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => {
            const canDelete = c.author.id === currentUserId || isAdmin;
            return (
              <li
                key={c.id}
                className="group flex gap-2 rounded-lg border border-border/40 bg-background/40 p-2.5"
              >
                <Avatar className="size-7 shrink-0 border border-border/70 bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]">
                  <AvatarFallback className="bg-transparent text-[10px] font-semibold text-white">
                    {initials(c.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{c.author.name}</span>
                    <span className="text-muted-foreground">
                      {relativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">
                    {c.content}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="size-6 shrink-0 rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Kommentar löschen"
                  >
                    <Trash2 className="mx-auto size-3" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2 border-t border-border/60 pt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Kommentar schreiben … (⌘+Enter zum Senden)"
          rows={2}
          className={cn(
            "w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none",
            "placeholder:text-muted-foreground/40 focus:border-[var(--neon-violet)]/40"
          )}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={!text.trim()}
          className="ml-auto"
        >
          <Send className="size-3.5" />
          Senden
        </Button>
      </div>
    </div>
  );
}
