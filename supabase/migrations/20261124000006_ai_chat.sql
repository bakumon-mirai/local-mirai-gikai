-- ============================================================
-- 06. AI チャット・利用コスト管理
-- ============================================================
-- 対応パーツ: siteConfig.features.aiChat
-- 依存先: 01_foundation_and_council.sql, 02_bills.sql (bills)
--
-- ※ chat_usage_events は 07_ai_interview.sql の統計集計 (get_interview_statistics) からも参照される。

CREATE TYPE public.chat_role_enum AS ENUM (
  'user',
  'system',
  'assistant'
);

-- ------------------------------------------------------------
-- chats（議案AIチャット対話履歴）
-- ------------------------------------------------------------
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id uuid,
  role public.chat_role_enum NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chats IS 'AIとの対話履歴を管理するテーブル';
COMMENT ON COLUMN public.chats.user_id IS 'ユーザーID（Supabase匿名認証）';
COMMENT ON COLUMN public.chats.role IS 'メッセージの送信者役割';

CREATE INDEX idx_chats_bill_id ON public.chats USING btree (bill_id);
CREATE INDEX idx_chats_bill_user ON public.chats USING btree (bill_id, user_id);
CREATE INDEX idx_chats_created_at ON public.chats USING btree (created_at DESC);
CREATE INDEX idx_chats_user_id ON public.chats USING btree (user_id);

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- chat_usage_events（LLMトークン・コスト計測ログ）
-- ------------------------------------------------------------
CREATE TABLE public.chat_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text,
  prompt_name text,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
  metadata jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_usage_events_session_id_idx
  ON public.chat_usage_events USING btree (session_id);
CREATE INDEX chat_usage_events_user_id_occurred_at_idx
  ON public.chat_usage_events USING btree (user_id, occurred_at);

ALTER TABLE public.chat_usage_events ENABLE ROW LEVEL SECURITY;

-- 期間内の合計コストを算出する RPC（service_role 専用）
CREATE OR REPLACE FUNCTION public.sum_chat_usage_cost(
  from_iso timestamptz,
  to_iso timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(sum(cost_usd), 0)
  FROM public.chat_usage_events
  WHERE occurred_at >= from_iso
    AND occurred_at < to_iso;
$$;

REVOKE EXECUTE ON FUNCTION public.sum_chat_usage_cost(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sum_chat_usage_cost(timestamptz, timestamptz) TO service_role;
