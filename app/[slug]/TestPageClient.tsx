"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ── 타입 정의 ─────────────────────────────────────────── */
interface Question {
  id: string;
  order: number;
  text: string;
  optionAText: string;
  optionAScore: string;
  optionBText: string;
  optionBScore: string;
}

interface TestMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  active: boolean;
  participantCount: number;
  category: string;
}

/* ── score_condition 파싱 ───────────────────────────────── */
// "IN>=3,SAFE>=2" → { IN: 3, SAFE: 2 }
function parseCondition(condition: string): Record<string, number> {
  const result: Record<string, number> = {};
  condition.split(",").forEach((part) => {
    const match = part.trim().match(/^([A-Z_]+)>=(\d+)$/);
    if (match) result[match[1]] = parseInt(match[2], 10);
  });
  return result;
}

// 수집된 태그 → 카운트 집계
// answers: ["IN,SAFE", "EX,RISK", ...]
function tallyScores(answers: string[]): Record<string, number> {
  const tally: Record<string, number> = {};
  answers.forEach((tagGroup) => {
    tagGroup.split(",").forEach((tag) => {
      const t = tag.trim();
      if (t) tally[t] = (tally[t] || 0) + 1;
    });
  });
  return tally;
}

// tally 기반 결과 typeCode 결정
// results에 scoreCondition 없으면 폴백 순서로
function computeTypeCode(
  answers: string[],
  resultCodes: Array<{ typeCode: string; scoreCondition: string }>
): string {
  const tally = tallyScores(answers);

  for (const r of resultCodes) {
    if (!r.scoreCondition) continue;
    const cond = parseCondition(r.scoreCondition);
    const ok = Object.entries(cond).every(
      ([key, min]) => (tally[key] || 0) >= min
    );
    if (ok) return r.typeCode.toLowerCase().replace(/_/g, "-");
  }

  // 가장 많이 나온 태그로 폴백 매칭
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  if (top && resultCodes.length > 0) {
    const matched = resultCodes.find((r) =>
      r.scoreCondition.includes(top[0])
    );
    if (matched) return matched.typeCode.toLowerCase().replace(/_/g, "-");
    return resultCodes[0].typeCode.toLowerCase().replace(/_/g, "-");
  }

  return resultCodes[0]?.typeCode.toLowerCase().replace(/_/g, "-") ?? "default";
}

/* ── 테스트 진행 클라이언트 컴포넌트 ───────────────────── */
export default function TestPageClient({
  test,
  initialQuestions,
  resultCodes,
}: {
  test: TestMeta;
  initialQuestions: Question[];
  resultCodes: Array<{ typeCode: string; scoreCondition: string }>;
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [chosen, setChosen] = useState<"A" | "B" | null>(null); // 선택 피드백용

  const questions = initialQuestions;
  const currentQuestion = questions[currentIndex];
  const progress = hasStarted
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  /* ── 선택지 클릭 핸들러 ──────────────────────────────── */
  const handleOptionClick = useCallback(
    (score: string, option: "A" | "B") => {
      setChosen(option);

      // 짧은 피드백 딜레이 후 다음 질문으로
      setTimeout(() => {
        setChosen(null);
        const newAnswers = [...answers, score];
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // 모든 답변 완료 → 결과 계산 → 이동
          const typeCode = computeTypeCode(newAnswers, resultCodes);

          // 로컬스토리지에 답변 저장 (결과 페이지에서 복원용)
          localStorage.setItem(
            `nuhoxy:answers:${test.slug}`,
            JSON.stringify(newAnswers)
          );

          router.push(`/${test.slug}/result/${typeCode}`);
        }
      }, 220);
    },
    [currentIndex, questions.length, answers, resultCodes, router, test.slug]
  );

  /* ── 테스트 시작 ─────────────────────────────────────── */
  const handleStart = useCallback(() => {
    setHasStarted(true);
    setCurrentIndex(0);
    setAnswers([]);
  }, []);

  /* ── 시작 전 화면 ────────────────────────────────────── */
  if (!hasStarted) {
    return (
      <TestLayout test={test} progress={0}>
        <StartScreen test={test} onStart={handleStart} />
      </TestLayout>
    );
  }

  /* ── 테스트 진행 화면 ────────────────────────────────── */
  return (
    <TestLayout test={test} progress={progress}>
      <div className="flex flex-col justify-between px-6 py-6" style={{ minHeight: "calc(100dvh - 110px)" }}>

        {/* 질문 카운터 */}
        <p
          className="font-grotesk text-base mb-6"
          style={{ color: "var(--accent)", fontWeight: 700 }}
        >
          {currentIndex + 1} / {questions.length}
        </p>

        {/* 질문 본문 */}
        <h2
          className="text-3xl leading-snug mb-auto"
          style={{ color: "var(--text-primary)", fontWeight: 800, wordBreak: "keep-all" }}
        >
          {currentQuestion.text}
        </h2>

        {/* 선택지 */}
        <div className="mt-10 flex flex-col gap-4">
          <OptionButton
            text={currentQuestion.optionAText}
            selected={chosen === "A"}
            onClick={() => handleOptionClick(currentQuestion.optionAScore, "A")}
          />
          <OptionButton
            text={currentQuestion.optionBText}
            selected={chosen === "B"}
            onClick={() => handleOptionClick(currentQuestion.optionBScore, "B")}
          />
        </div>
      </div>
    </TestLayout>
  );
}

