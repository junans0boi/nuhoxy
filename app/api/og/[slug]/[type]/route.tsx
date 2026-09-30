import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

/* ── OG 이미지 생성 API ────────────────────────────────── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; type: string }> }
) {
  const { slug, type } = await params;

  // Notion 미연동 시 폴백 데이터
  const fallbackResults: Record<string, { name: string; description: string }> = {
    "stealth-pro": {
      name: "은둔형 고수",
      description: "말은 적지만, 모든 걸 꿰차고 있는 존재.",
    },
    "extrovert-risk": {
      name: "열정적인 리스크 헌터",
      description: "말이 빠르고 아이디어가 넘친다.",
    },
    "balancer": {
      name: "조율형 중재자",
      description: "한쪽으로 치우치지 않는 균형감각.",
    },
  };

  const result = fallbackResults[type] || fallbackResults["stealth-pro"];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0D0D0D",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#F5F5F5",
            marginBottom: "40px",
            letterSpacing: "-0.05em",
          }}
        >
          너혹시
        </div>

        {/* Test Title */}
        <div
          style={{
            fontSize: "28px",
            color: "#888888",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          너 혹시 T야?
        </div>

        {/* Result Type */}
        <div
          style={{
            fontSize: "96px",
            fontWeight: 800,
            color: "#C8FF00",
            lineHeight: 1.1,
            textAlign: "center",
            marginTop: "40px",
          }}
        >
          {result.name}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "36px",
            color: "#F5F5F5",
            lineHeight: 1.5,
            textAlign: "center",
            marginTop: "20px",
            maxWidth: "900px",
          }}
        >
          {result.description}
        </div>

        {/* Watermark */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            fontSize: "32px",
            color: "#888888",
          }}
        >
          nuhoxy.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
