import type { Route } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import type {
  PressConferenceRef,
  PressConferenceSummary,
} from "@/features/press-conferences/shared/types";
import { routes } from "@/lib/routes";
import {
  formatConferenceHeading,
  formatShortDate,
} from "../../shared/utils/format-hero-date";

const MAX_RECENT = 3;
const MAX_TOPICS = 4;

type Props = {
  conference: PressConferenceSummary;
  recent: PressConferenceRef[];
  executiveTitle?: string;
};

export function PressConferenceCard({
  conference,
  recent,
  executiveTitle = siteConfig.executiveTitle,
}: Props) {
  const detailHref = routes.pressConferenceDetail(conference.slug);
  const topics = conference.topics.slice(0, MAX_TOPICS);

  return (
    <div className="flex flex-col gap-1 rounded-[28px] bg-white p-6">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-archive-pill-bg px-3 py-1 text-xs font-medium text-archive-pill-text">
          {executiveTitle}会見
        </span>
        <span className="font-rounded text-base font-bold text-mirai-text">
          {formatConferenceHeading(conference.heldAt)}
        </span>
        <span className="ml-auto rounded-full bg-mirai-surface-warm px-2.5 py-0.5 text-xs font-medium text-archive-beige-text">
          最新
        </span>
      </div>

      {topics.length > 0 && (
        <ol className="flex flex-col">
          {topics.map((topic, index) => (
            <li
              key={topic.id}
              className="border-b border-archive-divider last:border-b-0"
            >
              <Link
                href={detailHref as Route}
                className="flex gap-2.5 py-3 text-base leading-relaxed text-mirai-text hover:text-archive-accent"
              >
                <span
                  aria-hidden
                  className="font-bold text-archive-accent tabular-nums"
                >
                  {index + 1}
                </span>
                <span>{topic.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-archive-divider pt-3">
        {recent.length > 0 && (
          <>
            <span className="text-xs text-mirai-text-secondary">
              これまでの会見
            </span>
            {recent.slice(0, MAX_RECENT).map((ref) => (
              <Link
                key={ref.id}
                href={routes.pressConferenceDetail(ref.slug) as Route}
                className="rounded-full bg-archive-surface-tint px-2.5 py-1 text-xs text-mirai-text hover:bg-archive-pill-bg"
              >
                {formatShortDate(ref.heldAt)}
              </Link>
            ))}
          </>
        )}
        <Link
          href={routes.pressConferences() as Route}
          className="ml-auto text-sm font-medium text-archive-accent hover:text-archive-accent-hover"
        >
          ぜんぶ見る
        </Link>
      </div>
    </div>
  );
}
