import { describe, expect, it } from "vitest";
import {
  buildInSessionLead,
  buildSessionSteps,
  calcSessionProgress,
  formatSessionRange,
} from "./session-progress";

describe("calcSessionProgress", () => {
  it("両端を含めて日数と進捗率を算出する", () => {
    expect(
      calcSessionProgress("2026-09-09", "2026-10-16", "2026-09-24")
    ).toEqual({
      dayNumber: 16,
      totalDays: 38,
      percent: 42,
    });
  });

  it("endDate が null のときは null を返す", () => {
    expect(calcSessionProgress("2026-09-09", null, "2026-09-24")).toBeNull();
  });
});

describe("buildSessionSteps", () => {
  it("milestones 無しなら開会・閉会の2行になる", () => {
    const steps = buildSessionSteps("2026-09-09", "2026-10-16", "2026-09-20");
    expect(steps).toEqual([
      { date: "9月9日", label: "開会・議案の説明", status: "done" },
      { date: "10月16日", label: "閉会", status: "upcoming" },
    ]);
  });

  it("採決日と閉会日が同じときは1行にまとめる", () => {
    const steps = buildSessionSteps("2026-12-01", "2026-12-18", "2026-12-08", {
      representativeQuestions: null,
      generalQuestions: { from: "2026-12-07", to: "2026-12-09" },
      standingCommittees: null,
      billVote: "2026-12-18",
    });
    expect(steps).toEqual([
      { date: "12月1日", label: "開会・議案の説明", status: "done" },
      { date: "12月7日〜9日", label: "代表質問・一般質問", status: "current" },
      { date: "12月18日", label: "議案の採決・閉会", status: "upcoming" },
    ]);
  });
});

describe("buildInSessionLead / formatSessionRange", () => {
  it("会期名から導入文と期間文字列を組み立てる", () => {
    expect(buildInSessionLead("令和8年 9月定例会")).toBe("いまは9月定例会。");
    expect(formatSessionRange("2026-09-09", "2026-10-16")).toBe(
      "9月9日〜10月16日"
    );
    expect(formatSessionRange("2026-09-09", null)).toBe("9月9日から");
  });
});
