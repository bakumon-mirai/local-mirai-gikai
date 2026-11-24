import { describe, expect, it } from "vitest";
import type { CouncilSession } from "../types";
import { mergePastCouncilSessions } from "./merge-past-sessions";

function makeSession(overrides: Partial<CouncilSession>): CouncilSession {
  return {
    id: "session-1",
    name: "令和8年3月定例会",
    slug: "2026-03",
    council_url: null,
    start_date: "2026-03-01",
    end_date: "2026-03-25",
    is_active: false,
    schedule_milestones: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

describe("mergePastCouncilSessions", () => {
  it("議案のみの会期は hasBills: true, hasQuestions: false になる", () => {
    const billOnly = makeSession({ id: "s1", start_date: "2026-03-01" });
    const result = mergePastCouncilSessions([billOnly], []);

    expect(result).toHaveLength(1);
    expect(result[0].hasBills).toBe(true);
    expect(result[0].hasQuestions).toBe(false);
  });

  it("一般質問のみの会期は hasBills: false, hasQuestions: true になる", () => {
    const questionOnly = makeSession({ id: "s2", start_date: "2026-06-01" });
    const result = mergePastCouncilSessions([], [questionOnly]);

    expect(result).toHaveLength(1);
    expect(result[0].hasBills).toBe(false);
    expect(result[0].hasQuestions).toBe(true);
  });

  it("議案と一般質問の両方が公開された会期は両方 true で重複しない", () => {
    const both = makeSession({ id: "s3", start_date: "2026-09-01" });
    const result = mergePastCouncilSessions([both], [both]);

    expect(result).toHaveLength(1);
    expect(result[0].hasBills).toBe(true);
    expect(result[0].hasQuestions).toBe(true);
  });

  it("議案のみ・質問のみ・両方の会期を混在させてもフラグを維持し開始日の降順で返す", () => {
    const billsOnly = makeSession({
      id: "s-bills",
      name: "令和7年12月定例会",
      start_date: "2025-12-01",
    });
    const questionsOnly = makeSession({
      id: "s-questions",
      name: "令和8年6月定例会",
      start_date: "2026-06-01",
    });
    const both = makeSession({
      id: "s-both",
      name: "令和8年3月定例会",
      start_date: "2026-03-01",
    });

    const result = mergePastCouncilSessions(
      [billsOnly, both],
      [both, questionsOnly]
    );

    expect(result.map((s) => s.id)).toEqual([
      "s-questions",
      "s-both",
      "s-bills",
    ]);
    expect(result[0]).toMatchObject({
      id: "s-questions",
      hasBills: false,
      hasQuestions: true,
    });
    expect(result[1]).toMatchObject({
      id: "s-both",
      hasBills: true,
      hasQuestions: true,
    });
    expect(result[2]).toMatchObject({
      id: "s-bills",
      hasBills: true,
      hasQuestions: false,
    });
  });

  it("両方空のときは空配列を返す", () => {
    expect(mergePastCouncilSessions([], [])).toEqual([]);
  });
});
