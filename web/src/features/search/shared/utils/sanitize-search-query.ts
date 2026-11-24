/**
 * PostgREST の `.or()` フィルタ構文に埋め込む検索語をサニタイズし、
 * 安全な ILIKE パターン（`%...%`）を返す。
 *
 * - PostgREST の論理式区切り・引用符（`,`, `(`, `)`, `"`, `*`）を除去し、
 *   フィルタインジェクションおよび PGRST100 構文エラーを防ぐ。
 * - ILIKE ワイルドカード（`\`, `%`, `_`）をエスケープして全件ヒットを防ぐ。
 * - 実効文字が残らない場合は null を返す。
 */
export function buildSafeIlikePattern(rawQuery: string): string | null {
  const stripped = rawQuery
    .replace(/[,()"*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return null;

  const escaped = stripped
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");

  return `%${escaped}%`;
}
