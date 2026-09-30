import Link from "next/link";
import { getTests, type TestMeta } from "@/lib/notion";

/* ── 참여자 수 포맷 ────────────────────────────────────── */
function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만명 참여`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천명 참여`;
  return `${n.toLocaleString()}명 참여`;
}

/* ── 폴백 목록 (Notion 미연동 시) ─────────────────────── */
const FALLBACK_TESTS: TestMeta[] = [
  {
    id: "1",
    slug: "company-survival",
    title: "오늘의 회사 생존 유형",
    description: "너 혹시 회사에서 투명인간이야?",
    thumbnailUrl: null,
    active: true,
    participantCount: 17423,
    category: "직장",
  },
  {
    id: "2",
    slug: "love-history",
    title: "내 연애 흑역사 테스트",
    description: "너 혹시 연애 호구야?",
    thumbnailUrl: null,
    active: true,
    participantCount: 9801,
    category: "연애",
  },
  {
    id: "3",
    slug: "worker-meme",
    title: "나는 어떤 직장인 밈인가",
    description: "너 혹시 칼퇴충이야?",
    thumbnailUrl: null,
    active: true,
    participantCount: 5230,
    category: "밈",
  },
];

/* ── 서버 컴포넌트 ─────────────────────────────────────── */
export default async function HomePage() {
  let tests: TestMeta[] = FALLBACK_TESTS;

  try {
    if (process.env.NOTION_TOKEN && process.env.NOTION_TESTS_DB_ID) {
      const fetched = await getTests();
      if (fetched.length > 0) tests = fetched;
    }
  } catch {
    // Notion 미연동 상태에서도 폴백으로 렌더링
  }

  return (
    <main className="min-h-dvh" style={{ background: "var(--bg)" }}>
      {/* ── 헤더 ────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 pt-8 pb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1
          className="text-2xl leading-none tracking-tight"
          style={{
            color: "var(--text-primary)",
            fontWeight: 800,
          }}
        >
          너혹시
        </h1>
        <span
          className="text-xs px-2 py-1 rounded"
          style={{
            background: "var(--surface)",
            color: "var(--accent)",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          Nuhoxy
        </span>
      </header>

      {/* ── 히어로 카피 ─────────────────────────────────── */}
      <section className="px-5 pt-10 pb-8">
        <p
          className="text-5xl leading-none tracking-tight mb-1"
          style={{ color: "var(--text-muted)", fontWeight: 800 }}
        >
          너 혹시
        </p>
        <p
          className="text-6xl leading-none tracking-tighter"
          style={{ color: "var(--accent)", fontWeight: 800 }}
        >
          T야?
        </p>
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          밈 화법으로 나를 찾는 심리테스트
        </p>
      </section>

      {/* ── 테스트 목록 — hairline divider 리스트 ─────── */}
      <section className="px-5">
        <div
          style={{ borderTop: "1px solid var(--border)" }}
          role="list"
          aria-label="심리테스트 목록"
        >
          {tests.map((test, idx) => (
            <TestListItem key={test.id} test={test} index={idx} />
          ))}
        </div>
      </section>

      {/* ── 푸터 ────────────────────────────────────────── */}
      <footer className="px-5 py-10 mt-8">
        <p
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          © 2026 Nuhoxy · SteadyWithVivid
        </p>
      </footer>
    </main>
  );
}

/* ── 리스트 아이템 컴포넌트 ────────────────────────────── */
function TestListItem({
  test,
  index,
}: {
  test: TestMeta;
  index: number;
}) {
  return (
    <Link
      href={`/${test.slug}`}
      role="listitem"
      className="group block py-5 transition-colors duration-100"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* 카테고리 태그 */}
          <span
            className="inline-block text-xs mb-2"
            style={{ color: "var(--text-muted)", fontWeight: 500 }}
          >
            {test.category}
          </span>

          {/* 테스트 제목 */}
          <h2
            className="text-lg leading-snug mb-1 transition-colors duration-100 group-hover:text-[var(--accent)]"
            style={{
              color: "var(--text-primary)",
              fontWeight: 800,
              wordBreak: "keep-all",
            }}
          >
            {test.title}
          </h2>

          {/* 설명 */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-muted)", wordBreak: "keep-all" }}
          >
            {test.description}
          </p>
        </div>

        {/* 인덱스 번호 — 장식용이 아닌 순서 정보 */}
        <span
          className="font-grotesk text-3xl leading-none opacity-20 group-hover:opacity-60 transition-opacity duration-100 shrink-0"
          style={{ color: "var(--accent)", fontWeight: 700 }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* 참여자 수 */}
      <p
        className="font-grotesk mt-3 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        <span
          className="font-grotesk text-base"
          style={{ color: "var(--accent)", fontWeight: 700 }}
        >
          {formatCount(test.participantCount)}
        </span>
      </p>
    </Link>
  );
}
