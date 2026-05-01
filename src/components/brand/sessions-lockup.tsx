import { SessionsMark, type SessionsMarkVariant } from "./sessions-mark";
import { SessionsWordmark } from "./sessions-wordmark";
import { UnionLogo } from "@/components/union-logo";
import { cn } from "@/lib/utils";

/**
 * Full lockup: [Mark] + "Sessions" + "by ⟨UNION⟩".
 *
 * `size` = wordmark font-size in pixels. The mark is rendered at `size * 1.1`
 * (slightly bigger than the cap-height for optical alignment).
 */
export function SessionsLockup({
  size = 36,
  orientation = "horizontal",
  variant = "color",
  animate = false,
  live = false,
  className,
  "aria-label": ariaLabel = "Sessions by UNION",
}: {
  size?: number;
  orientation?: "horizontal" | "vertical";
  variant?: SessionsMarkVariant;
  animate?: boolean;
  live?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const markSize = Math.round(size * 1.1);
  const subSize = Math.round(size * 0.2);

  const wordBlock = (
    <div className="flex flex-col gap-1">
      <SessionsWordmark size={size} />
      <div
        className="flex items-center gap-2 text-muted-foreground"
        style={{ fontSize: subSize, fontWeight: 500 }}
      >
        <span style={{ letterSpacing: "0.02em" }}>by</span>
        <UnionLogo
          aria-label="UNION"
          style={{ height: subSize, width: "auto" }}
        />
      </div>
    </div>
  );

  if (orientation === "vertical") {
    return (
      <div
        className={cn("inline-flex flex-col items-start gap-3.5", className)}
        aria-label={ariaLabel}
      >
        <SessionsMark
          size={markSize}
          variant={variant}
          animate={animate}
          live={live}
        />
        {wordBlock}
      </div>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center gap-4", className)}
      aria-label={ariaLabel}
    >
      <SessionsMark
        size={markSize}
        variant={variant}
        animate={animate}
        live={live}
      />
      {wordBlock}
    </div>
  );
}
