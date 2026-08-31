import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

function truncate(value: string, max = 90) {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

export function quorumOgImage({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f4ef",
          color: "#1c1917",
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 40,
            letterSpacing: -1,
            fontFamily: "Georgia, ui-serif, serif",
          }}
        >
          Quorum
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 980 }}>
          <div
            style={{
              display: "flex",
              fontSize: 58,
              lineHeight: 1.15,
              letterSpacing: -1.5,
              fontWeight: 600,
            }}
          >
            {truncate(title)}
          </div>
          {subtitle ? (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: "#78716c",
                lineHeight: 1.35,
              }}
            >
              {truncate(subtitle, 140)}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
