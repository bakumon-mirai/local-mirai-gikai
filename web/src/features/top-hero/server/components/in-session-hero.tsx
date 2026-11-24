import type { Route } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { routes } from "@/lib/routes";
import {
  buildInSessionLead,
  buildSessionSteps,
  calcSessionProgress,
  formatSessionRange,
} from "../../shared/utils/session-progress";
import type { InSessionCounts } from "../loaders/load-top-hero-data";

type Props = {
  session: CouncilSession;
  today: string;
  counts: InSessionCounts | null;
  statusLabel: string;
  councilName?: string;
  showBills?: boolean;
  showGeneralQuestions?: boolean;
};

const STEP_TAGS = {
  done: "おわった",
  current: "いまここ",
  upcoming: null,
} as const;

export function InSessionHero({
  session,
  today,
  counts,
  statusLabel,
  councilName = siteConfig.councilName,
  showBills = siteConfig.features.bills,
  showGeneralQuestions = siteConfig.features.generalQuestions,
}: Props) {
  const progress = calcSessionProgress(
    session.start_date,
    session.end_date,
    today
  );
  const steps = buildSessionSteps(
    session.start_date,
    session.end_date,
    today,
    session.schedule_milestones
  );
  const lead = buildInSessionLead(session.name) ?? "";
  const billsHref =
    showBills && session.slug ? routes.sessionBills(session.slug) : null;
  const questionsHref =
    showGeneralQuestions && session.slug
      ? routes.sessionQuestions(session.slug)
      : null;

  return (
    <section className="mx-4 mt-2 rounded-[28px] bg-archive-hero p-6 pc:mx-16 pc:rounded-[36px] pc:p-11">
      <div className="grid gap-8 pc:grid-cols-2 pc:gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-archive-pill-bg px-3.5 py-1.5 text-xs font-bold text-archive-pill-text">
              {statusLabel}
            </span>
            <span className="rounded-full bg-mirai-surface-warm px-3.5 py-1.5 text-xs font-medium text-archive-beige-text">
              {formatSessionRange(session.start_date, session.end_date)}
            </span>
          </div>

          <h1 className="font-rounded text-[26px] font-bold leading-[1.45] text-mirai-text pc:text-[42px] pc:leading-[1.4]">
            {councilName}、
            <br />
            いま何を決めてる？
          </h1>

          <p className="text-sm leading-relaxed text-mirai-text-secondary pc:text-base">
            {councilName}で話されていることを、
            <br className="hidden pc:inline" />
            やさしく読めるサイトです。{lead}
            <br className="hidden pc:inline" />
            予算や条例は、この期間に採決されます。
          </p>

          {progress && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="font-rounded text-lg font-bold text-archive-accent-deep">
                  {progress.dayNumber}日目
                </span>
                <span className="text-xs text-mirai-text-secondary">
                  全{progress.totalDays}日
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-white"
                role="progressbar"
                aria-valuenow={progress.dayNumber}
                aria-valuemin={1}
                aria-valuemax={progress.totalDays}
                aria-label={`会期の進み具合 全${progress.totalDays}日中${progress.dayNumber}日目`}
              >
                <div
                  className="h-full rounded-full bg-archive-accent"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3.5">
          {steps.length > 0 && (
            <div className="rounded-[22px] bg-white p-5">
              <h2 className="font-rounded text-base font-bold text-mirai-text">
                会期の流れ
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {steps.map((step) => (
                  <li
                    key={step.label}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                      step.status === "current" ? "bg-archive-surface-tint" : ""
                    }`}
                  >
                    <span className="min-w-[4.5rem] shrink-0 text-xs font-medium whitespace-nowrap text-mirai-text-secondary">
                      {step.date}
                    </span>
                    <span className="flex-1 text-sm text-mirai-text">
                      {step.label}
                    </span>
                    {STEP_TAGS[step.status] && (
                      <span className="shrink-0 rounded-full bg-mirai-surface-warm px-2.5 py-0.5 text-[11px] whitespace-nowrap text-archive-beige-text">
                        {STEP_TAGS[step.status]}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {billsHref && counts && counts.deliberatingBills > 0 && (
              <Link
                href={billsHref as Route}
                className="flex flex-col gap-1 rounded-[22px] bg-white p-4 hover:bg-archive-surface-tint"
              >
                <span className="text-xs font-medium text-archive-accent">
                  今回の議案
                </span>
                <span className="font-rounded text-base font-bold text-mirai-text">
                  {counts.deliberatingBills}件を審議中
                </span>
              </Link>
            )}

            {questionsHref && counts && counts.questioners > 0 && (
              <Link
                href={questionsHref as Route}
                className="flex flex-col gap-1 rounded-[22px] bg-white p-4 hover:bg-archive-surface-tint"
              >
                <span className="text-xs font-medium text-archive-accent">
                  一般質問
                </span>
                <span className="font-rounded text-base font-bold text-mirai-text">
                  {counts.questioners}人が質問
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
