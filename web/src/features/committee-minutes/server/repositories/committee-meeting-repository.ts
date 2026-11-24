import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  CommitteeArchive,
  CommitteeMeetingDetail,
  CommitteeMeetingSummary,
  CommitteeMeetingTopic,
  CommitteeSpeech,
  CommitteeType,
} from "../../shared/types";

type TopicRow = {
  id: string;
  topic_order: number;
  title: string;
  summary: string | null;
  discussion_summary: string | null;
  speakers: unknown;
  start_voice_no: number | null;
  end_voice_no: number | null;
};

type MeetingRow = {
  id: string;
  committee_name: string;
  committee_slug: string;
  meeting_date: string;
  title: string;
  source_id: string | null;
  source_url: string | null;
  summary: string | null;
  /** 生成列。取得していない経路では undefined */
  speech_count?: number | null;
  speeches: unknown;
  committees?: { committee_type: string | null } | null;
  committee_meeting_topics: TopicRow[];
};

const VALID_COMMITTEE_TYPES = new Set<string>([
  "standing",
  "special",
  "budget",
  "audit",
  "management",
]);

function parseCommitteeType(
  value: string | null | undefined
): CommitteeType | null {
  if (!value || !VALID_COMMITTEE_TYPES.has(value)) return null;
  return value as CommitteeType;
}

function mapTopics(rows: TopicRow[]): CommitteeMeetingTopic[] {
  return [...rows]
    .sort((a, b) => a.topic_order - b.topic_order)
    .map((t) => ({
      id: t.id,
      topicOrder: t.topic_order,
      title: t.title,
      summary: t.summary,
      discussionSummary: t.discussion_summary,
      speakers: Array.isArray(t.speakers)
        ? (t.speakers as { label: string }[])
        : [],
      startVoiceNo: t.start_voice_no,
      endVoiceNo: t.end_voice_no,
    }));
}

function mapSummary(row: MeetingRow): CommitteeMeetingSummary {
  return {
    id: row.id,
    committeeName: row.committee_name,
    committeeSlug: row.committee_slug,
    committeeType: parseCommitteeType(row.committees?.committee_type),
    meetingDate: row.meeting_date,
    title: row.title,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    summary: row.summary,
    topics: mapTopics(row.committee_meeting_topics ?? []),
    speechCount: row.speech_count ?? null,
  };
}

/**
 * テーブル未作成による失敗か（マイグレーション適用前の環境）。
 */
function isMissingTableError(error: { code?: string | null }): boolean {
  return error.code === "42P01" || error.code === "PGRST205";
}

// speeches（全発言本文）は載せない。件数は生成列 speech_count から取る
const LIST_SELECT = `
  id,
  committee_name,
  committee_slug,
  meeting_date,
  title,
  source_id,
  source_url,
  summary,
  speech_count,
  committees (committee_type),
  committee_meeting_topics (*)
` as const;

export async function findAllMeetings(): Promise<CommitteeMeetingSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("committee_meetings")
    .select(LIST_SELECT)
    .eq("publish_status", "published")
    .order("meeting_date", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`委員会会議の取得に失敗しました: ${error.message}`);
  }
  return (data ?? []).map((row) => mapSummary(row as unknown as MeetingRow));
}

export async function findMeetingsBySlug(
  slug: string
): Promise<CommitteeMeetingSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("committee_meetings")
    .select(LIST_SELECT)
    .eq("committee_slug", slug)
    .eq("publish_status", "published")
    .order("meeting_date", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`委員会会議の取得に失敗しました: ${error.message}`);
  }
  return (data ?? []).map((row) => mapSummary(row as unknown as MeetingRow));
}

export async function findMeetingById(
  meetingId: string
): Promise<CommitteeMeetingDetail | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("committee_meetings")
    .select(`*, committees (committee_type), committee_meeting_topics (*)`)
    .eq("id", meetingId)
    .eq("publish_status", "published")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    // 不正な UUID 文字列（22P02）は notFound 扱い
    if (error.code === "22P02") return null;
    throw new Error(`委員会会議の取得に失敗しました: ${error.message}`);
  }
  if (!data) return null;

  const row = data as unknown as MeetingRow;
  return {
    ...mapSummary(row),
    speeches: Array.isArray(row.speeches)
      ? (row.speeches as CommitteeSpeech[])
      : [],
  };
}

/** 会議データから委員会の一覧（最新開催日つき）を組み立てる */
export function buildArchives(
  meetings: CommitteeMeetingSummary[]
): CommitteeArchive[] {
  const bySlug = new Map<string, CommitteeMeetingSummary[]>();
  for (const m of meetings) {
    const list = bySlug.get(m.committeeSlug) ?? [];
    list.push(m);
    bySlug.set(m.committeeSlug, list);
  }
  return [...bySlug.entries()].map(([slug, list]) => {
    const latest = list[0];
    return {
      slug,
      name: latest.committeeName,
      committeeType: latest.committeeType,
      meetingCount: list.length,
      latestMeetingDate: latest.meetingDate,
    };
  });
}
