"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateWorkshopAction } from "@/actions/workshop";
import { cn } from "@/lib/utils";

export type OrgItem = {
  id: string;
  name: string;
  parentOrgId: string | null;
};

/**
 * Inline picker für die Workshop-Organization. Default = User-Org (vom Server
 * vorbelegt). Klick öffnet Popover mit allen Orgs in der UNION (Dachorg an
 * der Spitze, Sister-Orgs alphabetisch darunter).
 */
export function OrganizationPicker({
  workshopId,
  value,
  organizations,
}: {
  workshopId: string;
  value: string | null;
  organizations: OrgItem[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<string | null>(value);

  const current = organizations.find((o) => o.id === optimistic);

  // Sort: parent (UNION) first, then sisters alphabetically
  const sorted = [...organizations].sort((a, b) => {
    if (a.parentOrgId === null && b.parentOrgId !== null) return -1;
    if (a.parentOrgId !== null && b.parentOrgId === null) return 1;
    return a.name.localeCompare(b.name);
  });

  const setOrg = (orgId: string | null) => {
    if (orgId === optimistic) {
      setOpen(false);
      return;
    }
    const previous = optimistic;
    setOptimistic(orgId);
    setOpen(false);
    startTransition(async () => {
      try {
        await updateWorkshopAction({ id: workshopId, organizationId: orgId });
        const target = organizations.find((o) => o.id === orgId);
        toast.success(
          target
            ? `Mandant: ${target.name}`
            : "Mandant entfernt"
        );
      } catch (e) {
        setOptimistic(previous);
        toast.error("Konnte Mandant nicht ändern");
        console.error(e);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground",
          "data-[popup-open]:border-[var(--neon-violet)]/40 data-[popup-open]:text-foreground"
        )}
      >
        <Building2 className="size-3" />
        {current?.name ?? "Kein Mandant"}
        <ChevronDown className="size-3 opacity-60" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-56 p-1"
      >
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Mandant zuordnen
        </div>
        <div className="space-y-0.5">
          {sorted.map((o) => {
            const isActive = o.id === optimistic;
            const isParent = o.parentOrgId === null;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setOrg(o.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-[var(--neon-violet)]/10 text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Building2
                  className={cn(
                    "size-3.5 shrink-0",
                    isActive ? "text-[var(--neon-violet)]" : "text-muted-foreground/60"
                  )}
                />
                <span className={cn("flex-1 truncate", isParent && "font-semibold")}>
                  {o.name}
                  {isParent ? (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Dachorg
                    </span>
                  ) : null}
                </span>
                {isActive ? <Check className="size-3.5 text-[var(--neon-violet)]" /> : null}
              </button>
            );
          })}
        </div>
        <div className="border-t border-border/40 pt-1">
          <button
            type="button"
            onClick={() => setOrg(null)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
              optimistic === null
                ? "bg-muted/50 text-foreground"
                : "text-muted-foreground/70 hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <span className="ml-5">Kein Mandant</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
