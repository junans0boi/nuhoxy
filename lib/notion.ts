import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDatabaseParameters,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/* ── 타입 정의 ─────────────────────────────────────────── */

export interface TestMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  active: boolean;
  participantCount: number;
  category: string;
}

export interface Question {
  id: string;
  order: number;
  text: string;
  optionAText: string;
  optionAScore: string;
  optionBText: string;
  optionBScore: string;
}

export interface TestResult {
  id: string;
  typeCode: string;
  name: string;
  description: string;
  imageUrl: string | null;
  scoreCondition: string;
}

/* ── 헬퍼: rich_text 추출 ───────────────────────────────── */

function richText(prop: PageObjectResponse["properties"][string]): string {
  if (prop.type === "rich_text") {
    return prop.rich_text.map((t) => t.plain_text).join("");
  }
  if (prop.type === "title") {
    return prop.title.map((t) => t.plain_text).join("");
  }
  return "";
}

/* ── Tests DB ───────────────────────────────────────────── */

export async function getTests(): Promise<TestMeta[]> {
  const dbId = process.env.NOTION_TESTS_DB_ID;
  if (!dbId) throw new Error("NOTION_TESTS_DB_ID is not set");

  const params: QueryDatabaseParameters = {
    database_id: dbId,
    filter: {
      property: "active",
      checkbox: { equals: true },
    },
    sorts: [{ property: "participant_count", direction: "descending" }],
  };

  const res = await notion.databases.query(params);

  return res.results
    .filter((p): p is PageObjectResponse => "properties" in p)
    .map((page) => {
      const props = page.properties;

      const slug = richText(props["slug"]);
      const title = richText(props["title"]);
      const description = richText(props["description"]);
      const category =
        props["category"]?.type === "select"
          ? (props["category"].select?.name ?? "")
          : "";
      const participantCount =
        props["participant_count"]?.type === "number"
          ? (props["participant_count"].number ?? 0)
          : 0;
      const thumbnailUrl =
        props["thumbnail"]?.type === "files" &&
        props["thumbnail"].files.length > 0
          ? props["thumbnail"].files[0].type === "external"
            ? props["thumbnail"].files[0].external.url
            : props["thumbnail"].files[0].type === "file"
              ? props["thumbnail"].files[0].file.url
              : null
          : null;

      return {
        id: page.id,
        slug,
        title,
        description,
        thumbnailUrl,
        active: true,
        participantCount,
        category,
      };
    });
}

/* ── Questions DB ───────────────────────────────────────── */

export async function getQuestions(testId: string): Promise<Question[]> {
  const dbId = process.env.NOTION_QUESTIONS_DB_ID;
  if (!dbId) throw new Error("NOTION_QUESTIONS_DB_ID is not set");

  const res = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: "test",
      relation: { contains: testId },
    },
    sorts: [{ property: "order", direction: "ascending" }],
  });

  return res.results
    .filter((p): p is PageObjectResponse => "properties" in p)
    .map((page) => {
      const props = page.properties;
      const order =
        props["order"]?.type === "number" ? (props["order"].number ?? 0) : 0;

      return {
        id: page.id,
        order,
        text: richText(props["text"]),
        optionAText: richText(props["option_a_text"]),
        optionAScore: richText(props["option_a_score"]),
        optionBText: richText(props["option_b_text"]),
        optionBScore: richText(props["option_b_score"]),
      };
    });
}

/* ── Results DB ─────────────────────────────────────────── */

export async function getResults(testId: string): Promise<TestResult[]> {
  const dbId = process.env.NOTION_RESULTS_DB_ID;
  if (!dbId) throw new Error("NOTION_RESULTS_DB_ID is not set");

  const res = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: "test",
      relation: { contains: testId },
    },
  });

  return res.results
    .filter((p): p is PageObjectResponse => "properties" in p)
    .map((page) => {
      const props = page.properties;
      const imageUrl =
        props["image"]?.type === "files" &&
        props["image"].files.length > 0
          ? props["image"].files[0].type === "external"
            ? props["image"].files[0].external.url
            : props["image"].files[0].type === "file"
              ? props["image"].files[0].file.url
              : null
          : null;

      return {
        id: page.id,
        typeCode: richText(props["type_code"]),
        name: richText(props["name"]),
        description: richText(props["description"]),
        imageUrl,
        scoreCondition: richText(props["score_condition"]),
      };
    });
}

/* ── 단일 테스트 메타 조회 (slug 기반) ────────────────── */

export async function getTestBySlug(slug: string): Promise<TestMeta | null> {
  const dbId = process.env.NOTION_TESTS_DB_ID;
  if (!dbId) throw new Error("NOTION_TESTS_DB_ID is not set");

  const res = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: "slug",
      title: { equals: slug },
    },
  });

  const page = res.results.find(
    (p): p is PageObjectResponse => "properties" in p
  );
  if (!page) return null;

  const props = page.properties;
  const thumbnailUrl =
    props["thumbnail"]?.type === "files" &&
    props["thumbnail"].files.length > 0
      ? props["thumbnail"].files[0].type === "external"
        ? props["thumbnail"].files[0].external.url
        : props["thumbnail"].files[0].type === "file"
          ? props["thumbnail"].files[0].file.url
          : null
      : null;

  return {
    id: page.id,
    slug: richText(props["slug"]),
    title: richText(props["title"]),
    description: richText(props["description"]),
    thumbnailUrl,
    active:
      props["active"]?.type === "checkbox"
        ? props["active"].checkbox
        : false,
    participantCount:
      props["participant_count"]?.type === "number"
        ? (props["participant_count"].number ?? 0)
        : 0,
    category:
      props["category"]?.type === "select"
        ? (props["category"].select?.name ?? "")
        : "",
  };
}
