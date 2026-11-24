import "server-only";
import { siteConfig } from "@/config/site.config";
import { findBillStatusesBySession } from "@/features/bills/server/repositories/bill-repository";
import { summarizeBillStatuses } from "@/features/bills/shared/utils/summarize-bill-statuses";
import { getCurrentCouncilSession } from "@/features/council-sessions/server/loaders/get-current-council-session";
import { findCouncilSessionsByYear } from "@/features/council-sessions/server/repositories/council-session-repository";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { findNextRegularSession } from "@/features/council-sessions/shared/utils/find-next-session";
import { countQuestionersBySession } from "@/features/general-questions/server/repositories/general-questions-repository";
import {
  findLatestPressConferenceSummary,
  findRecentPressConferenceRefs,
} from "@/features/press-conferences/server/repositories/press-conference-repository";
import type {
  PressConferenceRef,
  PressConferenceSummary,
} from "@/features/press-conferences/shared/types";
import { getJapanTime } from "@/lib/utils/date";

const RECENT_FETCH_COUNT = 4;

export type InSessionCounts = {
  deliberatingBills: number;
  questioners: number;
};

export type TopHeroData = {
  currentSession: CouncilSession | null;
  nextSession: CouncilSession | null;
  latestConference: PressConferenceSummary | null;
  recentConferences: PressConferenceRef[];
  inSessionCounts: InSessionCounts | null;
  today: string;
};

function todayInJst(): string {
  const now = getJapanTime();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export async function loadTopHeroData(): Promise<TopHeroData> {
  const today = todayInJst();
  const year = Number(today.slice(0, 4));

  const [currentSession, thisYear, nextYear, latestConference, recentRefs] =
    await Promise.all([
      getCurrentCouncilSession(getJapanTime()),
      findCouncilSessionsByYear(year),
      findCouncilSessionsByYear(year + 1),
      siteConfig.features.pressConferences
        ? findLatestPressConferenceSummary()
        : Promise.resolve(null),
      siteConfig.features.pressConferences
        ? findRecentPressConferenceRefs(RECENT_FETCH_COUNT)
        : Promise.resolve([]),
    ]);

  const nextSession = findNextRegularSession([...thisYear, ...nextYear], today);

  const recentConferences = recentRefs.filter(
    (ref) => ref.id !== latestConference?.id
  );

  return {
    currentSession,
    nextSession,
    latestConference,
    recentConferences,
    inSessionCounts: await loadInSessionCounts(currentSession),
    today,
  };
}

async function loadInSessionCounts(
  currentSession: CouncilSession | null
): Promise<InSessionCounts | null> {
  if (!currentSession) return null;

  const [billStatuses, questioners] = await Promise.all([
    siteConfig.features.bills
      ? findBillStatusesBySession(currentSession.id)
      : Promise.resolve([]),
    siteConfig.features.generalQuestions
      ? countQuestionersBySession(currentSession.id)
      : Promise.resolve(0),
  ]);

  return {
    deliberatingBills: summarizeBillStatuses(billStatuses).deliberatingCount,
    questioners,
  };
}
