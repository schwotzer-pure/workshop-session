import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #5dd5f8 0%, #a45dfb 55%, #ff5fb5 100%)",
          borderRadius: 7,
          color: "white",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: -1.5,
          fontFamily: "system-ui, sans-serif",
          textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      >
        M
      </div>
    ),
    {
      ...size,
    }
  );
}
