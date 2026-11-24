import type { CommitteeArchive, CommitteeMeetingSummary } from "../types";

/**
 * 会議一覧から委員会ごとのアーカイブ概要（最新開催日・件数つき）を組み立てる。
 * 入力配列の並び順に依存せず、各委員会の最新開催日の会議から名称・区分を採用する。
 */
export function buildArchives(
  meetings: CommitteeMeetingSummary[]
): CommitteeArchive[] {
  const bySlug = new Map<string, CommitteeMeetingSummary[]>();
  for (const m of meetings) {
    const list = bySlug.get(m.committeeSlug) ?? [];
    list.push(m);
    bySlug.set(m.committeeSlug, list);
  }

  return [...bySlug.entries()]
    .map(([slug, list]) => {
      const sorted = [...list].sort((a, b) =>
        b.meetingDate.localeCompare(a.meetingDate)
      );
      const latest = sorted[0];
      return {
        slug,
        name: latest.committeeName,
        committeeType: latest.committeeType,
        meetingCount: list.length,
        latestMeetingDate: latest.meetingDate,
      };
    })
    .sort((a, b) => b.latestMeetingDate.localeCompare(a.latestMeetingDate));
}
