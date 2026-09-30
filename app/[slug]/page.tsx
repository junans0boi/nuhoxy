import { notFound } from "next/navigation";
import { getTestBySlug, getQuestions, getResults } from "@/lib/notion";
import TestPageClient from "./TestPageClient";

/* ── 폴백 데이터 ────────────────────────────────────────── */
const FALLBACK_QUESTIONS = [
  {
    id: "q1", order: 1,
    text: "회의 중 다른 사람이 말할 때 네가 하는 행동은?",
    optionAText: "조용히 듣고 정리해줌",
    optionAScore: "IN,SAFE",
    optionBText: "즉석에서 아이디어 던짐",
    optionBScore: "EX,RISK",
  },
  {
    id: "q2", order: 2,
    text: "점심시간, 혼자인지 함께인지?",
    optionAText: "혼자 먹고 산책",
    optionAScore: "IN,SAFE",
    optionBText: "동료들 모아서 수다",
    optionBScore: "EX,RISK",
  },
  {
    id: "q3", order: 3,
    text: "프로젝트 마감 하루 전, 너는?",
    optionAText: "이미 다 해둔 상태",
    optionAScore: "IN,SAFE",
    optionBText: "그때 가서 몰아서 하면 됨",
    optionBScore: "EX,RISK",
  },
];

const FALLBACK_RESULT_CODES = [
  { typeCode: "STEALTH_PRO",     scoreCondition: "IN>=2,SAFE>=2" },
  { typeCode: "EXTROVERT_RISK",  scoreCondition: "EX>=2,RISK>=2" },
  { typeCode: "BALANCER",        scoreCondition: "IN>=1,EX>=1" },
];

export default async function TestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  /* Notion 연동 시 실제 데이터, 미연동 시 폴백 */
  let test: { id: string; slug: string; title: string; description: string; thumbnailUrl: string | null; active: boolean; participantCount: number; category: string } | null = null;
  let questions = FALLBACK_QUESTIONS;
  let resultCodes = FALLBACK_RESULT_CODES;

  try {
    if (process.env.NOTION_TOKEN && process.env.NOTION_TESTS_DB_ID) {
      test = await getTestBySlug(slug);
    }
  } catch {
    // 연동 실패 시 폴백으로 진행
  }

  if (!test) {
    // 폴백 테스트 메타
    type TestMetaFallback = { id: string; slug: string; title: string; description: string; thumbnailUrl: string | null; active: boolean; participantCount: number; category: string };
    const fallbackTests: Record<string, TestMetaFallback> = {
      "company-survival": {
        id: "fallback-1", slug: "company-survival",
        title: "오늘의 회사 생존 유형", description: "너 혹시 회사에서 투명인간이야?",
        thumbnailUrl: null, active: true, participantCount: 17423, category: "직장",
      },
      "love-history": {
        id: "fallback-2", slug: "love-history",
        title: "내 연애 흑역사 테스트", description: "너 혹시 연애 호구야?",
        thumbnailUrl: null, active: true, participantCount: 9801, category: "연애",
      },
      "worker-meme": {
        id: "fallback-3", slug: "worker-meme",
        title: "나는 어떤 직장인 밈인가", description: "너 혹시 칼퇴충이야?",
        thumbnailUrl: null, active: true, participantCount: 5230, category: "밈",
      },
    };
    test = fallbackTests[slug] ?? null;
  }

  if (!test) notFound();

  try {
    if (process.env.NOTION_TOKEN && process.env.NOTION_QUESTIONS_DB_ID) {
      const fetched = await getQuestions(test.id);
      if (fetched.length > 0) questions = fetched;
    }
  } catch { /* 폴백 유지 */ }

  try {
    if (process.env.NOTION_TOKEN && process.env.NOTION_RESULTS_DB_ID) {
      const fetched = await getResults(test.id);
      if (fetched.length > 0) {
        resultCodes = fetched.map((r) => ({
          typeCode: r.typeCode,
          scoreCondition: r.scoreCondition,
        }));
      }
    }
  } catch { /* 폴백 유지 */ }

  return (
    <TestPageClient
      test={test}
      initialQuestions={questions}
      resultCodes={resultCodes}
    />
  );
}
