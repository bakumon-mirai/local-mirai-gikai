import type { GeneralQuestionTopic } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * `general_questions.topics` (jsonb) を取得境界で検証し、
 * `GeneralQuestionTopic[]` に正規化する。
 *
 * DB 側には要素の形状を縛る CHECK 制約が無いため、`null` や
 * `title` が空・非文字列の不正要素を除外して描画時の TypeError を防ぐ。
 */
export function parseGeneralQuestionTopics(
  raw: unknown
): GeneralQuestionTopic[] {
  if (!Array.isArray(raw)) return [];

  const result: GeneralQuestionTopic[] = [];

  for (const item of raw) {
    if (!isRecord(item) || typeof item.title !== "string") {
      continue;
    }
    const title = item.title.trim();
    if (title.length === 0) {
      continue;
    }

    const topic: GeneralQuestionTopic = {
      title,
      question_summary: toStringOrEmpty(item.question_summary),
      answer_summary: toStringOrEmpty(item.answer_summary),
      answerer_role: toStringOrEmpty(item.answerer_role),
      answerer_name: toStringOrEmpty(item.answerer_name),
    };

    if (typeof item.block_summary === "string") {
      topic.block_summary = item.block_summary;
    } else if (item.block_summary === null) {
      topic.block_summary = null;
    }

    result.push(topic);
  }

  return result;
}
