import type {
  DateRange,
  SessionMilestones,
} from "@/features/council-sessions/shared/types";
import { extractSessionLabel } from "./format-hero-date";

function mergeRanges(
  a: DateRange | null,
  b: DateRange | null
): DateRange | null {
  if (!a) return b;
  if (!b) return a;

  return {
    from: a.from <= b.from ? a.from : b.from,
    to: a.to >= b.to ? a.to : b.to,
  };
}

export type SessionProgress = {
  dayNumber: number;
  totalDays: number;
  percent: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMs(isoDate: string): number | null {
  const match = isoDate.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, y, m, d] = match;
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
}

function inclusiveDays(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / MS_PER_DAY) + 1;
}

export function calcSessionProgress(
  startDate: string,
  endDate: string | null,
  today: string
): SessionProgress | null {
  if (!endDate) return null;

  const start = toUtcMs(startDate);
  const end = toUtcMs(endDate);
  const now = toUtcMs(today);
  if (start === null || end === null || now === null) return null;
  if (end < start) return null;

  const totalDays = inclusiveDays(start, end);
  const rawDay = inclusiveDays(start, now);
  const dayNumber = Math.min(Math.max(rawDay, 1), totalDays);

  return {
    dayNumber,
    totalDays,
    percent: Math.round((dayNumber / totalDays) * 100),
  };
}

export type SessionStep = {
  date: string;
  label: string;
  status: "done" | "current" | "upcoming";
};

export function formatStepDate(isoDate: string): string {
  const match = isoDate.slice(0, 10).match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;

  return `${Number(match[1])}月${Number(match[2])}日`;
}

function formatStepRange(range: DateRange): string {
  const from = formatStepDate(range.from);
  if (range.from === range.to) return from;

  const sameMonth = range.from.slice(0, 7) === range.to.slice(0, 7);
  const to = sameMonth
    ? `${Number(range.to.slice(8, 10))}日`
    : formatStepDate(range.to);
  return `${from}〜${to}`;
}

function rangeStatus(range: DateRange, now: number): SessionStep["status"] {
  const from = toUtcMs(range.from);
  const to = toUtcMs(range.to);
  if (from === null || to === null) return "upcoming";

  if (now > to) return "done";
  if (now >= from) return "current";
  return "upcoming";
}

export function buildSessionSteps(
  startDate: string,
  endDate: string | null,
  today: string,
  milestones?: SessionMilestones | null
): SessionStep[] {
  const start = toUtcMs(startDate);
  const now = toUtcMs(today);
  if (start === null || now === null) return [];

  const steps: SessionStep[] = [
    {
      date: formatStepDate(startDate),
      label: "開会・議案の説明",
      status: now > start ? "done" : "current",
    },
  ];

  const questions = mergeRanges(
    milestones?.representativeQuestions ?? null,
    milestones?.generalQuestions ?? null
  );
  if (questions) {
    steps.push({
      date: formatStepRange(questions),
      label: "代表質問・一般質問",
      status: rangeStatus(questions, now),
    });
  }

  if (milestones?.standingCommittees) {
    steps.push({
      date: formatStepRange(milestones.standingCommittees),
      label: "委員会でくわしく審査",
      status: rangeStatus(milestones.standingCommittees, now),
    });
  }

  const voteDate = milestones?.billVote ?? null;
  const voteIsClosingDay = voteDate !== null && voteDate === endDate;

  if (voteDate && !voteIsClosingDay) {
    const vote = toUtcMs(voteDate);
    steps.push({
      date: formatStepDate(voteDate),
      label: "議案の採決",
      status: vote !== null && now >= vote ? "done" : "upcoming",
    });
  }

  if (endDate) {
    const end = toUtcMs(endDate);
    if (end !== null) {
      steps.push({
        date: formatStepDate(endDate),
        label: voteIsClosingDay ? "議案の採決・閉会" : "閉会",
        status: now >= end ? "done" : "upcoming",
      });
    }
  }

  return steps;
}

export function buildInSessionLead(sessionName: string): string | null {
  const label = extractSessionLabel(sessionName);
  return label ? `いまは${label}。` : null;
}

export function formatSessionRange(
  startDate: string,
  endDate: string | null
): string {
  const start = formatStepDate(startDate);
  return endDate ? `${start}〜${formatStepDate(endDate)}` : `${start}から`;
}
