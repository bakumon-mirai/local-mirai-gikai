import type { CouncilSession } from "../types";

/**
 * `start_date <= targetDate` の会期（開始日の降順）から、指定日時点で現在開催中の会期を選ぶ。
 *
 * `end_date` が未確定（`null`）の過去会期であっても、すでに後続会期が開会していれば
 * 現在会期の候補から除外する（最新会期＝先頭要素のみ `end_date === null` で開催中扱い）。
 */
export function selectCurrentCouncilSession(
  startedSessionsDesc: CouncilSession[],
  targetDate: string
): CouncilSession | null {
  for (let i = 0; i < startedSessionsDesc.length; i++) {
    const session = startedSessionsDesc[i];
    if (session.start_date > targetDate) continue;

    if (session.end_date === null) {
      if (i === 0) return session;
      continue;
    }

    if (session.end_date >= targetDate) {
      return session;
    }
  }

  return null;
}
