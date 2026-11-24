import { describe, expect, it } from "vitest";
import {
  extractSessionLabel,
  formatConferenceHeading,
  formatCurrentSessionPill,
  formatNextSessionPill,
  formatShortDate,
} from "./format-hero-date";

describe("format-hero-date", () => {
  it("会見見出しと短い日付を整形する", () => {
    expect(formatConferenceHeading("2026-09-02")).toBe("9月2日（水）の会見");
    expect(formatShortDate("2026-08-21")).toBe("8月21日");
  });

  it("次の定例会ピルを整形し、null のときは null を返す", () => {
    expect(formatNextSessionPill("2026-12-01")).toBe("次の定例会 12月1日から");
    expect(formatNextSessionPill(null)).toBeNull();
  });

  it("会期名からラベルを抽出し、現在会期ピルを作る", () => {
    expect(extractSessionLabel("令和8年 9月定例会")).toBe("9月定例会");
    expect(extractSessionLabel("令和8年 5月臨時会")).toBe("5月臨時会");
    expect(formatCurrentSessionPill("令和8年 9月定例会", "2026-10-16")).toEqual(
      {
        full: "9月定例会 10月16日まで",
        short: "10月16日まで",
      }
    );
  });
});
