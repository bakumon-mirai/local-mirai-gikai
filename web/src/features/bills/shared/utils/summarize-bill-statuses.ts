import type { BillPublishStatus, BillStatusEnum } from "../types";
import { getCardStatusLabel } from "./bill-status";

export type BillStatusEntry = {
  status: BillStatusEnum;
  publishStatus: BillPublishStatus;
};

export type BillStatusChip = {
  label: string;
  count: number;
};

const DELIBERATING_LABEL = "議会審議中";

export type BillStatusSummary = {
  /** 件数チップの合計（published + coming_soon） */
  total: number;
  chips: BillStatusChip[];
  /** まだ審議が終わっていない議案の数 */
  deliberatingCount: number;
  /** 中身が読める議案の数 */
  publishedCount: number;
  /** 中身が未掲載の議案の数 */
  comingSoonCount: number;
  /** 全件が同じラベルに収まるか */
  isUniform: boolean;
};

/**
 * 議案の審議状況を集計する。表示順は件数の多い順。
 */
export function summarizeBillStatuses(
  entries: BillStatusEntry[]
): BillStatusSummary {
  const counts = new Map<string, number>();
  let publishedCount = 0;
  let comingSoonCount = 0;

  for (const entry of entries) {
    const label = getCardStatusLabel(entry.status);
    counts.set(label, (counts.get(label) ?? 0) + 1);

    if (entry.publishStatus === "published") publishedCount++;
    if (entry.publishStatus === "coming_soon") comingSoonCount++;
  }

  const chips = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    total: entries.length,
    chips,
    deliberatingCount: counts.get(DELIBERATING_LABEL) ?? 0,
    publishedCount,
    comingSoonCount,
    isUniform: chips.length === 1,
  };
}

/**
 * 件数要約の見出し文言を組み立てる。
 */
export function buildBillSummaryHeadline(
  summary: BillStatusSummary,
  isInSession: boolean
): string | null {
  if (summary.total === 0) return null;

  if (isInSession && summary.deliberatingCount > 0) {
    return `いま${summary.deliberatingCount}件を審議中`;
  }

  const scope = isInSession ? "この会期" : "前回";

  if (summary.isUniform) {
    return `${scope}の議案はすべて${summary.chips[0].label}`;
  }

  const approved = summary.chips.find((chip) => chip.label === "可決");
  if (approved) {
    return `${summary.total}件中${approved.count}件が可決`;
  }

  return `${scope}の議案は${summary.total}件`;
}

/**
 * 中身が未掲載の議案がある場合の補足文言。全件が掲載済みなら null。
 */
export function buildComingSoonNote(summary: BillStatusSummary): string | null {
  if (summary.comingSoonCount === 0) return null;

  if (summary.publishedCount === 0) {
    return "内容は準備でき次第、順次掲載します";
  }

  return `うち${summary.publishedCount}件の内容を掲載中（残りは順次掲載します）`;
}
