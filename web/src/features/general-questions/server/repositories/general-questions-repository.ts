import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { GeneralQuestion } from "../../shared/types";
import { parseGeneralQuestionTopics } from "../../shared/utils/parse-topics";

const QUESTIONER_PAGE_SIZE = 500;
const QUESTIONER_MAX_PAGES = 20;

/** 原文（raw_text / answer_raw_text）は公開表示しないため取得列から除外する */
const PUBLIC_QUESTION_SELECT = `
  id,
  council_session_id,
  question_type,
  questioner_name,
  questioner_party,
  questioner_number,
  session_day,
  question_order,
  summary,
  topics,
  source_url,
  publish_status,
  created_at,
  updated_at
` as const;

function isMissingTableError(error: { code?: string | null }): boolean {
  return error.code === "42P01" || error.code === "PGRST205";
}

export async function countQuestionersBySession(
  sessionId: string
): Promise<number> {
  const supabase = createAdminClient();
  const questioners = new Set<string>();

  for (let page = 0; page < QUESTIONER_MAX_PAGES; page++) {
    const from = page * QUESTIONER_PAGE_SIZE;
    const { data, error } = await supabase
      .from("general_questions")
      .select("questioner_name")
      .eq("council_session_id", sessionId)
      .eq("publish_status", "published")
      .order("id", { ascending: true })
      .range(from, from + QUESTIONER_PAGE_SIZE - 1);

    if (error) {
      if (!isMissingTableError(error)) {
        console.error("Failed to count questioners by session:", error);
      }
      return 0;
    }

    for (const row of data ?? []) questioners.add(row.questioner_name);

    if (!data || data.length < QUESTIONER_PAGE_SIZE) return questioners.size;
  }

  console.warn(
    `countQuestionersBySession: ページ上限に達した (session=${sessionId})`
  );
  return questioners.size;
}

export async function findPublishedGeneralQuestionsBySession(
  sessionId: string
): Promise<GeneralQuestion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select(PUBLIC_QUESTION_SELECT)
    .eq("council_session_id", sessionId)
    .eq("publish_status", "published")
    .order("session_day", { ascending: true })
    .order("question_order", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`Failed to fetch general questions: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    ...row,
    topics: parseGeneralQuestionTopics(row.topics),
  })) as GeneralQuestion[];
}

export async function findLatestSessionSlugWithPublishedQuestions(): Promise<
  string | null
> {
  const session = await findLatestSessionWithPublishedQuestions();
  return session?.slug ?? null;
}

export type LatestQuestionSession = {
  id: string;
  slug: string | null;
  name: string;
};

export async function findLatestSessionWithPublishedQuestions(): Promise<LatestQuestionSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("id, slug, name, general_questions!inner(id)")
    .eq("general_questions.publish_status", "published")
    .order("start_date", { ascending: false })
    .limit(1, { referencedTable: "general_questions" })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Failed to fetch latest session with questions:", error);
    }
    return null;
  }

  if (!data) return null;
  return { id: data.id, slug: data.slug, name: data.name };
}

export async function findPublishedGeneralQuestionById(
  id: string
): Promise<GeneralQuestion | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select(PUBLIC_QUESTION_SELECT)
    .eq("id", id)
    .eq("publish_status", "published")
    .single();

  if (error) {
    if (
      error.code === "PGRST116" ||
      error.code === "22P02" ||
      isMissingTableError(error)
    ) {
      return null;
    }
    throw new Error(`Failed to fetch general question: ${error.message}`);
  }

  return {
    ...data,
    topics: parseGeneralQuestionTopics(data.topics),
  } as GeneralQuestion;
}
