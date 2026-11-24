import { siteConfig } from "@/config/site.config";
import type { CommitteeMeetingSummary } from "@/features/committee-minutes/shared/types";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { isRegularSession } from "@/features/council-sessions/shared/utils/resolve-session-slot-status";
import type { GeneralQuestion } from "@/features/general-questions/shared/types";
import type {
  PressConferenceRef,
  PressConferenceSummary,
} from "@/features/press-conferences/shared/types";
import { formatNextSessionPill } from "../../shared/utils/format-hero-date";
import {
  type HeroFeatureFlags,
  buildClosedHeroCopy,
  resolveClosedHeroFeature,
} from "../../shared/utils/resolve-hero-feature";
import type { InSessionCounts } from "../loaders/load-top-hero-data";
import { CommitteeHeroCard } from "./committee-hero-card";
import { InSessionHero } from "./in-session-hero";
import { PressConferenceCard } from "./press-conference-card";
import { PressConferenceStrip } from "./press-conference-strip";
import { QuestionsHeroCard } from "./questions-hero-card";

type Props = {
  currentSession: CouncilSession | null;
  nextSession: CouncilSession | null;
  latestConference: PressConferenceSummary | null;
  recentConferences: PressConferenceRef[];
  fallbackCommittees?: CommitteeMeetingSummary[];
  fallbackQuestions?: GeneralQuestion[];
  fallbackQuestionSessionName?: string | null;
  inSessionCounts: InSessionCounts | null;
  today: string;
  cityName?: string;
  councilName?: string;
  executiveTitle?: string;
  features?: HeroFeatureFlags & { bills: boolean };
};

export function TopHero({
  currentSession,
  nextSession,
  latestConference,
  recentConferences,
  fallbackCommittees = [],
  fallbackQuestions = [],
  fallbackQuestionSessionName = null,
  inSessionCounts,
  today,
  cityName = siteConfig.cityName,
  councilName = siteConfig.councilName,
  executiveTitle = siteConfig.executiveTitle,
  features = siteConfig.features,
}: Props) {
  const statusLabel = !currentSession
    ? "いまは閉会中"
    : isRegularSession(currentSession)
      ? "いま定例会中"
      : "いま臨時会中";

  if (currentSession) {
    return (
      <>
        <InSessionHero
          session={currentSession}
          today={today}
          counts={inSessionCounts}
          statusLabel={statusLabel}
          councilName={councilName}
          showBills={features.bills}
          showGeneralQuestions={features.generalQuestions}
        />
        {features.pressConferences && latestConference && (
          <PressConferenceStrip
            conference={latestConference}
            executiveTitle={executiveTitle}
          />
        )}
      </>
    );
  }

  const nextSessionLabel = formatNextSessionPill(
    nextSession?.start_date ?? null
  );

  const heroFeatureKind = resolveClosedHeroFeature(features, {
    hasPressConference: latestConference !== null,
    hasCommitteeMeetings: fallbackCommittees.length > 0,
    hasGeneralQuestions: fallbackQuestions.length > 0,
  });

  const copy = buildClosedHeroCopy(heroFeatureKind, {
    cityName,
    councilName,
    executiveTitle,
  });

  const hasRightCard = heroFeatureKind !== "none";

  return (
    <section className="mx-4 mt-2 rounded-[28px] bg-archive-hero p-6 pc:mx-16 pc:rounded-[36px] pc:p-11">
      <div
        className={
          hasRightCard
            ? "grid gap-8 pc:grid-cols-2 pc:items-center pc:gap-10"
            : "flex flex-col gap-4 max-w-2xl"
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-archive-accent-hover">
              {statusLabel}
            </span>

            {nextSessionLabel && (
              <span className="rounded-full bg-mirai-surface-warm px-3.5 py-1.5 text-xs font-medium text-archive-beige-text">
                {nextSessionLabel}
              </span>
            )}
          </div>

          <h1 className="font-rounded text-[26px] font-bold leading-[1.45] text-mirai-text pc:text-[42px] pc:leading-[1.4]">
            {cityName}、
            <br />
            いま何が話されてる？
          </h1>

          <p className="text-sm leading-relaxed text-mirai-text-secondary pc:text-base">
            {copy.line1}
            <br className="hidden pc:inline" />
            {copy.line2}
          </p>
        </div>

        {heroFeatureKind === "press-conference" && latestConference && (
          <PressConferenceCard
            conference={latestConference}
            recent={recentConferences}
            executiveTitle={executiveTitle}
          />
        )}

        {heroFeatureKind === "committee" && (
          <CommitteeHeroCard meetings={fallbackCommittees} />
        )}

        {heroFeatureKind === "general-questions" && (
          <QuestionsHeroCard
            questions={fallbackQuestions}
            sessionName={fallbackQuestionSessionName}
          />
        )}
      </div>
    </section>
  );
}
