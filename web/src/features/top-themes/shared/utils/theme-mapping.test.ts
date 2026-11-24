import { describe, expect, it } from "vitest";
import {
  buildTopThemes,
  splitThemeLabel,
  themeForQuestionCategory,
  themeHref,
} from "./theme-mapping";

describe("top-themes", () => {
  it("8番目のテーマが governmentTerm に応じて動的に生成される", () => {
    const townThemes = buildTopThemes("町政");
    expect(townThemes).toHaveLength(8);
    expect(townThemes[7]).toMatchObject({
      slug: "gyosei-okane",
      label: "町政・お金",
      kanji: "町",
      searchQuery: "町政",
    });

    const prefThemes = buildTopThemes("県政");
    expect(prefThemes[7].label).toBe("県政・お金");
    expect(prefThemes[7].kanji).toBe("県");
  });

  it("splitThemeLabel が中黒で2行分割する", () => {
    expect(splitThemeLabel("環境・エネルギー")).toEqual({
      head: "環境",
      tail: "エネルギー",
    });
    expect(splitThemeLabel("その他")).toEqual({ head: "その他", tail: null });
  });

  it("themeHref と themeForQuestionCategory が正しく動く", () => {
    const themes = buildTopThemes("市政");
    expect(themeHref(themes[0])).toBe("/search?q=%E5%AD%90%E8%82%B2%E3%81%A6");
    expect(themeForQuestionCategory("行政・議会", themes)?.slug).toBe(
      "gyosei-okane"
    );
    expect(themeForQuestionCategory("未定義", themes)).toBeNull();
  });
});
