import { notFound } from "next/navigation";
import { getTestBySlug, getResults } from "@/lib/notion";
import ResultPageClient from "./ResultPageClient";

/* ── 폴백 결과 데이터 ───────────────────────────────────── */
const FALLBACK_RESULTS = [
  {
    id: "r1",
    typeCode: "STEALTH_PRO",
    name: "은둔형 고수",
    description: "말은 적지만, 모든 걸 꿰차고 있는 존재. 너 혹시 팀장이야?",
    imageUrl: null,
    scoreCondition: "IN>=2,SAFE>=2",
  },
  {
    id: "r2",
    typeCode: "EXTROVERT_RISK",
    name: "열정적인 리스크 헌터",
    description: "말이 빠르고 아이디어가 넘친다. 회의실이 너 없으면 정지된다.",
    imageUrl: null,
    scoreCondition: "EX>=2,RISK>=2",
  },
  {
    id: "r3",
    typeCode: "BALANCER",
    name: "조율형 중재자",
    description: "한쪽으로 치우치지 않는 균형감각. 팀의 무대 뒤 주인공.",
    imageUrl: null,
    scoreCondition: "IN>=1,EX>=1",
  },
];

export default async function ResultPage({
  params,
}: {
  params: Promise<{ slug: string; type: string }>;
}) {
  const { slug, type } = await params;

  let results: Array<{ id: string; typeCode: string; name: string; description: string; imageUrl: string | null; scoreCondition: string }> = FALLBACK_RESULTS;

  try {
    if (process.env.NOTION_TOKEN && process.env.NOTION_TESTS_DB_ID) {
      const test = await getTestBySlug(slug);
      if (test) {
        const fetched = await getResults(test.id);
        if (fetched.length > 0) results = fetched;
      }
    }
  } catch { /* 폴백 유지 */ }

  // type 파라미터(하이픈 소문자) → typeCode(대문자 언더스코어) 매칭
  const normalizedType = type.toUpperCase().replace(/-/g, "_");
  const matched =
    results.find((r) => r.typeCode.toUpperCase() === normalizedType) ??
    results[0];

  if (!matched) notFound();

  return (
    <ResultPageClient
      slug={slug}
      result={matched}
      allResults={results}
    />
  );
}
