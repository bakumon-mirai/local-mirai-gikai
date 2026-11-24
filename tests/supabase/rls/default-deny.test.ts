import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestUser,
  createTestUser,
  getAnonClient,
  getAuthenticatedClient,
} from "../utils";

/**
 * 全29テーブルは RLS 有効 + ポリシーなし（default deny）。
 * anon / authenticated どちらからも SELECT・INSERT できないことを確認する。
 */
const tables = [
  // 01. 共通土台・議会マスター
  "council_sessions",
  "committees",
  "factions",
  "ai_settings",
  // 02. 議案
  "bills",
  "bill_contents",
  "tags",
  "bills_tags",
  "faction_stances",
  "preview_tokens",
  // 03. 一般質問・代表質問
  "general_questions",
  // 04. 委員会議事録
  "committee_meetings",
  "committee_meeting_topics",
  // 05. 首長の記者会見
  "press_conferences",
  "press_conference_items",
  "press_conference_turns",
  // 06. AIチャット
  "chats",
  "chat_usage_events",
  // 07. AIインタビュー・トピック分析
  "interview_configs",
  "interview_questions",
  "interview_sessions",
  "interview_messages",
  "interview_report",
  "interview_rating_feedbacks",
  "report_reactions",
  "expert_registrations",
  "topic_analysis_versions",
  "topic_analysis_topics",
  "topic_analysis_classifications",
] as const;

describe("RLS default deny（全29テーブル共通）", () => {
  describe("anon クライアント", () => {
    const anon = getAnonClient();

    for (const table of tables) {
      it(`${table}: SELECT が空結果になる`, async () => {
        const { data, error } = await anon.from(table).select("*").limit(1);
        expect(error).toBeNull();
        expect(data).toEqual([]);
      });
    }

    it("bills: INSERT が RLS で拒否される", async () => {
      const { error } = await anon.from("bills").insert({
        name: "不正な挿入テスト",
        status: "submitted",
        publish_status: "draft",
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
    });

    it("council_sessions: INSERT が RLS で拒否される", async () => {
      const { error } = await anon.from("council_sessions").insert({
        name: "不正な挿入テスト",
        start_date: "2025-01-01",
        end_date: "2025-06-30",
        slug: "rls-test",
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
    });
  });

  describe("authenticated クライアント", () => {
    let userId: string;
    let email: string;
    const password = "test-password-123";

    beforeAll(async () => {
      email = `rls-test-${Date.now()}@example.com`;
      const user = await createTestUser(email, password);
      userId = user.id;
    });

    afterAll(async () => {
      await cleanupTestUser(userId);
    });

    for (const table of tables) {
      it(`${table}: SELECT が空結果になる`, async () => {
        const client = await getAuthenticatedClient(email, password);
        const { data, error } = await client.from(table).select("*").limit(1);
        expect(error).toBeNull();
        expect(data).toEqual([]);
      });
    }

    it("bills: INSERT が RLS で拒否される", async () => {
      const client = await getAuthenticatedClient(email, password);
      const { error } = await client.from("bills").insert({
        name: "不正な挿入テスト",
        status: "submitted",
        publish_status: "draft",
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
    });

    it("council_sessions: INSERT が RLS で拒否される", async () => {
      const client = await getAuthenticatedClient(email, password);
      const { error } = await client.from("council_sessions").insert({
        name: "不正な挿入テスト",
        start_date: "2025-01-01",
        end_date: "2025-06-30",
        slug: "rls-test",
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
    });
  });
});
