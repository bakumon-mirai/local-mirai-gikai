import { describe, expect, it } from "vitest";
import { buildSafeIlikePattern } from "./sanitize-search-query";

describe("buildSafeIlikePattern", () => {
  it("通常キーワードを %keyword% に変換する", () => {
    expect(buildSafeIlikePattern("子育て")).toBe("%子育て%");
  });

  it("PostgREST .or() フィルタインジェクション文字を除去する", () => {
    expect(buildSafeIlikePattern("予算(案)")).toBe("%予算 案%");
    expect(buildSafeIlikePattern("zzzz%,raw_text.ilike.%秘密%")).not.toContain(
      ","
    );
    expect(buildSafeIlikePattern("zzzz%,raw_text.ilike.%秘密%")).toBe(
      "%zzzz\\% raw\\_text.ilike.\\%秘密\\%%"
    );
  });

  it("ILIKE ワイルドカードとバックスラッシュをエスケープする", () => {
    expect(buildSafeIlikePattern("100%")).toBe("%100\\%%");
    expect(buildSafeIlikePattern("a_b\\c")).toBe("%a\\_b\\\\c%");
  });

  it("記号や空白のみの入力は null を返す", () => {
    expect(buildSafeIlikePattern("   ")).toBeNull();
    expect(buildSafeIlikePattern(',()"*')).toBeNull();
  });
});
