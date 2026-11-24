import type { CouncilSession, PastCouncilSession } from "../types";

/**
 * 議案公開済みの会期一覧と一般質問公開済みの会期一覧を集約し、開始日の降順で返す。
 *
 * 各会期に `hasBills` と `hasQuestions` の両方を必ず boolean で設定する
 * （質問のみの会期で `hasBills` が未定義のまま議案一覧へ誤リンクするのを防ぐ）。
 */
export function mergePastCouncilSessions(
  billSessions: CouncilSession[],
  questionSessions: CouncilSession[]
): PastCouncilSession[] {
  const byId = new Map<string, PastCouncilSession>();

  for (const session of billSessions) {
    const existing = byId.get(session.id);
    byId.set(session.id, {
      ...(existing ?? session),
      hasBills: true,
      hasQuestions: existing?.hasQuestions ?? false,
    });
  }

  for (const session of questionSessions) {
    const existing = byId.get(session.id);
    byId.set(session.id, {
      ...(existing ?? session),
      hasBills: existing?.hasBills ?? false,
      hasQuestions: true,
    });
  }

  return [...byId.values()].sort((a, b) =>
    b.start_date.localeCompare(a.start_date)
  );
}
