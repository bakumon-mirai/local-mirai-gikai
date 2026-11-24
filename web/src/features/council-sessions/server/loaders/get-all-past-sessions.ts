import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { PastCouncilSession } from "../../shared/types";
import { findAllPastCouncilSessions } from "../repositories/council-session-repository";

/**
 * 議案または一般質問が公開済みの会期を全件取得（新しい順）。
 */
export async function getAllPastSessions(): Promise<PastCouncilSession[]> {
  return _getCachedAllPastSessions();
}

const _getCachedAllPastSessions = unstable_cache(
  async (): Promise<PastCouncilSession[]> => {
    return findAllPastCouncilSessions();
  },
  // hasBills / hasQuestions を追加したため -v3
  ["all-past-sessions-v3"],
  {
    revalidate: 3600,
    tags: [
      CACHE_TAGS.COUNCIL_SESSIONS,
      CACHE_TAGS.BILLS,
      CACHE_TAGS.GENERAL_QUESTIONS,
    ],
  }
);
