"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutTemplate, LibraryBig } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/dashboard/admin/templates", label: "Vorlagen", icon: LayoutTemplate },
  { href: "/dashboard/admin/methods", label: "Methoden", icon: LibraryBig },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const active = pathname.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              active
                ? "bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