/* ── 선택지 버튼 ────────────────────────────────────────── */
function OptionButton({
  text,
  selected,
  onClick,
}: {
  text: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-5 rounded-lg text-left transition-all duration-150 active:scale-[0.98]"
      style={{
        background: selected ? "var(--accent)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        color: selected ? "var(--bg)" : "var(--text-primary)",
        fontSize: "1.125rem",
        lineHeight: 1.6,
        fontWeight: selected ? 700 : 400,
        wordBreak: "keep-all",
      }}
    >
      {text}
    </button>
  );
}

/* ── 테스트 레이아웃 ───────────────────────────────────── */
function TestLayout({
  test,
  progress,
  children,
}: {
  test: TestMeta;
  progress: number;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex flex-col" style={{ background: "var(--bg)" }}>
      {/* 헤더 */}
      <header className="px-5 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link
          href="/"
          className="text-sm flex items-center gap-1"
          style={{ color: "var(--text-muted)" }}
        >
          <span>←</span> 메인으로
        </Link>
      </header>

      {/* 진행 바 */}
      <div className="px-5 pt-3 pb-2">
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1">{children}</div>
    </main>
  );
}

/* ── 시작 화면 ──────────────────────────────────────────── */
function StartScreen({
  test,
  onStart,
}: {
  test: TestMeta;
  onStart: () => void;
}) {
  return (
    <div
      className="flex flex-col justify-center items-center px-6 py-12 text-center"
      style={{ minHeight: "calc(100dvh - 80px)" }}
    >
      <p
        className="text-sm mb-3"
        style={{ color: "var(--accent)", fontWeight: 700 }}
      >
        {test.category}
      </p>

      <h2
        className="text-4xl leading-snug mb-6"
        style={{ color: "var(--text-primary)", fontWeight: 800, wordBreak: "keep-all" }}
      >
        {test.title}
      </h2>

      <p
        className="text-base leading-relaxed mb-12 max-w-xs"
        style={{ color: "var(--text-muted)", wordBreak: "keep-all" }}
      >
        {test.description}
      </p>

      <button
        type="button"
        onClick={onStart}
        className="w-full max-w-xs py-5 rounded-lg text-lg"
        style={{
          background: "var(--accent)",
          color: "var(--bg)",
          fontWeight: 800,
        }}
      >
        시작하기
      </button>

      <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        소요 시간 약 2분 · {test.participantCount.toLocaleString()}명 참여
      </p>
    </div>
  );
}
