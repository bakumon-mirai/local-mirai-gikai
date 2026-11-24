import type { CouncilSession } from "../types";
import { isRegularSession } from "./resolve-session-slot-status";

function toComparable(date: string): number {
  return Number(date.slice(0, 10).replaceAll("-", ""));
}

/**
 * 次に開会する定例会を返す（臨時会は除く）。
 *
 * @param sessions 候補の会期（臨時会が混ざっていてよい）
 * @param today 基準日（"YYYY-MM-DD"）
 * @returns 開会日が今日より後で最も早いもの。無ければ null
 */
export function findNextRegularSession(
  sessions: CouncilSession[],
  today: string
): CouncilSession | null {
  const now = toComparable(today);

  const upcoming = sessions
    .filter(isRegularSession)
    .filter((s) => toComparable(s.start_date) > now)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  return upcoming[0] ?? null;
}
