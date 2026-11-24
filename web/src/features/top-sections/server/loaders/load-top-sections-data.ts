import "server-only";
import { siteConfig } from "@/config/site.config";
import {
  findBillStatusesBySession,
  findLatestSessionWithBills,
} from "@/features/bills/server/repositories/bill-repository";
import type { BillStatusSummary } from "@/features/bills/shared/utils/summarize-bill-statuses";
import { summarizeBillStatuses } from "@/features/bills/shared/utils/summarize-bill-statuses";
import { findAllMeetings } from "@/features/committee-minutes/server/repositories/committee-meeting-repository";
import type { CommitteeMeetingSummary } from "@/features/committee-minutes/shared/types";
import { selectFeaturedMeetings } from "@/features/committee-minutes/shared/utils/select-featured-meetings";
import {
  findCouncilSessionsByYear,
  findCurrentCouncilSession,
} from "@/features/council-sessions/server/repositories/council-session-repository";
import {
  type SessionSlot,
  resolveSessionSlots,
} from "@/features/council-sessions/shared/utils/resolve-session-slot-status";
import { getGeneralQuestionsBySession } from "@/features/general-questions/server/loaders/get-general-questions-by-session";
import { findLatestSessionWithPublishedQuestions } from "@/features/general-questions/server/repositories/general-questions-repository";
import type { GeneralQuestion } from "@/features/general-questions/shared/types";
import { getJapanTime } from "@/lib/utils/date";

const COMMITTEE_COUNT = 4;
const QUESTION_COUNT = 3;

export type TopSectionsData = {
  sessionSlots: SessionSlot[];
  committeeMeetings: CommitteeMeetingSummary[];
  questions: GeneralQuestion[];
  questionSessionName: string | null;
  billSummary: BillStatusSummary;
  billsSessionSlug: string | null;
  isBillSessionInSession: boolean;
};

function todayInJst(): string {
  const now = getJapanTime();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export async function loadTopSectionsData(): Promise<TopSectionsData> {
  const today = todayInJst();
  const year = Number(today.slice(0, 4));

  const [sessionsThisYear, meetings, questionSession, bills] =
    await Promise.all([
      findCouncilSessionsByYear(year),
      siteConfig.features.committeeMinutes
        ? findAllMeetings()
        : Promise.resolve([]),
      siteConfig.features.generalQuestions
        ? findLatestSessionWithPublishedQuestions()
        : Promise.resolve(null),
      siteConfig.features.bills
        ? resolveBillSummary(today)
        : Promise.resolve({
            summary: summarizeBillStatuses([]),
            sessionSlug: null,
            isInSession: false,
          }),
    ]);

  const questions = questionSession
    ? (await getGeneralQuestionsBySession(questionSession.id)).slice(
        0,
        QUESTION_COUNT
      )
    : [];

  return {
    sessionSlots: resolveSessionSlots(
      sessionsThisYear,
      today,
      siteConfig.regularSessionMonths
    ),
    committeeMeetings: selectFeaturedMeetings(meetings, COMMITTEE_COUNT),
    questions,
    questionSessionName: questionSession?.name ?? null,
    billSummary: bills.summary,
    billsSessionSlug: bills.sessionSlug,
    isBillSessionInSession: bills.isInSession,
  };
}

async function resolveBillSummary(today: string): Promise<{
  summary: BillStatusSummary;
  sessionSlug: string | null;
  isInSession: boolean;
}> {
  const current = await findCurrentCouncilSession(today);

  if (current) {
    const statuses = await findBillStatusesBySession(current.id);
    if (statuses.length > 0) {
      return {
        summary: summarizeBillStatuses(statuses),
        sessionSlug: current.slug,
        isInSession: true,
      };
    }
  }

  const latestWithBills = await findLatestSessionWithBills(today);
  if (!latestWithBills) {
    return {
      summary: summarizeBillStatuses([]),
      sessionSlug: null,
      isInSession: false,
    };
  }

  return {
    summary: summarizeBillStatuses(
      await findBillStatusesBySession(latestWithBills.id)
    ),
    sessionSlug: latestWithBills.slug,
    isInSession: current !== null && latestWithBills.id === current.id,
  };
}
