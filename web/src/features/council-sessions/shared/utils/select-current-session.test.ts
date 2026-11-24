import { describe, expect, it } from "vitest";
import type { CouncilSession } from "../types";
import { selectCurrentCouncilSession } from "./select-current-session";

function makeSession(overrides: Partial<CouncilSession>): CouncilSession {
  return {
    id: "s1",
    name: "令和8年3月定例会",
    slug: "r8-03",
    council_url: null,
    start_date: "2026-03-01",
    end_date: "2026-03-25",
    is_active: false,
    schedule_milestones: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("selectCurrentCouncilSession", () => {
  it("end_date が null の過去会期は後続会期が開会済みなら現在会期から除外する", () => {
    const june = makeSession({
      id: "s6",
      name: "令和8年6月定例会",
      start_date: "2026-06-01",
      end_date: "2026-06-25",
    });
    const marchOpenEnded = makeSession({
      id: "s3",
      name: "令和8年3月定例会",
      start_date: "2026-03-01",
      end_date: null,
    });

    expect(
      selectCurrentCouncilSession([june, marchOpenEnded], "2026-07-10")
    ).toBeNull();
  });

  it("最新会期の end_date が null なら引き続き開催中として選択する", () => {
    const juneOpenEnded = makeSession({
      id: "s6",
      name: "令和8年6月定例会",
      start_date: "2026-06-01",
      end_date: null,
    });
    const march = makeSession({
      id: "s3",
      name: "令和8年3月定例会",
      start_date: "2026-03-01",
      end_date: "2026-03-25",
    });

    expect(
      selectCurrentCouncilSession([juneOpenEnded, march], "2026-06-15")?.id
    ).toBe("s6");
  });

  it("終了済みの短期臨時会の背後に開催中の定例会があれば定例会を返す", () => {
    const extra = makeSession({
      id: "s6-extra",
      name: "令和8年6月臨時会",
      start_date: "2026-06-10",
      end_date: "2026-06-10",
    });
    const june = makeSession({
      id: "s6",
      name: "令和8年6月定例会",
      start_date: "2026-06-01",
      end_date: "2026-06-25",
    });

    expect(selectCurrentCouncilSession([extra, june], "2026-06-15")?.id).toBe(
      "s6"
    );
  });
});
