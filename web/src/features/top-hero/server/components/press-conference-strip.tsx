import type { Route } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import type { PressConferenceSummary } from "@/features/press-conferences/shared/types";
import { routes } from "@/lib/routes";
import { formatShortDate } from "../../shared/utils/format-hero-date";

const MAX_TOPICS = 4;

type Props = {
  conference: PressConferenceSummary;
  executiveTitle?: string;
};

export function PressConferenceStrip({
  conference,
  executiveTitle = siteConfig.executiveTitle,
}: Props) {
  const href = routes.pressConferenceDetail(conference.slug);
  const topics = conference.topics.slice(0, MAX_TOPICS);

  return (
    <div className="mx-4 mt-3 flex flex-col rounded-[18px] bg-white px-4 pt-3.5 pb-1.5 pc:mx-16 pc:flex-row pc:items-start pc:gap-4 pc:rounded-[22px] pc:px-6 pc:py-4">
      <div className="mb-0.5 flex shrink-0 items-center gap-2 pc:mb-0 pc:min-h-7">
        <span className="rounded-full bg-archive-pill-bg px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-archive-pill-text pc:text-xs">
          {executiveTitle}会見
        </span>
        <span className="font-rounded text-sm font-bold whitespace-nowrap text-mirai-text pc:text-[15px]">
          {formatShortDate(conference.heldAt)}
        </span>

        <Link
          href={href as Route}
          className="ml-auto flex min-h-11 items-center text-xs font-medium text-archive-accent pc:hidden"
        >
          会見を見る →
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 flex-col pc:gap-1">
        {topics.map((topic, i) => (
          <Link
            key={topic.id}
            href={href as Route}
            className="flex min-h-11 items-center gap-2.5 border-t border-archive-divider text-sm text-mirai-text hover:text-archive-accent pc:min-h-0 pc:border-t-0 pc:text-[15px] pc:leading-7"
          >
            <span className="shrink-0 font-bold text-archive-accent">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate">{topic.title}</span>
          </Link>
        ))}
      </div>

      <Link
        href={href as Route}
        className="hidden shrink-0 text-[13px] font-medium whitespace-nowrap text-archive-accent pc:block pc:leading-7"
      >
        会見を見る →
      </Link>
    </div>
  );
}
