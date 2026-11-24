import { describe, expect, it } from "vitest";
import {
  buildBillSummaryHeadline,
  buildComingSoonNote,
  summarizeBillStatuses,
} from "./summarize-bill-statuses";

describe("summarizeBillStatuses", () => {
  it("審議中系ステータスを合算し、publishStatus ごとの件数を数える", () => {
    const summary = summarizeBillStatuses([
      { status: "submitted", publishStatus: "published" },
      { status: "in_committee", publishStatus: "coming_soon" },
      { status: "approved", publishStatus: "published" },
    ]);

    expect(summary.total).toBe(3);
    expect(summary.deliberatingCount).toBe(2);
    expect(summary.publishedCount).toBe(2);
    expect(summary.comingSoonCount).toBe(1);
    expect(summary.isUniform).toBe(false);
    expect(summary.chips).toEqual([
      { label: "議会審議中", count: 2 },
      { label: "可決", count: 1 },
    ]);
  });
});

describe("buildBillSummaryHeadline", () => {
  it("会期中で審議中議案がある場合は審議中件数を出す", () => {
    const summary = summarizeBillStatuses([
      { status: "submitted", publishStatus: "published" },
      { status: "approved", publishStatus: "published" },
    ]);
    expect(buildBillSummaryHeadline(summary, true)).toBe("いま1件を審議中");
  });

  it("閉会中で全件可決なら均一文言を出す", () => {
    const summary = summarizeBillStatuses([
      { status: "approved", publishStatus: "published" },
      { status: "approved", publishStatus: "published" },
    ]);
    expect(buildBillSummaryHeadline(summary, false)).toBe(
      "前回の議案はすべて可決"
    );
  });

  it("0件なら null を返す", () => {
    expect(
      buildBillSummaryHeadline(summarizeBillStatuses([]), false)
    ).toBeNull();
  });
});

describe("buildComingSoonNote", () => {
  it("coming_soon が無ければ null、一部掲載なら件数を出す", () => {
    const allPublished = summarizeBillStatuses([
      { status: "approved", publishStatus: "published" },
    ]);
    expect(buildComingSoonNote(allPublished)).toBeNull();

    const mixed = summarizeBillStatuses([
      { status: "approved", publishStatus: "published" },
      { status: "submitted", publishStatus: "coming_soon" },
    ]);
    expect(buildComingSoonNote(mixed)).toBe(
      "うち1件の内容を掲載中（残りは順次掲載します）"
    );

    const nonePublished = summarizeBillStatuses([
      { status: "submitted", publishStatus: "coming_soon" },
    ]);
    expect(buildComingSoonNote(nonePublished)).toBe(
      "内容は準備でき次第、順次掲載します"
    );
  });
});
