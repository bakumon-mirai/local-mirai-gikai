import type { Route } from "next";
import Link from "next/link";
import type { CommitteeMeetingSummary } from "@/features/committee-minutes/shared/types";
import { routes } from "@/lib/routes";
import { formatShortDate } from "../../shared/utils/format-hero-date";

const MAX_ITEMS = 3;

type Props = {
  meetings: CommitteeMeetingSummary[];
};

/**
 * 首長記者会見が無い自治体向けのフォールバック主役カード（委員会）。
 */
export function CommitteeHeroCard({ meetings }: Props) {
  const items = meetings.slice(0, MAX_ITEMS);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-[28px] bg-white p-6">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-archive-pill-bg px-3 py-1 text-xs font-medium text-archive-pill-text">
          委員会
        </span>
        <span className="font-rounded text-base font-bold text-mirai-text">
          最近の話し合い
        </span>
        <span className="ml-auto rounded-full bg-mirai-surface-warm px-2.5 py-0.5 text-xs font-medium text-archive-beige-text">
          最新
        </span>
      </div>

      <ol className="flex flex-col">
        {items.map((meeting, index) => {
          const headline = meeting.topics[0]?.title ?? meeting.title;
          return (
            <li
              key={meeting.id}
              className="border-b border-archive-divider last:border-b-0"
            >
              <Link
                href={
                  routes.committeeMeeting(
                    meeting.committeeSlug,
                    meeting.id
                  ) as Route
                }
                className="flex flex-col gap-0.5 py-3 hover:text-archive-accent"
              >
                <span className="flex items-baseline gap-2 text-xs text-mirai-text-secondary">
                  <span className="font-bold text-archive-accent tabular-nums">
                    {index + 1}
                  </span>
                  <span className="font-medium text-mirai-text">
                    {meeting.committeeName}
                  </span>
                  <span className="ml-auto whitespace-nowrap">
                    {formatShortDate(meeting.meetingDate)}
                  </span>
                </span>
                <span className="pl-4 text-sm leading-relaxed text-mirai-text">
                  {headline}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex items-center justify-end border-t border-archive-divider pt-3">
        <Link
          href={routes.committees() as Route}
          className="text-sm font-medium text-archive-accent hover:text-archive-accent-hover"
        >
          委員会をぜんぶ見る
        </Link>
      </div>
    </div>
  );
}
