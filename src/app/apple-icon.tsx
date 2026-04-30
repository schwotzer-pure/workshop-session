import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #5dd5f8 0%, #a45dfb 55%, #ff5fb5 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          textShadow: "0 2px 6px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: -6,
            lineHeight: 1,
          }}
        >
          M
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 1,
            opacity: 0.9,
          }}
        >
          MySession
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
