"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ── 타입 ───────────────────────────────────────────────── */
interface TestResult {
  id: string;
  typeCode: string;
  name: string;
  description: string;
  imageUrl: string | null;
  scoreCondition: string;
}

/* ── 참여자 수 포맷 ─────────────────────────────────────── */
function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만명 참여`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천명 참여`;
  return `${n.toLocaleString()}명 참여`;
}

/* ── 결과 페이지 클라이언트 ─────────────────────────────── */
export default function ResultPageClient({
  slug,
  result,
  allResults,
}: {
  slug: string;
  result: TestResult;
  allResults: TestResult[];
}) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  /* ── 로컬스토리지에 결과 저장 ───────────────────────── */
  useEffect(() => {
    try {
      localStorage.setItem(
        `nuhoxy:result:${slug}`,
        JSON.stringify(result)
      );
    } catch {
      // 저장 실패 무시
    }
  }, [slug, result]);

  /* ── 현재 페이지 URL ────────────────────────────────── */
  const getShareUrl = () =>
    typeof window !== "undefined" ? window.location.href : "";

  /* ── 카카오톡 공유 ──────────────────────────────────── */
  const handleKakaoShare = useCallback(() => {
    const kakao = (window as any).Kakao;
    if (!kakao?.isInitialized?.()) return;

    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `나는 "${result.name}" 나왔어 👀`,
        description: `나 혹시... 너도 해봐 👉 nuhoxy.com`,
        imageUrl: `https://nuhoxy.com/api/og/${slug}/${result.typeCode.toLowerCase().replace(/_/g, "-")}`,
        link: {
          mobileWebUrl: getShareUrl(),
          webUrl: getShareUrl(),
        },
      },
      buttons: [
        {
          title: "나도 해보기",
          link: { mobileWebUrl: `https://nuhoxy.com/${slug}`, webUrl: `https://nuhoxy.com/${slug}` },
        },
      ],
    });
  }, [result, slug]);

  /* ── X(트위터) 공유 ─────────────────────────────────── */
  const handleXShare = useCallback(() => {
    const text = encodeURIComponent(
      `나는 "${result.name}" 나왔어 ㅋㅋ 너는 뭐 나옴? 👉`
    );
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://x.com/intent/post?text=${text}&url=${url}`, "_blank", "noopener");
  }, [result]);

  /* ── URL 복사 ───────────────────────────────────────── */
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      // toast 대신 간단한 알림 (Phase 3에서 토스트로 교체)
      const btn = document.getElementById("copy-btn");
      if (btn) {
        btn.textContent = "복사됨!";
        setTimeout(() => { btn.textContent = "링크 복사"; }, 1500);
      }
    } catch {
      // 복사 실패 시 무시
    }
  }, []);

  /* ── 결과 카드 다운로드 (Canvas API) ────────────────── */
  const handleDownload = useCallback(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 배경
    ctx.fillStyle = "#0D0D0D";
    ctx.fillRect(0, 0, 1080, 1920);

    // 상단 브랜드
    ctx.fillStyle = "#888888";
    ctx.font = "400 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("너혹시", 540, 200);

    // accent 라인
    ctx.fillStyle = "#C8FF00";
    ctx.fillRect(440, 240, 200, 3);

    // 결과 타입명 (메인 타이포)
    ctx.fillStyle = "#F5F5F5";
    ctx.font = "800 96px sans-serif";
    ctx.textAlign = "center";

    // 긴 이름은 줄바꿈
    const name = result.name;
    if (ctx.measureText(name).width > 900) {
      const mid = Math.floor(name.length / 2);
      ctx.fillText(name.slice(0, mid), 540, 880);
      ctx.fillText(name.slice(mid), 540, 1000);
    } else {
      ctx.fillText(name, 540, 960);
    }

    // 설명
    ctx.fillStyle = "#888888";
    ctx.font = "400 44px sans-serif";
    const desc = result.description;
    const maxWidth = 900;
    const words = desc.split(" ");
    let line = "";
    let y = 1120;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, 540, y);
        line = word;
        y += 64;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, 540, y);

    // 워터마크
    ctx.fillStyle = "#444444";
    ctx.font = "400 36px sans-serif";
    ctx.fillText("nuhoxy.com", 540, 1820);

    // 다운로드
    const link = document.createElement("a");
    link.download = `${result.name.replace(/\s/g, "_")}_nuhoxy.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [result]);

  return (
    <main className="min-h-dvh flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <header
        className="px-5 pt-6 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          href="/"
          className="text-sm flex items-center gap-1"
          style={{ color: "var(--text-muted)" }}
        >
          <span>←</span> 메인으로
        </Link>
      </header>

      {/* ── 결과 메인 — 타이포 중심 ──────────────────────── */}
      <section
        ref={cardRef}
        className="flex-1 flex flex-col justify-center px-6 py-12"
      >
        <p
          className="font-grotesk text-sm mb-4"
          style={{ color: "var(--accent)", fontWeight: 700 }}
        >
          당신의 유형
        </p>

        {/* 결과 타입명 — 화면 가득 채우는 타이포 */}
        <h1
          className="leading-none mb-8"
          style={{
            color: "var(--text-primary)",
            fontWeight: 800,
            fontSize: "clamp(2.5rem, 12vw, 5rem)",
            wordBreak: "keep-all",
          }}
        >
          {result.name}
        </h1>

        <p
          className="text-lg leading-relaxed"
          style={{ color: "var(--text-muted)", wordBreak: "keep-all" }}
        >
          {result.description}
        </p>

        {/* 다시 해보기 */}
        <button
          type="button"
          onClick={() => router.push(`/${slug}`)}
          className="mt-10 text-sm self-start"
          style={{ color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: "4px" }}
        >
          다시 해보기
        </button>
      </section>

      {/* ── 공유 섹션 ────────────────────────────────────── */}
      <section
        className="px-5 pt-6 pb-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* 결과 카드 다운로드 CTA */}
        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-4 rounded-lg text-lg mb-4"
          style={{
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 800,
          }}
        >
          결과 카드 저장
        </button>

        {/* 공유 버튼 3종 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleKakaoShare}
            className="py-3 rounded-lg text-sm font-bold"
            style={{ background: "#FEE500", color: "#000" }}
          >
            카카오톡
          </button>

          <button
            type="button"
            onClick={handleXShare}
            className="py-3 rounded-lg text-sm font-bold"
            style={{ background: "#000", color: "#fff", border: "1px solid #333" }}
          >
            X 공유
          </button>

          <button
            id="copy-btn"
            type="button"
            onClick={handleCopyUrl}
            className="py-3 rounded-lg text-sm font-bold"
            style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            링크 복사
          </button>
        </div>
      </section>

      {/* ── 푸터 ─────────────────────────────────────────── */}
      <footer
        className="px-5 py-5 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="font-grotesk text-xs" style={{ color: "var(--text-muted)" }}>
          nuhoxy.com
        </p>
      </footer>
    </main>
  );
}
