import { describe, expect, it } from "vitest";
import { COMMITTEE_TYPE_ORDER, getCommitteeTypeLabel } from "./committee-type";

describe("getCommitteeTypeLabel", () => {
  it("DB の committee_type から区分ラベルを返す", () => {
    expect(getCommitteeTypeLabel("standing")).toBe("常任委員会");
    expect(getCommitteeTypeLabel("special")).toBe("特別委員会");
    expect(getCommitteeTypeLabel("budget")).toBe("予算・決算");
    expect(getCommitteeTypeLabel("audit")).toBe("予算・決算");
    expect(getCommitteeTypeLabel("management")).toBe("議会運営委員会");
  });

  it("committee_type が null のときは委員会名から推定する", () => {
    expect(getCommitteeTypeLabel(null, "議会運営委員会")).toBe(
      "議会運営委員会"
    );
    expect(getCommitteeTypeLabel(null, "予算特別委員会")).toBe("予算・決算");
    expect(getCommitteeTypeLabel(null, "決算特別委員会")).toBe("予算・決算");
    expect(getCommitteeTypeLabel(null, "防災対策特別委員会")).toBe(
      "特別委員会"
    );
    expect(getCommitteeTypeLabel(null, "総務委員会")).toBe("常任委員会");
  });

  it("スラッグからもフォールバック推定できる", () => {
    expect(getCommitteeTypeLabel(undefined, "", "gikai-unei")).toBe(
      "議会運営委員会"
    );
    expect(getCommitteeTypeLabel(undefined, "", "yosan")).toBe("予算・決算");
    expect(getCommitteeTypeLabel(undefined, "", "unknown-slug")).toBe(
      "常任委員会"
    );
  });

  it("表示順は4区分すべてを含む", () => {
    expect(COMMITTEE_TYPE_ORDER).toEqual([
      "常任委員会",
      "特別委員会",
      "予算・決算",
      "議会運営委員会",
    ]);
  });
});
