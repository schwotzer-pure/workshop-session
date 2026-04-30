import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 1040, height: 480 };
export const contentType = "image/png";

/**
 * Renders the "MySession by UNION" logo as a PNG. Used by the workshop PDF
 * (@react-pdf can't load SVG assets, so we generate a raster equivalent).
 * Aspect ratio 13:6 — matches public/mysession-logo.svg.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingLeft: 20,
          paddingRight: 20,
          background: "transparent",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 280,
            fontWeight: 800,
            letterSpacing: -10,
            lineHeight: 1,
            background:
              "linear-gradient(90deg, #5dd5f8 0%, #a45dfb 50%, #ff5fb5 100%)",
            backgroundClip: "text",
            color: "transparent",
            display: "flex",
          }}
        >
          MySession
        </div>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 500,
              color: "#9ca3af",
              letterSpacing: 1,
            }}
          >
            by
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "#0a0a0a",
              letterSpacing: 4,
            }}
          >
            UNION
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
