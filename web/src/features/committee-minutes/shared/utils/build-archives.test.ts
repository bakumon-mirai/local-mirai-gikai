import { describe, expect, it } from "vitest";
import type { CommitteeMeetingSummary } from "../types";
import { buildArchives } from "./build-archives";

function makeMeeting(
  overrides: Partial<CommitteeMeetingSummary>
): CommitteeMeetingSummary {
  return {
    id: overrides.id ?? "m1",
    committeeName: overrides.committeeName ?? "総務企画委員会",
    committeeSlug: overrides.committeeSlug ?? "somu",
    committeeType: overrides.committeeType ?? "standing",
    meetingDate: overrides.meetingDate ?? "2026-04-01",
    title: overrides.title ?? "委員会記録",
    sourceId: null,
    sourceUrl: null,
    summary: null,
    topics: [],
    speechCount: 10,
    ...overrides,
  };
}

describe("buildArchives", () => {
  it("入力順に関係なく最新開催日の名称・日付を採用し、最新順で返す", () => {
    const archives = buildArchives([
      makeMeeting({
        id: "old",
        committeeSlug: "somu",
        committeeName: "旧総務委員会",
        meetingDate: "2025-11-01",
      }),
      makeMeeting({
        id: "new",
        committeeSlug: "somu",
        committeeName: "総務企画委員会",
        meetingDate: "2026-05-10",
      }),
      makeMeeting({
        id: "other",
        committeeSlug: "bunkyo",
        committeeName: "文教厚生委員会",
        meetingDate: "2026-06-01",
      }),
    ]);

    expect(archives).toEqual([
      {
        slug: "bunkyo",
        name: "文教厚生委員会",
        committeeType: "standing",
        meetingCount: 1,
        latestMeetingDate: "2026-06-01",
      },
      {
        slug: "somu",
        name: "総務企画委員会",
        committeeType: "standing",
        meetingCount: 2,
        latestMeetingDate: "2026-05-10",
      },
    ]);
  });
});
