import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon — 32×32 Sessions Mark (Block-Stack S) on dark container.
 * Spec: src/components/brand/README.md → App-Icons.
 */
export default function Icon() {
  // OKLCH not supported in @vercel/og — pre-converted to hex.
  const containerBg = "#1c1d2c";   // oklch(0.18 0.02 280)
  const containerEdge = "#2a2c3d"; // oklch(0.22 0.03 280)
  const blockGradient =
    "linear-gradient(135deg, #5dd5f8 0%, #a45dfb 60%, #ff5fb5 100%)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(180deg, ${containerEdge}, ${containerBg})`,
          borderRadius: 7,
          position: "relative",
          display: "flex",
        }}
      >
        {/* b1 (top) */}
        <div
          style={{
            position: "absolute",
            top: "18%",
            left: "16%",
            right: "36%",
            height: "14%",
            borderRadius: 1.5,
            background: blockGradient,
            opacity: 1,
          }}
        />
        {/* b2 (middle) */}
        <div
          style={{
            position: "absolute",
            top: "43%",
            left: "24%",
            right: "16%",
            height: "14%",
            borderRadius: 1.5,
            background: blockGradient,
            opacity: 0.85,
          }}
        />
        {/* b3 (bottom) */}
        <div
          style={{
            position: "absolute",
            top: "68%",
            left: "16%",
            right: "36%",
            height: "14%",
            borderRadius: 1.5,
            background: blockGradient,
            opacity: 0.65,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
