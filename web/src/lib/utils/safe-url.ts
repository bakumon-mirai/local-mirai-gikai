/**
 * 外部リンクとして安全に <a href> へ渡せる URL（http: / https: のみ）を返す。
 * javascript: や data: などの危険なスキーム、不正な URL は null を返す。
 */
export function toSafeExternalUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
