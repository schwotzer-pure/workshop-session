"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Pill-style toggle: "Hell" | (•) | "Dunkel" — matching the user's reference
 * screenshot. Active label is bold-foreground, inactive is muted; the knob
 * sits on the active side of the pill.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  if (!mounted) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 text-xs",
          className,
        )}
      >
        <span className="text-muted-foreground/60">Hell</span>
        <span className="h-6 w-11 rounded-full bg-muted/40" />
        <span className="text-muted-foreground/60">Dunkel</span>
      </div>
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center gap-3 text-xs transition-colors",
        className,
      )}
      aria-label={`Theme wechseln (aktuell: ${isDark ? "Dunkel" : "Hell"})`}
      aria-pressed={isDark}
    >
      <span
        className={cn(
          "transition-colors",
          isDark ? "text-muted-foreground/60" : "font-semibold text-foreground",
        )}
      >
        Hell
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          "bg-[var(--neon-violet)]/40 hover:bg-[var(--neon-violet)]/55",
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-background shadow-[0_2px_6px_oklch(0_0_0/_0.25)] transition-transform duration-200 ease-out",
            isDark ? "translate-x-[1.375rem]" : "translate-x-[0.125rem]",
          )}
        />
      </span>
      <span
        className={cn(
          "transition-colors",
          isDark ? "font-semibold text-foreground" : "text-muted-foreground/60",
        )}
      >
        Dunkel
      </span>
    </button>
  );
}
