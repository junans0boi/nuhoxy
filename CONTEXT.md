# Nuhoxy (너혹시) — 개발 컨텍스트

> 이 파일은 CEO 세션의 기획 결과물이다. Developer 세션은 이 파일을 기반으로 구현에 착수한다.
> 구현 전 반드시 아래 **스킬 & 규칙** 섹션을 먼저 읽고 적용할 것.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | 너혹시 (Nuhoxy) |
| 도메인 | nuhoxy.com (가용 확인 완료) |
| 컨셉 | "너 혹시 T야?", "너 혹시 연애 호구야?" 방식의 밈(Meme) 화법 기반 심리테스트 플랫폼 |
| 회사 | SteadyWithVivid (1인, 사업자 없음) |
| 운영 구조 | CEO/Developer/Reviewer/QA 멀티 에이전트 (OpenClaw) |

---

## 2. 기술 스택 (확정)

| 구분 | 기술 | 선택 이유 |
|---|---|---|
| 프레임워크 | **Next.js 14+ (App Router)** | SSR/SSG SEO 필수, 동적 OG 이미지, Vercel 최적화 |
| 스타일링 | **Tailwind CSS** | 모바일 퍼스트 UI, 빠른 개발 |
| CMS | **Notion API** | 1인 운영에서 테스트 문항 추가/수정을 코드 배포 없이 처리 |
| 호스팅 | **Vercel** | Next.js 공식, Analytics 무료, Edge 함수 |
| OG 이미지 (공유용) | **Vercel OG / satori** | 결과 타입별 서버사이드 PNG 생성 |
| 결과 카드 다운로드 | **html-to-image 또는 Canvas API** | 인스타 스토리용 세로형 카드 클라이언트 저장 |
| 분석 | **GA4 + Vercel Analytics** | 공유 버튼 전환율 추적 |
| 광고 | **Google AdSense + 카카오 Adfit** | 결과 페이지 하단 배치 |

---

## 3. MVP 스펙 (첫 런칭)

### 포함 (Must Have)
- [ ] 메인 페이지 — 테스트 목록 (카드 그리드 형태 **금지**, 타이포 중심 리스트)
- [ ] 테스트 진행 페이지 — 질문 10개 이하, 진행 바(Progress bar), 질문당 전체 화면
- [ ] 결과 페이지
  - 로컬스토리지에 결과 저장 (재방문 시 복원)
  - 실시간 참여자 수 표시 (FOMO 설계, Notion 수치 or 하드코딩 증분)
  - 결과 카드 이미지 다운로드 (세로형 1080×1920 인스타 스토리 규격)
- [ ] 공유 기능
  - 카카오톡 공유 API (미리보기: "너혹시...? 내 결과 확인하기")
  - X(트위터) 공유
  - URL 복사
  - 동적 OG 이미지 (결과 타입별 서버사이드 렌더링)
- [ ] 초기 테스트 콘텐츠 3개 (Notion CMS 연동)
  1. 오늘의 회사 생존 유형
  2. 내 연애 흑역사 테스트
  3. 나는 어떤 직장인 밈인가

### 제외 (2차 버전)
- 유저 계정 / 소셜 로그인
- 어드민 패널
- B2B 패키지
- 다국어 (글로벌 확장 시 추가)

---

## 4. 데이터 설계 — Notion CMS 스키마

Notion에 아래 3개 데이터베이스를 만들고 API로 연동한다.

### DB 1: Tests (테스트 메타)
| 필드명 | 타입 | 설명 |
|---|---|---|
| `slug` | Title | URL 식별자 (예: company-survival) |
| `title` | Rich Text | 표시 제목 (예: 오늘의 회사 생존 유형) |
| `description` | Rich Text | 테스트 소개 한 줄 |
| `thumbnail` | Files | 목록 썸네일 이미지 |
| `active` | Checkbox | 노출 여부 |
| `participant_count` | Number | 참여자 수 (수동 관리 or 증분) |
| `category` | Select | 직장 / 연애 / 성격 / 밈 |

