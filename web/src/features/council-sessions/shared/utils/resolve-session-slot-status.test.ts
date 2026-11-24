import { describe, expect, it } from "vitest";
import type { CouncilSession } from "../types";
import {
  isRegularSession,
  resolveSessionSlots,
} from "./resolve-session-slot-status";

function makeSession(overrides: Partial<CouncilSession>): CouncilSession {
  return {
    id: overrides.id ?? "id-1",
    name: overrides.name ?? "令和8年3月定例会",
    slug: overrides.slug ?? "r8-03",
    council_url: null,
    start_date: overrides.start_date ?? "2026-03-01",
    end_date: overrides.end_date ?? "2026-03-25",
    is_active: false,
    schedule_milestones: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("isRegularSession", () => {
  it("定例会を true、臨時会を false と判定する", () => {
    expect(isRegularSession(makeSession({ name: "令和8年6月定例会" }))).toBe(
      true
    );
    expect(isRegularSession(makeSession({ name: "令和8年5月臨時会" }))).toBe(
      false
    );
  });
});

describe("resolveSessionSlots", () => {
  const yearSessions = [
    makeSession({
      id: "s3",
      name: "令和8年3月定例会",
      slug: "r8-03",
      start_date: "2026-03-02",
      end_date: "2026-03-24",
    }),
    makeSession({
      id: "s5-extra",
      name: "令和8年5月臨時会",
      slug: "r8-05-extra",
      start_date: "2026-05-15",
      end_date: "2026-05-15",
    }),
    makeSession({
      id: "s6",
      name: "令和8年6月定例会",
      slug: "r8-06",
      start_date: "2026-06-05",
      end_date: "2026-06-25",
    }),
    makeSession({
      id: "s9",
      name: "令和8年9月定例会",
      slug: "r8-09",
      start_date: "2026-09-04",
      end_date: "2026-09-30",
    }),
    makeSession({
      id: "s12",
      name: "令和8年12月定例会",
      slug: "r8-12",
      start_date: "2026-12-01",
      end_date: "2026-12-18",
    }),
  ];

  it("閉会中は直近の未来会期だけを next として強調する", () => {
    const slots = resolveSessionSlots(
      yearSessions,
      "2026-07-10",
      [3, 6, 9, 12]
    );
    expect(slots.map((s) => [s.month, s.status])).toEqual([
      [3, "finished"],
      [6, "finished"],
      [9, "next"],
      [12, "upcoming"],
    ]);
  });

  it("会期中は in_session のみを強調し next は出さない", () => {
    const slots = resolveSessionSlots(
      yearSessions,
      "2026-06-15",
      [3, 6, 9, 12]
    );
    expect(slots.map((s) => [s.month, s.status])).toEqual([
      [3, "finished"],
      [6, "in_session"],
      [9, "upcoming"],
      [12, "upcoming"],
    ]);
  });

  it("都道府県型の開催月 [2, 6, 9, 12] にも対応する", () => {
    const prefSessions = [
      makeSession({
        id: "s2",
        name: "令和8年2月定例会",
        slug: "r8-02",
        start_date: "2026-02-20",
        end_date: "2026-03-25",
      }),
    ];
    const slots = resolveSessionSlots(
      prefSessions,
      "2026-03-01",
      [2, 6, 9, 12]
    );
    expect(slots[0]).toMatchObject({
      month: 2,
      status: "in_session",
      description: "新しい年度の予算を決める",
    });
    expect(slots[1]).toMatchObject({
      month: 6,
      status: "upcoming",
      session: null,
    });
  });

  it("end_date が未確定でも次の会期が始まっていれば finished に打ち切る", () => {
    const sessions = [
      makeSession({
        id: "s3",
        name: "令和8年3月定例会",
        start_date: "2026-03-02",
        end_date: null,
      }),
      makeSession({
        id: "s6",
        name: "令和8年6月定例会",
        start_date: "2026-06-05",
        end_date: "2026-06-25",
      }),
    ];
    const slots = resolveSessionSlots(sessions, "2026-06-10", [3, 6, 9, 12]);
    expect(slots[0].status).toBe("finished");
    expect(slots[1].status).toBe("in_session");
  });
});
