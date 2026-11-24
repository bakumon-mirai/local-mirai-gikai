import type { CommitteeType } from "../types";

export type CommitteeTypeLabel =
  | "常任委員会"
  | "特別委員会"
  | "予算・決算"
  | "議会運営委員会";

/** 一覧ページでのグループ表示順 */
export const COMMITTEE_TYPE_ORDER: CommitteeTypeLabel[] = [
  "常任委員会",
  "特別委員会",
  "予算・決算",
  "議会運営委員会",
];

const LABEL_BY_TYPE: Record<CommitteeType, CommitteeTypeLabel> = {
  standing: "常任委員会",
  special: "特別委員会",
  budget: "予算・決算",
  audit: "予算・決算",
  management: "議会運営委員会",
};

/**
 * 委員会の区分ラベルを返す。
 *
 * 1. DB の `committees.committee_type` があればそれを使う
 * 2. 未登録（特別委員会等で `committee_id` が null）の場合は名称・スラッグから推定する
 */
export function getCommitteeTypeLabel(
  committeeType: CommitteeType | null | undefined,
  committeeName?: string,
  committeeSlug?: string
): CommitteeTypeLabel {
  if (committeeType && committeeType in LABEL_BY_TYPE) {
    return LABEL_BY_TYPE[committeeType];
  }

  const name = committeeName ?? "";
  const slug = committeeSlug ?? "";

  if (name.includes("議会運営") || slug.includes("gikai-unei")) {
    return "議会運営委員会";
  }
  if (
    name.includes("予算") ||
    name.includes("決算") ||
    slug === "yosan" ||
    slug === "kessan"
  ) {
    return "予算・決算";
  }
  if (name.includes("特別")) {
    return "特別委員会";
  }

  return "常任委員会";
}
