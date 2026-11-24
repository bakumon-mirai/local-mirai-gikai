import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  BillSearchResult,
  CommitteeSearchResult,
  QuestionSearchResult,
} from "../../shared/types/search-types";
import { buildSafeIlikePattern } from "../../shared/utils/sanitize-search-query";

/**
 * テーブル未作成による失敗か（マイグレーション適用前の環境）。
 */
function isMissingTableError(error: { code?: string | null }): boolean {
  return error.code === "42P01" || error.code === "PGRST205";
}

export async function searchBills(query: string): Promise<BillSearchResult[]> {
  const like = buildSafeIlikePattern(query);
  if (!like) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_contents")
    .select(
      `
      bill_id,
      title,
      summary,
      bills!inner (
        id,
        publish_status,
        published_at,
        council_sessions (name),
        bills_tags (
          tags (label)
        )
      )
    `
    )
    .eq("difficulty_level", "normal")
    .eq("bills.publish_status", "published")
    .or(`title.ilike.${like},summary.ilike.${like}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Failed to search bills: ${error.message}`);

  return (data ?? []).map((row) => {
    const bill = row.bills as {
      id: string;
      published_at: string | null;
      council_sessions: { name: string } | null;
      bills_tags: Array<{ tags: { label: string } | null }>;
    };
    return {
      id: bill.id,
      title: row.title,
      summary: row.summary,
      session: bill.council_sessions?.name ?? "",
      publishedAt: bill.published_at,
      tags: bill.bills_tags
        .map((bt) => bt.tags?.label)
        .filter((l): l is string => l != null),
    };
  });
}

export async function searchGeneralQuestions(
  query: string
): Promise<QuestionSearchResult[]> {
  const like = buildSafeIlikePattern(query);
  if (!like) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select(
      `
      id,
      questioner_name,
      summary,
      topics,
      council_sessions (name)
    `
    )
    .eq("publish_status", "published")
    .or(`summary.ilike.${like},questioner_name.ilike.${like}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`Failed to search questions: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const topics = Array.isArray(row.topics)
      ? (row.topics as Array<{ title: string }>)
      : [];
    const session =
      (row.council_sessions as { name: string } | null)?.name ?? "";
    return {
      id: row.id,
      questioner: row.questioner_name,
      topics: topics.map((t) => t.title),
      summary: row.summary,
      session,
    };
  });
}

type CommitteeMeetingSearchRow = {
  id: string;
  committee_name: string;
  committee_slug: string;
  meeting_date: string;
  title: string;
  summary: string | null;
};

const COMMITTEE_MEETING_SELECT = `
  id,
  committee_name,
  committee_slug,
  meeting_date,
  title,
  summary
` as const;

function toCommitteeResult(
  row: CommitteeMeetingSearchRow
): CommitteeSearchResult {
  return {
    id: row.id,
    committeeName: row.committee_name,
    committeeSlug: row.committee_slug,
    title: row.title,
    summary: row.summary,
    meetingDate: row.meeting_date,
    matchedTopics: [],
  };
}

export async function searchCommittees(
  query: string
): Promise<CommitteeSearchResult[]> {
  const like = buildSafeIlikePattern(query);
  if (!like) return [];

  const supabase = createAdminClient();

  const meetingsRes = await supabase
    .from("committee_meetings")
    .select(COMMITTEE_MEETING_SELECT)
    .eq("publish_status", "published")
    .or(
      `title.ilike.${like},summary.ilike.${like},committee_name.ilike.${like}`
    )
    .order("meeting_date", { ascending: false })
    .limit(50);

  if (meetingsRes.error) {
    if (isMissingTableError(meetingsRes.error)) return [];
    throw new Error(
      `Failed to search committees: ${meetingsRes.error.message}`
    );
  }

  const byId = new Map<string, CommitteeSearchResult>();
  for (const row of (meetingsRes.data ?? []) as CommitteeMeetingSearchRow[]) {
    byId.set(row.id, toCommitteeResult(row));
  }

  const topicsRes = await supabase
    .from("committee_meeting_topics")
    .select(
      `title, committee_meetings!inner (${COMMITTEE_MEETING_SELECT}, publish_status)`
    )
    .eq("committee_meetings.publish_status", "published")
    .or(`title.ilike.${like},summary.ilike.${like}`)
    .limit(100);

  if (topicsRes.error) {
    if (isMissingTableError(topicsRes.error)) {
      return [...byId.values()];
    }
    throw new Error(`Failed to search committees: ${topicsRes.error.message}`);
  }

  for (const row of (topicsRes.data ?? []) as Array<{
    title: string;
    committee_meetings: CommitteeMeetingSearchRow | null;
  }>) {
    const meeting = row.committee_meetings;
    if (!meeting) continue;
    const existing = byId.get(meeting.id) ?? toCommitteeResult(meeting);
    if (row.title && !existing.matchedTopics.includes(row.title)) {
      existing.matchedTopics.push(row.title);
    }
    byId.set(meeting.id, existing);
  }

  return [...byId.values()]
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
    .slice(0, 50);
}
