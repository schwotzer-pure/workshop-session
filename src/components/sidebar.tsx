"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LibraryBig,
  LayoutTemplate,
  Layers,
  Settings,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UnionLogo } from "@/components/union-logo";

const NAV: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}> = [
  { href: "/dashboard", label: "Sessions", icon: CalendarDays },
  { href: "/dashboard/templates", label: "Vorlagen", icon: LayoutTemplate },
  { href: "/dashboard/library", label: "Methoden", icon: LibraryBig },
  { href: "/dashboard/boards", label: "Boards", icon: Layers },
  { href: "/dashboard/admin/templates", label: "Verwaltung", icon: ShieldCheck, adminOnly: true },
  { href: "/dashboard/settings", label: "Einstellungen", icon: Settings, adminOnly: true },
];

export function Sidebar({
  user,
}: {
  user: {
    name: string;
    username: string;
    role: string;
    organizationName?: string | null;
  };
}) {
  const pathname = usePathname();
  const items = NAV.filter((i) => !i.adminOnly || user.role === "ADMIN");

  return (
    <aside
      className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/70 backdrop-blur-xl"
      suppressHydrationWarning
    >
      <div className="flex h-16 items-center border-b border-border/60 px-6">
        <Link href="/dashboard" className="flex flex-col leading-none">
          <span className="neon-text text-lg font-semibold tracking-tight">
            MySession
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            by
            <UnionLogo
              aria-label="UNION"
              className="h-2.5 w-auto text-foreground/80"
            />
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-[var(--neon-cyan)]/15 via-[var(--neon-violet)]/15 to-[var(--neon-pink)]/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.26_295/_0.25)]"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  active ? "text-[var(--neon-violet)]" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border/60 p-4 text-xs text-muted-foreground">
        <div>
          <p className="font-medium text-foreground/80">{user.name}</p>
          <p className="font-mono">@{user.username} · {user.role.toLowerCase()}</p>
        </div>
        {user.organizationName ? (
          <p className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[var(--neon-cyan)]/10 to-[var(--neon-violet)]/10 px-2 py-1 font-medium text-foreground/70">
            <Building2 className="size-3" />
            {user.organizationName}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
