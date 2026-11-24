import { siteConfig } from "@/config/site.config";
import type { CouncilSession } from "../types";

/**
 * 定例会の帯（トップページ）の状態。
 *
 * 強調枠は常に1つだけになるよう、会期中は `in_session` のみを強調し `next` は出さない。
 */
export type SessionSlotStatus = "finished" | "in_session" | "next" | "upcoming";

/** 開催月ごとの既定の一行説明 */
const DEFAULT_MONTH_DESCRIPTIONS: Record<number, string> = {
  2: "新しい年度の予算を決める",
  3: "新しい年度の予算を決める",
  6: "条例や工事契約などを審議",
  9: "補正予算や決算を審議",
  12: "年内最後の議案を審議",
};

const FALLBACK_DESCRIPTION = "定例会の議案・質問を審議";

export type SessionSlot = {
  month: number;
  description: string;
  status: SessionSlotStatus;
  /** 該当する会期。DBに無い回（日程未掲載など）は null */
  session: CouncilSession | null;
};

/**
 * 臨時会を除き、定例会だけを残す。
 *
 * `council_sessions` には臨時会も入るため、帯に流し込む前に必ず通す。
 */
export function isRegularSession(session: CouncilSession): boolean {
  return session.name.includes("定例会");
}

/** "YYYY-MM-DD" を数値比較できる形に落とす。タイムゾーンの影響を受けない */
function toComparable(date: string): number {
  return Number(date.slice(0, 10).replaceAll("-", ""));
}

function monthOf(session: CouncilSession): number {
  return Number(session.start_date.slice(5, 7));
}

function resolveSlotMonth(
  session: CouncilSession,
  configuredMonths: readonly number[]
): number {
  const startMonth = monthOf(session);
  if (configuredMonths.includes(startMonth)) return startMonth;

  // 例: 6月定例会が5月末に開会する場合など、名称内の月が通常開催月に含まれればその枠へ寄せる
  const nameMatch = session.name.match(/(\d{1,2})月/);
  if (nameMatch) {
    const namedMonth = Number(nameMatch[1]);
    if (configuredMonths.includes(namedMonth)) return namedMonth;
  }

  return startMonth;
}

/**
 * 当年の定例会スロットを組み立てる。
 *
 * @param sessions 当年の `council_sessions`（臨時会が混ざっていてよい）
 * @param today 基準日（"YYYY-MM-DD"）
 * @param months 定例会の通常開催月（既定は `siteConfig.regularSessionMonths`）
 */
export function resolveSessionSlots(
  sessions: CouncilSession[],
  today: string,
  months: readonly number[] = siteConfig.regularSessionMonths
): SessionSlot[] {
  const now = toComparable(today);

  const byMonth = new Map<number, CouncilSession>();
  for (const session of sessions.filter(isRegularSession)) {
    const month = resolveSlotMonth(session, months);
    const existing = byMonth.get(month);
    if (!existing || session.start_date < existing.start_date) {
      byMonth.set(month, session);
    }
  }

  // 通常開催月以外の定例会が登録されていても帯から黙って消えないようマージして昇順化する
  const slotMonths = [...new Set([...months, ...byMonth.keys()])].sort(
    (a, b) => a - b
  );

  // 各会期について「次に開会する会期の開会日」を求めておく。
  // end_date が無い会期の打ち切り判定に使う
  const ordered = [...byMonth.values()].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );
  const nextStartById = new Map<string, number | null>();
  for (let i = 0; i < ordered.length; i++) {
    const next = ordered[i + 1];
    nextStartById.set(
      ordered[i].id,
      next ? toComparable(next.start_date) : null
    );
  }

  // 期間が重なる会期があっても強調枠が常に1つになるよう、開催中のうち開始日が最も新しい1件だけを選ぶ
  const activeCandidates = ordered.filter((session) =>
    isInSession(session, now, nextStartById.get(session.id) ?? null)
  );
  const activeSessionId = activeCandidates.at(-1)?.id ?? null;

  const inSessionOf = (session: CouncilSession) =>
    activeSessionId !== null && session.id === activeSessionId;

  // 会期中の回があるか。あるなら「つぎはここ」は出さない（強調は常に1つ）
  const hasInSession = activeSessionId !== null;

  // 「つぎはここ」に当たる回（まだ開会していない回のうち最も早いもの）
  let nextMonth: number | null = null;
  if (!hasInSession) {
    let earliest = Number.POSITIVE_INFINITY;
    for (const [month, session] of byMonth) {
      const start = toComparable(session.start_date);
      if (start > now && start < earliest) {
        earliest = start;
        nextMonth = month;
      }
    }
  }

  return slotMonths.map((month) => {
    const session = byMonth.get(month) ?? null;
    return {
      month,
      description: DEFAULT_MONTH_DESCRIPTIONS[month] ?? FALLBACK_DESCRIPTION,
      status: resolveStatus(session, now, month === nextMonth, inSessionOf),
      session,
    };
  });
}

function isInSession(
  session: CouncilSession,
  now: number,
  nextStart: number | null
): boolean {
  const start = toComparable(session.start_date);
  if (start > now) return false;

  if (!session.end_date) {
    if (nextStart !== null && nextStart <= now) return false;
    return true;
  }

  return now <= toComparable(session.end_date);
}

function resolveStatus(
  session: CouncilSession | null,
  now: number,
  isNext: boolean,
  inSessionOf: (session: CouncilSession) => boolean
): SessionSlotStatus {
  if (!session) return isNext ? "next" : "upcoming";

  if (inSessionOf(session)) return "in_session";

  if (session.end_date && toComparable(session.end_date) < now) {
    return "finished";
  }

  if (toComparable(session.start_date) > now) {
    return isNext ? "next" : "upcoming";
  }

  return "finished";
}
