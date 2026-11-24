import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { siteConfig } from "@/config/site.config";
import type { CouncilSession, PastCouncilSession } from "../../shared/types";
import { mergePastCouncilSessions } from "../../shared/utils/merge-past-sessions";
import { parseSessionMilestones } from "../../shared/utils/parse-session-milestones";
import { selectCurrentCouncilSession } from "../../shared/utils/select-current-session";

type CouncilSessionRow = Omit<CouncilSession, "schedule_milestones"> & {
  schedule_milestones: unknown;
};

function toCouncilSession(
  row: CouncilSessionRow | null
): CouncilSession | null {
  if (!row) return null;

  return {
    ...row,
    schedule_milestones: parseSessionMilestones(row.schedule_milestones),
  };
}

function toCouncilSessions(rows: CouncilSessionRow[]): CouncilSession[] {
  return rows.map((row) => ({
    ...row,
    schedule_milestones: parseSessionMilestones(row.schedule_milestones),
  }));
}

/**
 * アクティブな定例会を取得
 */
export async function findActiveCouncilSession(): Promise<CouncilSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch active council session:", error);
    return null;
  }

  return toCouncilSession(data);
}

/**
 * 指定日時点で開催中の定例会を取得
 */
export async function findCurrentCouncilSession(
  targetDate: string
): Promise<CouncilSession | null> {
  const supabase = createAdminClient();

  // 最新の開始済み会期（end_date=null が後続会期で打ち切られたかを判定するため）と、
  // end_date >= targetDate を満たす開催中候補を別クエリで取得し、途中に多数の終了済み臨時会があっても取りこぼさない。
  const [latestStartedRes, activeWithEndDateRes] = await Promise.all([
    supabase
      .from("council_sessions")
      .select("*")
      .lte("start_date", targetDate)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("council_sessions")
      .select("*")
      .lte("start_date", targetDate)
      .gte("end_date", targetDate)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (latestStartedRes.error) {
    console.error(
      "Failed to fetch latest started council session:",
      latestStartedRes.error
    );
    return null;
  }
  if (activeWithEndDateRes.error) {
    console.error(
      "Failed to fetch active council session with end_date:",
      activeWithEndDateRes.error
    );
    return null;
  }

  const candidates: CouncilSession[] = [];
  const latestStarted = toCouncilSession(latestStartedRes.data);
  if (latestStarted) candidates.push(latestStarted);

  const activeWithEndDate = toCouncilSession(activeWithEndDateRes.data);
  if (activeWithEndDate && activeWithEndDate.id !== latestStarted?.id) {
    candidates.push(activeWithEndDate);
  }

  candidates.sort((a, b) => b.start_date.localeCompare(a.start_date));

  return selectCurrentCouncilSession(candidates, targetDate);
}

/**
 * 全定例会を開始日の降順で取得
 */
export async function findAllCouncilSessions(): Promise<CouncilSession[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch all council sessions:", error);
    return [];
  }

  return toCouncilSessions(data ?? []);
}

/**
 * 公開済みの議案または一般質問が存在する定例会を新しい順に取得。
 *
 * PostgREST の max_rows=1000 で議案・質問テーブル側が打ち切られるのを防ぐため、
 * council_sessions 起点で `!inner` 結合して存在確認のみ行う。
 */
export async function findAllPastCouncilSessions(): Promise<
  PastCouncilSession[]
> {
  const supabase = createAdminClient();

  const fetchBillSessions = async (): Promise<CouncilSession[]> => {
    if (!siteConfig.features.bills) return [];
    const { data, error } = await supabase
      .from("council_sessions")
      .select("*, bills!inner(id)")
      .eq("bills.publish_status", "published")
      .limit(1, { referencedTable: "bills" })
      .order("start_date", { ascending: false });
    if (error) {
      throw new Error(
        `Failed to fetch sessions with published bills: ${error.message}`
      );
    }
    const sessions: CouncilSession[] = [];
    for (const row of data ?? []) {
      const { bills: _bills, ...sessionRow } =
        row as unknown as CouncilSessionRow & {
          bills: unknown;
        };
      const parsed = toCouncilSession(sessionRow);
      if (parsed) sessions.push(parsed);
    }
    return sessions;
  };

  const fetchQuestionSessions = async (): Promise<CouncilSession[]> => {
    if (!siteConfig.features.generalQuestions) return [];
    const { data, error } = await supabase
      .from("council_sessions")
      .select("*, general_questions!inner(id)")
      .eq("general_questions.publish_status", "published")
      .limit(1, { referencedTable: "general_questions" })
      .order("start_date", { ascending: false });
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        return [];
      }
      throw new Error(
        `Failed to fetch sessions with published general questions: ${error.message}`
      );
    }
    const sessions: CouncilSession[] = [];
    for (const row of data ?? []) {
      const { general_questions: _questions, ...sessionRow } =
        row as unknown as CouncilSessionRow & {
          general_questions: unknown;
        };
      const parsed = toCouncilSession(sessionRow);
      if (parsed) sessions.push(parsed);
    }
    return sessions;
  };

  const [billSessions, questionSessions] = await Promise.all([
    fetchBillSessions(),
    fetchQuestionSessions(),
  ]);

  return mergePastCouncilSessions(billSessions, questionSessions);
}

/**
 * 指定日より前の直近の定例会を取得
 */
export async function findPreviousCouncilSession(
  beforeStartDate: string
): Promise<CouncilSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .lt("start_date", beforeStartDate)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch previous council session:", error);
    return null;
  }

  return toCouncilSession(data);
}

/**
 * 指定年に開会した会期をすべて取得（臨時会を含む）
 */
export async function findCouncilSessionsByYear(
  year: number
): Promise<CouncilSession[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Failed to fetch council sessions by year:", error);
    return [];
  }

  return toCouncilSessions(data ?? []);
}

/**
 * IDで定例会を取得
 */
export async function findCouncilSessionById(
  id: string
): Promise<CouncilSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch council session by id:", error);
    return null;
  }

  return toCouncilSession(data);
}