### DB 2: Questions (질문)
| 필드명 | 타입 | 설명 |
|---|---|---|
| `test` | Relation | Tests DB 연결 |
| `order` | Number | 질문 순서 |
| `text` | Rich Text | 질문 본문 |
| `option_a_text` | Rich Text | 선택지 A 텍스트 |
| `option_a_score` | Rich Text | A 선택 시 점수 태그 (예: "IN,SAFE") |
| `option_b_text` | Rich Text | 선택지 B 텍스트 |
| `option_b_score` | Rich Text | B 선택 시 점수 태그 (예: "EX,RISK") |

### DB 3: Results (결과 유형)
| 필드명 | 타입 | 설명 |
|---|---|---|
| `test` | Relation | Tests DB 연결 |
| `type_code` | Title | 유형 코드 (예: STEALTH_PRO) |
| `name` | Rich Text | 유형명 (예: 은둔형 고수) |
| `description` | Rich Text | 결과 설명 (2~3문장, 밈 화법) |
| `image` | Files | 결과 카드 배경 이미지 |
| `match_good` | Relation | 찰떡 궁합 유형 (Results 자기참조) |
| `match_bad` | Relation | 환장 궁합 유형 (Results 자기참조) |
| `score_condition` | Rich Text | 판정 조건 (예: "IN>=3,SAFE>=2") |

---

## 5. 라우팅 구조 (Next.js App Router)

```
app/
├── page.tsx                        # 메인 (테스트 목록)
├── [slug]/
│   ├── page.tsx                    # 테스트 진행
│   └── result/
│       └── [type]/
│           └── page.tsx            # 결과 페이지
├── api/
│   └── og/
│       └── [slug]/
│           └── [type]/
│               └── route.tsx       # 동적 OG 이미지 생성 (satori)
└── layout.tsx                      # 공통 레이아웃
```

### URL 예시
- 메인: `nuhoxy.com`
- 테스트: `nuhoxy.com/company-survival`
- 결과: `nuhoxy.com/company-survival/result/stealth-pro`
- OG 이미지: `nuhoxy.com/api/og/company-survival/stealth-pro`

---

## 6. 디자인 원칙 (필수 적용)

> 프론트엔드 작업 전 반드시 `~/.agents/skills/frontend-design/SKILL.md`를 읽고 적용할 것.
> 해당 스킬 하단의 **"Nuhoxy MZ 디자인 원칙"** 섹션이 이 프로젝트의 디자인 규격이다.

### 토큰 시스템 요약
```
--bg:            #0D0D0D   /* 기본 배경 */
--surface:       #1A1A1A   /* 카드/컨테이너 */
--accent:        #C8FF00   /* 라임 그린 — 포인트는 여기에만 */
--text-primary:  #F5F5F5
--text-muted:    #888888
--danger:        #FF3B5C   /* 강조/결과 하이라이트 */
```

### 타이포그래피
- 헤드라인: `Pretendard` ExtraBold 800 (한글)
- 바디: `Pretendard` Regular 400
- 숫자/데이터: `Space Grotesk` (참여자 수 등)

### 레이아웃 규칙
- 모바일 퍼스트 (375px 기준 설계)
- 테스트 진행: 질문 1개 = 전체 화면 (풀스크린 전환)
- 결과: 강렬한 타이포그래피 중심, 카드 그리드 절대 금지

### 절대 금지
- 흰 배경 / 크림 배경
- SaaS 대시보드 스타일 둥근 카드 그리드
- 테라코타/웜클레이 계열 컬러
- 전 섹션 페이드인 애니메이션 도배
- 버튼 텍스트에 `→` 붙이기

---

## 7. 수익화 설정

