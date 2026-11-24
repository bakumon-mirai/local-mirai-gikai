const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function parseYmd(
  dateStr: string
): { year: number; month: number; day: number } | null {
  const match = dateStr.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/**
 * タイムゾーンに依存せず "YYYY-MM-DD" を "YYYY年M月D日（曜）" へ整形する。
 */
export function formatJapaneseDateWithWeekday(dateStr: string): string {
  const ymd = parseYmd(dateStr);
  if (!ymd) return dateStr;
  const weekday =
    WEEKDAYS[new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day)).getUTCDay()];
  return `${ymd.year}年${ymd.month}月${ymd.day}日（${weekday}）`;
}

/**
 * タイムゾーンに依存せず "YYYY-MM-DD" を "YYYY年M月D日" へ整形する。
 */
export function formatJapaneseDatePlain(dateStr: string): string {
  const ymd = parseYmd(dateStr);
  if (!ymd) return dateStr;
  return `${ymd.year}年${ymd.month}月${ymd.day}日`;
}
