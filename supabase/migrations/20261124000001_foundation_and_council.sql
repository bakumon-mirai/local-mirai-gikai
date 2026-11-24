-- ============================================================
-- 01. 共通土台・議会マスター（全自治体で必須）
-- ============================================================
-- 含まれる構成:
--   - 拡張機能 (uuid-ossp)
--   - 共通ユーティリティ / 認証ヘルパー関数 (update_updated_at_column, is_admin, get_admin_users)
--   - council_sessions（会期マスター）+ set_active_council_session()
--   - committees（委員会マスター）
--   - factions（会派マスター）
--   - ai_settings（AI機能ごとのモデル設定 + 初期値）
--
-- セキュリティ方針:
--   - 全 public テーブルは RLS 有効 + ポリシーなし（デフォルト全拒否）。
--     アクセスはサーバー側 createAdminClient() (service_role) 経由のみ。
--   - 管理系 RPC 関数は PUBLIC / anon / authenticated から EXECUTE を剥奪し、
--     service_role のみに付与する（is_admin は storage.objects RLS ポリシーで利用するため例外）。

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ------------------------------------------------------------
-- 共通トリガー関数: updated_at 自動更新
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 管理者判定関数（storage.objects RLS ポリシーおよびテストから利用）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
        AND raw_app_meta_data->>'roles' LIKE '%admin%'
    )
  );
END;
$$;

-- ------------------------------------------------------------
-- 管理者一覧取得（service_role 専用）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id, u.email, u.created_at, u.last_sign_in_at
  FROM auth.users u
  WHERE u.raw_app_meta_data->'roles' ? 'admin'
  ORDER BY u.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO service_role;

-- ------------------------------------------------------------
-- council_sessions（定例会・臨時会マスター）
-- ------------------------------------------------------------
CREATE TABLE public.council_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  slug text UNIQUE,
  council_url text,
  is_active boolean NOT NULL DEFAULT false,
  -- 会期の節目（トップの「会期の流れ」用。未取得は null）
  -- { representativeQuestions?, generalQuestions?, standingCommittees?, billVote? }
  schedule_milestones jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT end_date_after_start_date CHECK (end_date >= start_date)
);

COMMENT ON COLUMN public.council_sessions.slug IS 'URL用のスラッグ（例: r8-03, 2026-06）';
COMMENT ON COLUMN public.council_sessions.council_url IS '議会公式サイトの会期・議案情報ページURL';
COMMENT ON COLUMN public.council_sessions.is_active IS 'Whether this session is the active one displayed on the top page. Only one session can be active at a time.';
COMMENT ON COLUMN public.council_sessions.schedule_milestones IS '会期の節目（代表質問・一般質問・常任委員会の期間と議案採決日）。未取得は null';

CREATE INDEX idx_council_sessions_date_range
  ON public.council_sessions USING btree (start_date, end_date);
CREATE INDEX idx_council_sessions_slug
  ON public.council_sessions USING btree (slug);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.council_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.council_sessions ENABLE ROW LEVEL SECURITY;

-- アクティブ会期を1件だけ切り替える RPC（service_role 専用）
CREATE OR REPLACE FUNCTION public.set_active_council_session(target_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE council_sessions
  SET is_active = (id = target_session_id)
  WHERE id IS NOT NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_active_council_session(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_council_session(uuid) TO service_role;

-- ------------------------------------------------------------
-- committees（委員会マスター）
-- ------------------------------------------------------------
CREATE TABLE public.committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  committee_type text NOT NULL DEFAULT 'standing'
    CHECK (committee_type IN ('standing', 'special', 'budget', 'audit', 'management')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.committees.committee_type IS '委員会の区分（常任・特別・予算・決算・議会運営）';

CREATE TRIGGER set_committees_updated_at
  BEFORE UPDATE ON public.committees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- factions（会派マスター）
-- ------------------------------------------------------------
CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  logo_url text,
  alternative_names text[] NOT NULL DEFAULT '{}'::text[],
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_factions_updated_at
  BEFORE UPDATE ON public.factions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- ai_settings（AI機能ごとのモデル設定）
-- ------------------------------------------------------------
CREATE TABLE public.ai_settings (
  feature_id text PRIMARY KEY,
  model text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.ai_settings (feature_id, model) VALUES
  ('interview-chat', 'openai/gpt-5.2'),
  ('config-generation', 'openai/gpt-5.2'),
  ('topic-analysis', 'google/gemini-3-flash-preview'),
  ('bill-enrichment', 'anthropic/claude-cli'),
  ('ai-collection', 'anthropic/claude-cli'),
  ('thumbnail-generation', 'openai/dall-e-3')
ON CONFLICT (feature_id) DO NOTHING;
