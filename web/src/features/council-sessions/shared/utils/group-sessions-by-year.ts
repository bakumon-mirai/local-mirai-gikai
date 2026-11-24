import type { CouncilSession } from "../types";

export type SessionsByYear<T extends CouncilSession = CouncilSession> = {
  year: number;
  sessions: T[];
};

function parseYearMonth(
  dateStr: string
): { year: number; month: number } | null {
  const match = dateStr.slice(0, 10).match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

/**
 * 定例会を start_date の年でグループ化する（新しい年順・タイムゾーン非依存）
 */
export function groupSessionsByYear<T extends CouncilSession>(
  sessions: T[]
): SessionsByYear<T>[] {
  const map = new Map<number, T[]>();

  for (const session of sessions) {
    const ym = parseYearMonth(session.start_date);
    if (!ym) continue;
    const existing = map.get(ym.year);
    if (existing) {
      existing.push(session);
    } else {
      map.set(ym.year, [session]);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, sessionList]) => ({ year, sessions: sessionList }));
}

/**
 * 定例会の期間を "YYYY.M〜M"（年跨ぎ時は "YYYY.M〜YYYY.M"）形式でフォーマットする
 */
export function formatSessionPeriod(session: CouncilSession): string {
  const start = parseYearMonth(session.start_date);
  if (!start) return session.start_date;

  if (!session.end_date) {
    return `${start.year}.${start.month}`;
  }

  const end = parseYearMonth(session.end_date);
  if (!end) {
    return `${start.year}.${start.month}`;
  }

  if (start.year !== end.year) {
    return `${start.year}.${start.month}〜${end.year}.${end.month}`;
  }

  if (start.month === end.month) {
    return `${start.year}.${start.month}`;
  }

  return `${start.year}.${start.month}〜${end.month}`;
}
