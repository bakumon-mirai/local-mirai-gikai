import { describe, expect, it } from "vitest";
import {
  buildClosedHeroCopy,
  resolveClosedHeroFeature,
} from "./resolve-hero-feature";

describe("resolveClosedHeroFeature", () => {
  const allAvailable = {
    hasPressConference: true,
    hasCommitteeMeetings: true,
    hasGeneralQuestions: true,
  };

  it("記者会見 → 委員会 → 一般質問 → none の優先順でフォールバックする", () => {
    expect(
      resolveClosedHeroFeature(
        {
          pressConferences: true,
          committeeMinutes: true,
          generalQuestions: true,
        },
        allAvailable
      )
    ).toBe("press-conference");

    expect(
      resolveClosedHeroFeature(
        {
          pressConferences: false,
          committeeMinutes: true,
          generalQuestions: true,
        },
        allAvailable
      )
    ).toBe("committee");

    expect(
      resolveClosedHeroFeature(
        {
          pressConferences: false,
          committeeMinutes: false,
          generalQuestions: true,
        },
        allAvailable
      )
    ).toBe("general-questions");

    expect(
      resolveClosedHeroFeature(
        {
          pressConferences: true,
          committeeMinutes: true,
          generalQuestions: true,
        },
        {
          hasPressConference: false,
          hasCommitteeMeetings: false,
          hasGeneralQuestions: false,
        }
      )
    ).toBe("none");
  });
});

describe("buildClosedHeroCopy", () => {
  it("首長役職・自治体名・議会名を使った説明文を返す", () => {
    const pressCopy = buildClosedHeroCopy("press-conference", {
      cityName: "上毛町",
      councilName: "上毛町議会",
      executiveTitle: "町長",
    });
    expect(pressCopy.line1).toContain("町長の記者会見");
    expect(pressCopy.line2).toContain("上毛町");

    const qCopy = buildClosedHeroCopy("general-questions", {
      cityName: "上毛町",
      councilName: "上毛町議会",
      executiveTitle: "町長",
    });
    expect(qCopy.line1).toContain("上毛町議会");
  });
});
