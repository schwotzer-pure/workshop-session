"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function EditorMobileMore({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Weitere Aktionen"
          />
        }
      >
        <MoreHorizontal className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-72 flex-col bg-background/95 p-4 backdrop-blur-xl"
        showCloseButton={false}
      >
        <SheetTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Aktionen
        </SheetTitle>
        <div
          className="mt-3 flex flex-col items-stretch gap-2 [&>*]:w-full [&>a]:justify-start [&>button]:justify-start [&_form]:w-full [&_form_button]:w-full"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest("a, button")) setOpen(false);
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
