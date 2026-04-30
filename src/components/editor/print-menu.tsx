"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, FileDown, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PrintMenu({ workshopId }: { workshopId: string }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-[var(--neon-violet)]/40 hover:text-foreground"
        aria-label="Drucken"
      >
        <Printer className="size-4" />
        Drucken
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-60">
        <DropdownMenuItem
          onClick={() => {
            // Trigger download via location — server returns Content-Disposition
            window.location.href = `/api/sessions/${workshopId}/pdf`;
          }}
        >
          <FileDown className="mr-2 size-3.5" />
          <div className="flex flex-col">
            <span className="text-sm">PDF herunterladen</span>
            <span className="text-[11px] text-muted-foreground">
              Aurora-Design, mehrseitig
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/sessions/${workshopId}/print`)}
        >
          <Printer className="mr-2 size-3.5" />
          <div className="flex flex-col">
            <span className="text-sm">Browser-Druckansicht</span>
            <span className="text-[11px] text-muted-foreground">
              Klassisch, Cmd+P
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
