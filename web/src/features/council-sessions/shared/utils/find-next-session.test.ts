import { describe, expect, it } from "vitest";
import type { CouncilSession } from "../types";
import { findNextRegularSession } from "./find-next-session";

function makeSession(overrides: Partial<CouncilSession>): CouncilSession {
  return {
    id: overrides.id ?? "id",
    name: overrides.name ?? "令和8年9月定例会",
    slug: overrides.slug ?? "r8-09",
    council_url: null,
    start_date: overrides.start_date ?? "2026-09-01",
    end_date: overrides.end_date ?? "2026-09-30",
    is_active: false,
    schedule_milestones: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("findNextRegularSession", () => {
  it("臨時会を除外して最も早い未来の定例会を返す", () => {
    const sessions = [
      makeSession({
        id: "past",
        name: "令和8年6月定例会",
        start_date: "2026-06-01",
      }),
      makeSession({
        id: "extra",
        name: "令和8年8月臨時会",
        start_date: "2026-08-10",
      }),
      makeSession({
        id: "dec",
        name: "令和8年12月定例会",
        start_date: "2026-12-01",
      }),
      makeSession({
        id: "sep",
        name: "令和8年9月定例会",
        start_date: "2026-09-04",
      }),
    ];
    expect(findNextRegularSession(sessions, "2026-07-15")?.id).toBe("sep");
  });

  it("未来の定例会が無ければ null を返す", () => {
    const sessions = [
      makeSession({
        id: "past",
        name: "令和8年6月定例会",
        start_date: "2026-06-01",
      }),
    ];
    expect(findNextRegularSession(sessions, "2026-07-15")).toBeNull();
  });
});
