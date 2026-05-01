import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 1040, height: 480 };
export const contentType = "image/png";

/**
 * Renders the "Sessions by UNION" lockup as PNG (Mark + wordmark).
 * Used by the workshop PDF (@react-pdf can't load SVG assets, so we generate
 * a raster equivalent). Path stays `mysession-logo.png` for backwards
 * compatibility with existing PDF references.
 */
export async function GET() {
  const containerEdge = "#2a2c3d"; // oklch(0.22 0.03 280)
  const containerBg = "#1c1d2c";   // oklch(0.18 0.02 280)
  const blockGradient =
    "linear-gradient(135deg, #5dd5f8 0%, #a45dfb 60%, #ff5fb5 100%)";
  const markSize = 360;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 56,
          paddingLeft: 40,
          paddingRight: 40,
          background: "transparent",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Sessions Mark */}
        <div
          style={{
            width: markSize,
            height: markSize,
            background: `linear-gradient(180deg, ${containerEdge}, ${containerBg})`,
            borderRadius: 60,
            position: "relative",
            display: "flex",
            flexShrink: 0,
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
              borderRadius: 8,
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
              borderRadius: 8,
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
              borderRadius: 8,
              background: blockGradient,
              opacity: 0.65,
            }}
          />
        </div>

        {/* Wordmark + by UNION */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 200,
              fontWeight: 700,
              letterSpacing: -7,
              lineHeight: 0.9,
              color: "#0a0a0a",
              display: "flex",
            }}
          >
            Sessions
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 500,
                color: "#6b7280",
                letterSpacing: 1,
              }}
            >
              by
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: "#0a0a0a",
                letterSpacing: 2,
              }}
            >
              UNION
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    }
  );
}
