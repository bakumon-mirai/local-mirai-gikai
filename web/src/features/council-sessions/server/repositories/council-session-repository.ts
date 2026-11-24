import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { siteConfig } from "@/config/site.config";
import type { CouncilSession } from "../../shared/types";
import { parseSessionMilestones } from "../../shared/utils/parse-session-milestones";

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

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .lte("start_date", targetDate)
    .or(`end_date.gte.${targetDate},end_date.is.null`)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch current council session:", error);
    return null;
  }

  return toCouncilSession(data);
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
 * is_active では絞らない（手動更新のフラグと実際の会期がずれうるため）。
 */
export async function findAllPastCouncilSessions(): Promise<CouncilSession[]> {
  const supabase = createAdminClient();
  const sessionIds = new Set<string>();

  const queries: Promise<void>[] = [];

  if (siteConfig.features.bills) {
    queries.push(
      (async () => {
        const { data, error } = await supabase
          .from("bills")
          .select("council_session_id")
          .eq("publish_status", "published");
        if (error) {
          console.error("Failed to fetch published bills:", error);
          return;
        }
        for (const row of data ?? []) {
          if (row.council_session_id) sessionIds.add(row.council_session_id);
        }
      })()
    );
  }

  if (siteConfig.features.generalQuestions) {
    queries.push(
      (async () => {
        const { data, error } = await supabase
          .from("general_questions")
          .select("council_session_id")
          .eq("publish_status", "published");
        if (error) {
          console.error("Failed to fetch published general questions:", error);
          return;
        }
        for (const row of data ?? []) {
          if (row.council_session_id) sessionIds.add(row.council_session_id);
        }
      })()
    );
  }

  await Promise.all(queries);

  if (sessionIds.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .in("id", [...sessionIds])
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch past council sessions:", error);
    return [];
  }

  return toCouncilSessions(data ?? []);
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
