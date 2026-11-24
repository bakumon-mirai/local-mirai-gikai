import type { Route } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import type { SessionSlot } from "@/features/council-sessions/shared/utils/resolve-session-slot-status";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  slots: SessionSlot[];
  showBills?: boolean;
  showGeneralQuestions?: boolean;
};

const STATUS_LABELS = {
  finished: "おわった",
  in_session: "いま開会中",
  next: "つぎはここ",
  upcoming: "これから",
} as const;

function formatMonthDay(isoDate: string): string {
  const match = isoDate.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!match) return isoDate;
  return `${Number(match[1])}月${Number(match[2])}日`;
}

export function SessionBand({
  slots,
  showBills = siteConfig.features.bills,
  showGeneralQuestions = siteConfig.features.generalQuestions,
}: Props) {
  if (slots.length === 0) return null;

  return (
    <section className="mx-4 mt-10 rounded-[28px] bg-white p-5 pc:mx-16 pc:mt-12 pc:rounded-[32px] pc:p-9">
      <div className="flex flex-col gap-1 pcl:flex-row pcl:items-baseline pcl:justify-between pcl:gap-6">
        <h2 className="font-rounded text-xl font-bold text-mirai-text pc:text-2xl">
          定例会は年{slots.length}回。議会の本番です
        </h2>
        <p className="text-xs text-mirai-text-secondary pc:text-sm">
          議案の採決と一般質問は定例会で。あいだの期間は委員会などが開かれます。
        </p>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3 pc:mt-5 pc:grid-cols-4 pc:gap-3.5">
        {slots.map((slot) => {
          const isHighlighted =
            slot.status === "in_session" || slot.status === "next";
          return (
            <li
              key={slot.month}
              className={cn(
                "flex flex-col gap-2 rounded-[22px] p-4",
                isHighlighted
                  ? "border-2 border-archive-accent bg-archive-surface-tint"
                  : "bg-archive-surface-sub"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-rounded text-xl font-bold text-mirai-text">
                  {slot.month}月
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] whitespace-nowrap",
                    isHighlighted
                      ? "bg-archive-pill-bg text-archive-pill-text font-medium"
                      : "bg-mirai-surface-warm text-archive-beige-text"
                  )}
                >
                  {STATUS_LABELS[slot.status]}
                </span>
              </div>

              <span className="text-xs text-mirai-text-secondary">
                {slot.description}
              </span>

              <SlotLink
                slot={slot}
                showBills={showBills}
                showGeneralQuestions={showGeneralQuestions}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SlotLink({
  slot,
  showBills,
  showGeneralQuestions,
}: {
  slot: SessionSlot;
  showBills: boolean;
  showGeneralQuestions: boolean;
}) {
  const { session, status } = slot;
  if (!session) return null;

  if (status === "finished") {
    if (!session.slug) return null;

    const href = showBills
      ? routes.sessionBills(session.slug)
      : showGeneralQuestions
        ? routes.sessionQuestions(session.slug)
        : null;
    if (!href) return null;

    const label = showBills ? "議案を見る" : "一般質問を見る";

    return (
      <Link
        href={href as Route}
        className="mt-auto text-xs font-medium text-archive-accent hover:text-archive-accent-hover"
      >
        {label}
      </Link>
    );
  }

  if (status === "in_session" && session.end_date) {
    return (
      <span className="mt-auto text-xs font-medium text-archive-pill-text">
        {formatMonthDay(session.end_date)}まで
      </span>
    );
  }

  if (status === "next") {
    return (
      <span className="mt-auto text-xs font-medium text-archive-pill-text">
        {formatMonthDay(session.start_date)}から
      </span>
    );
  }

  return null;
}
