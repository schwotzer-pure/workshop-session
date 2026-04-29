"use client";

import { useState, useTransition } from "react";
import { Check, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { updateBlockAction } from "@/actions/block";
import type { AppUserListItem } from "@/lib/queries";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PersonPicker({
  blockId,
  users,
  value,
  onChange,
}: {
  blockId: string;
  users: AppUserListItem[];
  value: AppUserListItem | null;
  onChange: (user: AppUserListItem | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const persist = (assignedToId: string | null) =>
    startTransition(async () => {
      try {
        await updateBlockAction({ id: blockId, assignedToId });
      } catch (e) {
        toast.error("Konnte Zuweisung nicht speichern");
        console.error(e);
      }
    });

  const handlePick = (user: AppUserListItem | null) => {
    onChange(user);
    persist(user?.id ?? null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5 text-sm font-medium transition-colors",
          "hover:border-[var(--neon-violet)]/40 hover:bg-background/80",
          value
            ? "text-foreground"
            : "text-muted-foreground"
        )}
      >
        {value ? (
          <>
            <Avatar className="size-5 border border-border/70 bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]">
              <AvatarFallback className="bg-transparent text-[9px] font-semibold text-white">
                {initials(value.name)}
              </AvatarFallback>
            </Avatar>
            <span>{value.name}</span>
          </>
        ) : (
          <>
            <UserPlus className="size-3.5" />
            <span>Trainer:in zuweisen</span>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-64 rounded-xl border border-border/60 p-1.5"
        align="start"
      >
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => handlePick(null)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60",
              value === null && "bg-accent/40"
            )}
          >
            <div className="flex size-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/40">
              <X className="size-3 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left">Niemandem zuweisen</span>
            {value === null ? (
              <Check className="size-3.5 text-[var(--neon-violet)]" />
            ) : null}
          </button>
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => handlePick(u)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60",
                value?.id === u.id && "bg-accent/40"
              )}
            >
              <Avatar className="size-6 border border-border/70 bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-pink)]">
                <AvatarFallback className="bg-transparent text-[10px] font-semibold text-white">
                  {initials(u.name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-left">{u.name}</span>
              {value?.id === u.id ? (
                <Check className="size-3.5 text-[var(--neon-violet)]" />
              ) : null}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
