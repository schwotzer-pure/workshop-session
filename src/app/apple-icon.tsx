import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS app icon — 180×180 Sessions Mark on dark container.
 * Spec: src/components/brand/README.md → App-Icons (iOS Primary).
 */
export default function AppleIcon() {
  const containerBg = "#1a1a28";   // oklch(0.10 0.02 280)
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
          position: "relative",
          display: "flex",
        }}
      >
        {/* Mark centered at 56% of canvas */}
        <div
          style={{
            position: "absolute",
            top: "22%",
            left: "22%",
            right: "22%",
            bottom: "22%",
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
              borderRadius: 4,
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
              borderRadius: 4,
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
              borderRadius: 4,
              background: blockGradient,
              opacity: 0.65,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