| 단계 | 방법 | 시점 |
|---|---|---|
| 1차 | Google AdSense (결과 페이지 하단) | 배포 직후 신청 (심사 1~2주) |
| 1차 | 카카오 Adfit (AdSense 보완) | 동시 신청 |
| 2차 | 토스페이먼츠 개인 결제 (프리미엄 결과) | 트래픽 안정 후 |
| 3차 | B2B 팀빌딩 패키지 | 월 방문자 10만 이후 검토 |

---

## 8. SEO & 마케팅 셋업

### 배포 직후 필수 등록
- [ ] Google Search Console — 사이트맵 제출
- [ ] 네이버 웹마스터도구 — 사이트맵 제출
- [ ] Google Analytics 4 — 이벤트 추적 설정

### 바이럴 설계 포인트
- 카카오 공유 텍스트: `"나 [결과명] 나왔어 ㅋㅋ 너는 뭐 나옴? 👉 nuhoxy.com/..."`
- 결과 카드 하단에 `nuhoxy.com` 워터마크 삽입 (이미지 공유 시 브랜딩)
- 참여자 수 실시간 노출로 FOMO 유도

### 씨드 마케팅 (런칭 직후)
1. 직장 단톡방 최초 유포 — "이거 나왔는데 넌 뭐나옴?"
2. 트위터/X 밈 계정 공략 (직장인 밈, 연애 밈 계정)
3. 에브리타임, 블라인드 등 커뮤니티 자연 유포

---

## 9. 개발 착수 순서 (Phase)

### Phase 1 — 뼈대 (Day 1~2)
1. `npx create-next-app@latest nuhoxy --typescript --tailwind --app` 실행
2. Notion API 연동 (`@notionhq/client` 설치, 환경변수 설정)
3. Tests DB 연동 → 메인 페이지 목록 렌더링

### Phase 2 — 테스트 플로우 (Day 3~4)
4. 테스트 진행 페이지 (풀스크린 질문 전환, 진행 바)
5. 결과 계산 로직 (score_condition 파싱)
6. 결과 페이지 렌더링

### Phase 3 — 바이럴 & 공유 (Day 5~6)
7. Vercel OG 이미지 API 구현 (satori)
8. 카카오톡 공유 SDK 연동 (카카오 개발자센터 앱 등록 필요)
9. 결과 카드 다운로드 (html-to-image)
10. 로컬스토리지 결과 저장/복원

### Phase 4 — 마무리 & 배포 (Day 7)
11. nuhoxy.com 도메인 구매 + Vercel 연결
12. GA4 + Vercel Analytics 연결
13. AdSense / Adfit 신청
14. Search Console / 네이버 웹마스터 등록

---

## 10. 환경변수 목록

```env
# Notion
NOTION_TOKEN=
NOTION_TESTS_DB_ID=
NOTION_QUESTIONS_DB_ID=
NOTION_RESULTS_DB_ID=

# 카카오
NEXT_PUBLIC_KAKAO_JS_KEY=

# Analytics
NEXT_PUBLIC_GA_ID=
```

---

## 11. Developer 세션 지시사항

1. 이 파일을 처음 읽었으면 `~/.agents/skills/frontend-design/SKILL.md`를 반드시 읽어라.
2. 구현 전 디자인 계획서(색상, 타이포, 레이아웃 토큰)를 먼저 작성하고 검토한 후 코딩을 시작하라 (frontend-design 스킬의 "두 번의 패스" 원칙).
3. 모바일(375px) 기준으로 먼저 완성하고, 데스크탑은 보조로 처리하라.
4. 컴포넌트 단위로 작성하고, Notion API 호출은 `lib/notion.ts`에 분리하라.
5. Phase 순서대로 진행하되, 각 Phase 완료 후 Reviewer 세션에 검토 요청을 보내라.
6. 막히는 부분이 생기면 CEO 세션에 보고하고 결정을 기다려라. 임의로 스펙을 변경하지 마라.
