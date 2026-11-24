import type { Route } from "next";
import Link from "next/link";
import type { BillStatusSummary } from "@/features/bills/shared/utils/summarize-bill-statuses";
import {
  buildBillSummaryHeadline,
  buildComingSoonNote,
} from "@/features/bills/shared/utils/summarize-bill-statuses";
import { routes } from "@/lib/routes";

type Props = {
  billSummary: BillStatusSummary;
  billsSessionSlug: string | null;
  isInSession: boolean;
};

/**
 * 議案サマリカード（議案パーツが有効かつデータがあるときに表示）。
 */
export function BillSummaryCard({
  billSummary,
  billsSessionSlug,
  isInSession,
}: Props) {
  const billHeadline = buildBillSummaryHeadline(billSummary, isInSession);
  const comingSoonNote = buildComingSoonNote(billSummary);

  if (!billHeadline) return null;

  const href = billsSessionSlug
    ? routes.sessionBills(billsSessionSlug)
    : routes.sessions();

  return (
    <section className="mx-4 mt-10 pc:mx-16 pc:mt-12">
      <Link
        href={href as Route}
        className="flex flex-col gap-2.5 rounded-[28px] bg-white p-6 hover:bg-archive-surface-tint"
      >
        <span className="text-xs font-medium text-archive-accent">議案</span>
        <span className="font-rounded text-lg font-bold text-mirai-text">
          {billHeadline}
        </span>

        <span className="flex flex-wrap gap-1.5">
          {billSummary.chips.map((chip) => (
            <span
              key={chip.label}
              className="rounded-full bg-archive-surface-sub px-2.5 py-1 text-xs text-mirai-text-secondary"
            >
              {chip.label} {chip.count}
            </span>
          ))}
        </span>

        {comingSoonNote && (
          <span className="text-xs text-mirai-text-secondary">
            {comingSoonNote}
          </span>
        )}
      </Link>
    </section>
  );
}
