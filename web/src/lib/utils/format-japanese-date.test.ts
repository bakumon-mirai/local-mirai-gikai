import { describe, expect, it } from "vitest";
import {
  formatJapaneseDatePlain,
  formatJapaneseDateWithWeekday,
} from "./format-japanese-date";

describe("format-japanese-date", () => {
  it("YYYY-MM-DD を曜日付き・曜日なしの日本語日付に整形する", () => {
    expect(formatJapaneseDateWithWeekday("2026-04-28")).toBe(
      "2026年4月28日（火）"
    );
    expect(formatJapaneseDatePlain("2026-04-28")).toBe("2026年4月28日");
  });

  it("ISO タイムスタンプの先頭日付も処理し、不正形式はそのまま返す", () => {
    expect(formatJapaneseDatePlain("2026-01-01T00:00:00Z")).toBe(
      "2026年1月1日"
    );
    expect(formatJapaneseDatePlain("不明")).toBe("不明");
  });
});
