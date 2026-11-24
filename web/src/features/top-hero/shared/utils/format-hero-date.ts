/**
 * トップのヒーロー・会見カードで使う日付整形。
 * 実行環境のタイムゾーンに依存しないよう日付文字列を直接分解する。
 */

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

type Ymd = { year: number; month: number; day: number };

function parseYmd(isoDate: string): Ymd | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function weekdayOf({ year, month, day }: Ymd): string {
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

/** "2026-09-02" → "9月2日（水）の会見" */
export function formatConferenceHeading(isoDate: string): string {
  const ymd = parseYmd(isoDate);
  if (!ymd) return isoDate;
  return `${ymd.month}月${ymd.day}日（${weekdayOf(ymd)}）の会見`;
}

/** "2026-08-21" → "8月21日" */
export function formatShortDate(isoDate: string): string {
  const ymd = parseYmd(isoDate);
  if (!ymd) return isoDate;
  return `${ymd.month}月${ymd.day}日`;
}

/** "2026-12-01" → "次の定例会 12月1日から" */
export function formatNextSessionPill(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const ymd = parseYmd(isoDate);
  if (!ymd) return null;
  return `次の定例会 ${ymd.month}月${ymd.day}日から`;
}

/** "令和8年 9月定例会" → "9月定例会" */
export function extractSessionLabel(sessionName: string): string | null {
  const match = sessionName.match(/(\d+月(?:定例会|臨時会))/);
  return match ? match[1] : null;
}

export function formatCurrentSessionPill(
  sessionName: string,
  endDate: string | null
): { full: string; short: string } | null {
  const ymd = endDate ? parseYmd(endDate) : null;
  if (!ymd) return null;

  const until = `${ymd.month}月${ymd.day}日まで`;
  const label = extractSessionLabel(sessionName);

  return {
    full: label ? `${label} ${until}` : until,
    short: until,
  };
}
