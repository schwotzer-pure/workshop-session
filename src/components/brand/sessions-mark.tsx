import { cn } from "@/lib/utils";

export type SessionsMarkVariant =
  | "color"
  | "mono-dark"
  | "mono-light"
  | "outline"
  | "tinted";

/**
 * "Block-Stack S" — three stacked timeline blocks forming an S-silhouette.
 * The product mark for "Sessions by UNION".
 *
 * Spec: src/components/brand/README.md → Logo-System.
 *
 * @param size - pixel side-length (square)
 * @param variant - color | mono-dark | mono-light | outline | tinted
 * @param live - if true, b2 pulses (active session in cockpit/beamer)
 * @param animate - if true, plays the reveal motion on mount
 */
export function SessionsMark({
  size = 32,
  variant = "color",
  live = false,
  animate = false,
  className,
  "aria-label": ariaLabel,
}: {
  size?: number;
  variant?: SessionsMarkVariant;
  live?: boolean;
  animate?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  // Container border-radius scales: 12px @ 72px (16.6%)
  const radius = Math.max(4, Math.round(size * 0.166));
  return (
    <span
      className={cn("sessions-mark", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
      }}
      data-variant={variant === "color" ? undefined : variant}
      data-animate={animate || undefined}
      data-live={live || undefined}
      aria-label={ariaLabel ?? "Sessions"}
      role="img"
    >
      <span className="blk b1" />
      <span className="blk b2" />
      <span className="blk b3" />
    </span>
  );
}
