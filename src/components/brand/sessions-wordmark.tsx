import { cn } from "@/lib/utils";

/**
 * "Sessions" wordmark — Geist 700, einfarbig (kein Gradient).
 * Color is carried by the Mark, not the wordmark.
 */
export function SessionsWordmark({
  size = 32,
  className,
  color,
}: {
  /** Font-size in pixels */
  size?: number;
  className?: string;
  /** Defaults to var(--foreground). Override only for special cases (icons). */
  color?: string;
}) {
  return (
    <span
      className={cn("font-heading", className)}
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.035em",
        lineHeight: 0.9,
        color: color ?? "var(--foreground)",
        whiteSpace: "nowrap",
      }}
    >
      Sessions
    </span>
  );
}
