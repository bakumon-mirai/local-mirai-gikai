import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestUser,
  createTestUser,
  getAnonClient,
  getAuthenticatedClient,
} from "../utils";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * サーバー専用（service_role 限定）の全 15 RPC 関数。
 * anon / authenticated どちらからも EXECUTE 権限エラー (42501) で拒否されることを検証する。
 */
const SERVICE_ROLE_ONLY_RPCS = [
  { name: "get_admin_users", args: {} },
  {
    name: "set_active_council_session",
    args: { target_session_id: ZERO_UUID },
  },
  {
    name: "sum_chat_usage_cost",
    args: {
      from_iso: "2026-01-01T00:00:00Z",
      to_iso: "2026-01-02T00:00:00Z",
    },
  },
  {
    name: "bulk_publish_reports",
    args: {
      p_config_id: ZERO_UUID,
      p_max_moderation_score: 50,
      p_min_content_richness: 50,
    },
  },
  {
    name: "count_bulk_publish_targets",
    args: {
      p_config_id: ZERO_UUID,
      p_max_moderation_score: 50,
      p_min_content_richness: 50,
    },
  },
  {
    name: "count_public_reports_by_stance",
    args: { p_bill_id: ZERO_UUID },
  },
  {
    name: "count_reactions_by_report_ids",
    args: { report_ids: [ZERO_UUID] },
  },
  {
    name: "count_sessions_by_config_ids",
    args: { p_config_ids: [ZERO_UUID] },
  },
  {
    name: "find_public_reports_by_bill_id_ordered_by_reactions",
    args: { p_bill_id: ZERO_UUID },
  },
  {
    name: "find_sessions_ordered_by_helpful_count",
    args: { p_config_id: ZERO_UUID },
  },
  {
    name: "find_sessions_ordered_by_message_count",
    args: { p_config_id: ZERO_UUID },
  },
  {
    name: "find_sessions_ordered_by_moderation_score",
    args: { p_config_id: ZERO_UUID },
  },
  {
    name: "find_sessions_ordered_by_total_content_richness",
    args: { p_config_id: ZERO_UUID },
  },
  {
    name: "get_interview_message_counts",
    args: { session_ids: [ZERO_UUID] },
  },
  {
    name: "get_interview_statistics",
    args: { p_config_id: ZERO_UUID },
  },
] as const;

describe("RPC 実行権限（全15サーバー専用関数は service_role 限定）", () => {
  describe("anon クライアント", () => {
    const anon = getAnonClient();

    for (const rpc of SERVICE_ROLE_ONLY_RPCS) {
      it(`${rpc.name}: 実行が 42501 で拒否される`, async () => {
        const { error } = await anon.rpc(rpc.name, rpc.args as never);
        expect(error).not.toBeNull();
        expect(error?.code).toBe("42501");
      });
    }
  });

  describe("authenticated クライアント", () => {
    let userId: string;
    let email: string;
    const password = "test-password-123";

    beforeAll(async () => {
      email = `rpc-perm-test-${randomUUID()}@example.com`;
      const user = await createTestUser(email, password);
      userId = user.id;
    });

    afterAll(async () => {
      await cleanupTestUser(userId);
    });

    for (const rpc of SERVICE_ROLE_ONLY_RPCS) {
      it(`${rpc.name}: 実行が 42501 で拒否される`, async () => {
        const client = await getAuthenticatedClient(email, password);
        const { error } = await client.rpc(rpc.name, rpc.args as never);
        expect(error).not.toBeNull();
        expect(error?.code).toBe("42501");
      });
    }
  });
});
