-- ============================================================
-- 07. AI インタビュー・意見レポート・リアクション・トピック分析
-- ============================================================
-- 対応パーツ: siteConfig.features.aiInterview
-- 依存先: 01_foundation_and_council.sql, 02_bills.sql (bills, stance_type_enum), 06_ai_chat.sql (chat_usage_events)

-- ------------------------------------------------------------
-- ENUM 型
-- ------------------------------------------------------------
CREATE TYPE public.interview_config_status_enum AS ENUM (
  'public',
  'closed'
);

CREATE TYPE public.interview_feedback_tag_enum AS ENUM (
  'irrelevant_questions',
  'not_aligned',
  'misunderstood',
  'too_many_questions',
  'other'
);

CREATE TYPE public.interview_mode_enum AS ENUM (
  'loop',
  'bulk'
);

CREATE TYPE public.interview_report_role_enum AS ENUM (
  'subject_expert',
  'work_related',
  'daily_life_affected',
  'general_citizen'
);
COMMENT ON TYPE public.interview_report_role_enum IS 'インタビュー対象者の役割・属性を表すENUM型';

CREATE TYPE public.interview_role_enum AS ENUM (
  'assistant',
  'user'
);

CREATE TYPE public.moderation_status_enum AS ENUM (
  'ok',
  'warning',
  'ng'
);

-- ------------------------------------------------------------
-- interview_configs（議案ごとのインタビュー設定）
-- ------------------------------------------------------------
CREATE TABLE public.interview_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  name text NOT NULL,
  status public.interview_config_status_enum NOT NULL DEFAULT 'closed',
  mode public.interview_mode_enum NOT NULL DEFAULT 'loop',
  themes text[],
  knowledge_source text,
  chat_model text,
  estimated_duration integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interview_configs IS '議案ごとのインタビュー設定を管理するテーブル';
COMMENT ON COLUMN public.interview_configs.bill_id IS '対象議案ID（複数設定可、ただしpublicは1つのみ）';
COMMENT ON COLUMN public.interview_configs.status IS '設定ステータス（public: 公開/有効, closed: 非公開/無効）';
COMMENT ON COLUMN public.interview_configs.themes IS 'テーマの配列';
COMMENT ON COLUMN public.interview_configs.knowledge_source IS '議案のコンテキスト情報';
COMMENT ON COLUMN public.interview_configs.name IS '設定名（識別用）';
COMMENT ON COLUMN public.interview_configs.mode IS 'インタビューモード: loop（逐次深掘り）または bulk（一括深掘り）';

CREATE INDEX idx_interview_configs_bill_id ON public.interview_configs USING btree (bill_id);
CREATE UNIQUE INDEX idx_interview_configs_bill_public
  ON public.interview_configs USING btree (bill_id)
  WHERE (status = 'public'::public.interview_config_status_enum);
CREATE INDEX idx_interview_configs_status ON public.interview_configs USING btree (status);

CREATE TRIGGER update_interview_configs_updated_at
  BEFORE UPDATE ON public.interview_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.interview_configs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- interview_questions（事前定義されたインタビュー質問）
-- ------------------------------------------------------------
CREATE TABLE public.interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_config_id uuid NOT NULL REFERENCES public.interview_configs(id) ON DELETE CASCADE,
  question text NOT NULL,
  follow_up_guide text,
  quick_replies text[],
  question_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interview_questions IS '事前定義されたインタビュー質問を管理するテーブル';
COMMENT ON COLUMN public.interview_questions.interview_config_id IS 'インタビュー設定ID';
COMMENT ON COLUMN public.interview_questions.question IS '質問文';
COMMENT ON COLUMN public.interview_questions.follow_up_guide IS '回答後のフォローアップ指針（深掘り方法など）';
COMMENT ON COLUMN public.interview_questions.quick_replies IS 'ユーザーが選択できるクイックリプライ';
COMMENT ON COLUMN public.interview_questions.question_order IS '質問の順序';

CREATE INDEX idx_interview_questions_config_id
  ON public.interview_questions USING btree (interview_config_id);
CREATE INDEX idx_interview_questions_config_order
  ON public.interview_questions USING btree (interview_config_id, question_order);

CREATE TRIGGER update_interview_questions_updated_at
  BEFORE UPDATE ON public.interview_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- interview_sessions（インタビューセッション）
-- ------------------------------------------------------------
CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_config_id uuid NOT NULL REFERENCES public.interview_configs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  langfuse_session_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  archived_at timestamptz,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interview_sessions IS 'インタビューセッションを管理するテーブル';
COMMENT ON COLUMN public.interview_sessions.interview_config_id IS 'インタビュー設定ID';
COMMENT ON COLUMN public.interview_sessions.user_id IS 'ユーザーID（匿名認証）';
COMMENT ON COLUMN public.interview_sessions.langfuse_session_id IS 'LangfuseセッションID';
COMMENT ON COLUMN public.interview_sessions.started_at IS '開始日時';
COMMENT ON COLUMN public.interview_sessions.completed_at IS '完了日時';

CREATE INDEX idx_interview_sessions_config_id
  ON public.interview_sessions USING btree (interview_config_id);
CREATE INDEX idx_interview_sessions_config_user
  ON public.interview_sessions USING btree (interview_config_id, user_id);
CREATE INDEX idx_interview_sessions_started_at
  ON public.interview_sessions USING btree (started_at);
CREATE INDEX idx_interview_sessions_user_id
  ON public.interview_sessions USING btree (user_id);

CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- interview_messages（セッション内の対話ログ）
-- ------------------------------------------------------------
CREATE TABLE public.interview_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  role public.interview_role_enum NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interview_messages IS 'インタビュー内の質問と回答を保存するテーブル';
COMMENT ON COLUMN public.interview_messages.interview_session_id IS 'インタビューセッションID';
COMMENT ON COLUMN public.interview_messages.role IS 'メッセージの役割（assistant: AIからの質問, user: ユーザーからの回答）';
COMMENT ON COLUMN public.interview_messages.content IS 'メッセージ内容';

CREATE INDEX idx_interview_messages_session_id
  ON public.interview_messages USING btree (interview_session_id);
CREATE INDEX idx_interview_messages_session_created
  ON public.interview_messages USING btree (interview_session_id, created_at);

ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- interview_report（AI生成された意見レポート）
-- ------------------------------------------------------------
CREATE TABLE public.interview_report (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id uuid NOT NULL UNIQUE REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  summary text,
  stance public.stance_type_enum,
  role public.interview_report_role_enum,
  role_title text,
  role_description text,
  opinions jsonb,
  is_public_by_admin boolean NOT NULL DEFAULT false,
  is_public_by_user boolean NOT NULL DEFAULT false,
  content_richness jsonb,
  total_content_richness integer GENERATED ALWAYS AS (
    CASE
      WHEN content_richness IS NOT NULL
        AND (content_richness ->> 'total'::text) IS NOT NULL
        AND (content_richness ->> 'total'::text) ~ '^\d+$'::text
      THEN (content_richness ->> 'total'::text)::integer
      ELSE NULL::integer
    END
  ) STORED,
  moderation_score integer,
  moderation_status public.moderation_status_enum GENERATED ALWAYS AS (
    CASE
      WHEN moderation_score IS NULL THEN NULL::public.moderation_status_enum
      WHEN moderation_score >= 70 THEN 'ng'::public.moderation_status_enum
      WHEN moderation_score >= 30 THEN 'warning'::public.moderation_status_enum
      ELSE 'ok'::public.moderation_status_enum
    END
  ) STORED,
  moderation_reasoning text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_moderation_score_range
    CHECK (moderation_score IS NULL OR (moderation_score >= 0 AND moderation_score <= 100))
);

COMMENT ON TABLE public.interview_report IS 'インタビュー結果のレポートを保存するテーブル（AIが自動生成）';
COMMENT ON COLUMN public.interview_report.interview_session_id IS 'インタビューセッションID（1セッション1レポート）';
COMMENT ON COLUMN public.interview_report.summary IS 'インタビュー要約';
COMMENT ON COLUMN public.interview_report.stance IS 'AIが分析したユーザーのスタンス';
COMMENT ON COLUMN public.interview_report.role IS 'AIが推論したユーザーの役割・属性（ENUM型）';
COMMENT ON COLUMN public.interview_report.role_description IS '役割の説明';
COMMENT ON COLUMN public.interview_report.opinions IS '意見の配列 [{title: string, content: string}, ...]';
COMMENT ON COLUMN public.interview_report.is_public_by_admin IS '管理者によるレポートの公開状態（true: 公開, false: 非公開）';
COMMENT ON COLUMN public.interview_report.content_richness IS 'インタビューの情報充実度評価（total, clarity, specificity, impact, constructiveness, reasoning）';
COMMENT ON COLUMN public.interview_report.role_title IS 'A short title (10 characters or less) summarizing the user role, e.g., "物流業者", "主婦"';
COMMENT ON COLUMN public.interview_report.is_public_by_user IS 'Whether the user has consented to making their interview report public';
COMMENT ON COLUMN public.interview_report.total_content_richness IS '総合的な情報充実度（0-100）- content_richnessから自動生成されるGenerated Column';
COMMENT ON COLUMN public.interview_report.moderation_score IS 'モデレーションスコア（0-100）: 0が最も適切、100が最も不適切';
COMMENT ON COLUMN public.interview_report.moderation_status IS 'モデレーションステータス（generated column）: ok=問題なし, warning=要注意, ng=不適切';
COMMENT ON COLUMN public.interview_report.moderation_reasoning IS 'モデレーションスコアの根拠（200文字以内）';

CREATE INDEX idx_interview_report_is_public_by_admin
  ON public.interview_report USING btree (is_public_by_admin);
CREATE INDEX idx_interview_report_moderation_status
  ON public.interview_report USING btree (moderation_status);
CREATE INDEX idx_interview_report_total_content_richness
  ON public.interview_report USING btree (total_content_richness DESC NULLS LAST);

CREATE TRIGGER update_interview_report_updated_at
  BEFORE UPDATE ON public.interview_report
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.interview_report ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- interview_rating_feedbacks（低評価時のフィードバックタグ）
-- ------------------------------------------------------------
CREATE TABLE public.interview_rating_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  tag public.interview_feedback_tag_enum NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (interview_session_id, tag)
);

COMMENT ON TABLE public.interview_rating_feedbacks IS '低評価（3以下）時のフィードバックタグ';
COMMENT ON COLUMN public.interview_rating_feedbacks.tag IS 'フィードバックタグ種別';

CREATE INDEX idx_interview_rating_feedbacks_session
  ON public.interview_rating_feedbacks USING btree (interview_session_id);
CREATE INDEX idx_interview_rating_feedbacks_tag
  ON public.interview_rating_feedbacks USING btree (tag);

ALTER TABLE public.interview_rating_feedbacks ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- report_reactions（公開レポートへのリアクション）
-- ------------------------------------------------------------
CREATE TABLE public.report_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_report_id uuid NOT NULL REFERENCES public.interview_report(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('helpful', 'hmm')),
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (interview_report_id, user_id)
);

CREATE INDEX idx_report_reactions_report_id
  ON public.report_reactions USING btree (interview_report_id);
CREATE INDEX idx_report_reactions_user_id
  ON public.report_reactions USING btree (user_id);

ALTER TABLE public.report_reactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- expert_registrations（有識者リスト登録情報）
-- ------------------------------------------------------------
CREATE TABLE public.expert_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  affiliation text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.expert_registrations IS '有識者リスト登録情報を管理するテーブル';
COMMENT ON COLUMN public.expert_registrations.name IS '有識者の氏名';
COMMENT ON COLUMN public.expert_registrations.affiliation IS '所属・肩書';
COMMENT ON COLUMN public.expert_registrations.email IS 'メールアドレス';
COMMENT ON COLUMN public.expert_registrations.user_id IS '登録したユーザーのID';

CREATE UNIQUE INDEX idx_expert_registrations_email
  ON public.expert_registrations USING btree (email);
CREATE UNIQUE INDEX idx_expert_registrations_user_id
  ON public.expert_registrations USING btree (user_id);

CREATE TRIGGER update_expert_registrations_updated_at
  BEFORE UPDATE ON public.expert_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.expert_registrations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- topic_analysis_*（意見のトピック解析）
-- ------------------------------------------------------------
CREATE TABLE public.topic_analysis_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  summary_md text,
  intermediate_results jsonb,
  error_message text,
  current_step text,
  started_at timestamptz,
  completed_at timestamptz,
  phase_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (bill_id, version)
);

COMMENT ON TABLE public.topic_analysis_versions IS 'トピック解析のバージョン管理';
COMMENT ON COLUMN public.topic_analysis_versions.bill_id IS '対象議案ID';
COMMENT ON COLUMN public.topic_analysis_versions.version IS 'バージョン番号（議案ごとにインクリメント）';
COMMENT ON COLUMN public.topic_analysis_versions.status IS '解析ステータス: pending, running, completed, failed';
COMMENT ON COLUMN public.topic_analysis_versions.summary_md IS '全体サマリ（markdown形式）';
COMMENT ON COLUMN public.topic_analysis_versions.intermediate_results IS '中間結果（デバッグ・参照用）';
COMMENT ON COLUMN public.topic_analysis_versions.error_message IS 'エラー時のメッセージ';

CREATE INDEX idx_topic_analysis_versions_bill_id
  ON public.topic_analysis_versions USING btree (bill_id);

CREATE TRIGGER set_topic_analysis_versions_updated_at
  BEFORE UPDATE ON public.topic_analysis_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.topic_analysis_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.topic_analysis_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.topic_analysis_versions(id) ON DELETE CASCADE,
  name text NOT NULL,
  description_md text NOT NULL,
  representative_opinions jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.topic_analysis_topics IS 'トピック解析で抽出されたトピック';
COMMENT ON COLUMN public.topic_analysis_topics.version_id IS '所属バージョンID';
COMMENT ON COLUMN public.topic_analysis_topics.name IS 'トピック名';
COMMENT ON COLUMN public.topic_analysis_topics.description_md IS 'トピックの説明文（markdown形式）';
COMMENT ON COLUMN public.topic_analysis_topics.representative_opinions IS '代表的な意見（JSON配列、最大5件）';
COMMENT ON COLUMN public.topic_analysis_topics.sort_order IS '表示順';

CREATE INDEX idx_topic_analysis_topics_version_id
  ON public.topic_analysis_topics USING btree (version_id);

ALTER TABLE public.topic_analysis_topics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.topic_analysis_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.topic_analysis_versions(id) ON DELETE CASCADE,
  interview_report_id uuid NOT NULL REFERENCES public.interview_report(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topic_analysis_topics(id) ON DELETE CASCADE,
  opinion_index integer NOT NULL,

  UNIQUE (version_id, interview_report_id, topic_id, opinion_index)
);

COMMENT ON TABLE public.topic_analysis_classifications IS '意見とトピックの分類（多対多）';
COMMENT ON COLUMN public.topic_analysis_classifications.version_id IS '所属バージョンID';
COMMENT ON COLUMN public.topic_analysis_classifications.interview_report_id IS 'インタビューレポートID';
COMMENT ON COLUMN public.topic_analysis_classifications.topic_id IS 'トピックID';
COMMENT ON COLUMN public.topic_analysis_classifications.opinion_index IS 'レポート内の意見インデックス';

CREATE INDEX idx_topic_analysis_classifications_topic_id
  ON public.topic_analysis_classifications USING btree (topic_id);
CREATE INDEX idx_topic_analysis_classifications_version_id
  ON public.topic_analysis_classifications USING btree (version_id);

ALTER TABLE public.topic_analysis_classifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- インタビュー集計・並び替え・一括公開 RPC 群（すべて service_role 専用）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_publish_reports(
  p_config_id uuid,
  p_max_moderation_score integer,
  p_min_content_richness integer
)
RETURNS bigint
LANGUAGE sql
AS $$
  WITH updated AS (
    UPDATE interview_report r
    SET is_public_by_admin = true
    FROM interview_sessions s
    WHERE s.id = r.interview_session_id
      AND s.interview_config_id = p_config_id
      AND r.is_public_by_user = true
      AND r.is_public_by_admin = false
      AND r.moderation_score IS NOT NULL
      AND r.moderation_score <= p_max_moderation_score
      AND r.total_content_richness IS NOT NULL
      AND r.total_content_richness >= p_min_content_richness
    RETURNING r.id
  )
  SELECT count(*) FROM updated;
$$;

CREATE OR REPLACE FUNCTION public.count_bulk_publish_targets(
  p_config_id uuid,
  p_max_moderation_score integer,
  p_min_content_richness integer
)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)
  FROM interview_report r
  JOIN interview_sessions s ON s.id = r.interview_session_id
  WHERE s.interview_config_id = p_config_id
    AND r.is_public_by_user = true
    AND r.is_public_by_admin = false
    AND r.moderation_score IS NOT NULL
    AND r.moderation_score <= p_max_moderation_score
    AND r.total_content_richness IS NOT NULL
    AND r.total_content_richness >= p_min_content_richness;
$$;

CREATE OR REPLACE FUNCTION public.count_public_reports_by_stance(p_bill_id uuid)
RETURNS TABLE(stance text, count bigint)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ir.stance::TEXT AS stance,
    COUNT(*) AS count
  FROM interview_report ir
  INNER JOIN interview_sessions s ON s.id = ir.interview_session_id
  INNER JOIN interview_configs c ON c.id = s.interview_config_id
  WHERE ir.is_public_by_admin = TRUE
    AND ir.is_public_by_user = TRUE
    AND c.bill_id = p_bill_id
  GROUP BY ir.stance;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_reactions_by_report_ids(report_ids uuid[])
RETURNS TABLE(interview_report_id uuid, reaction_type text, cnt bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.interview_report_id,
    r.reaction_type,
    count(*) AS cnt
  FROM report_reactions r
  WHERE r.interview_report_id = ANY(report_ids)
  GROUP BY r.interview_report_id, r.reaction_type;
$$;

CREATE OR REPLACE FUNCTION public.count_sessions_by_config_ids(p_config_ids uuid[])
RETURNS TABLE(interview_config_id uuid, session_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.interview_config_id,
    count(s.id) AS session_count
  FROM interview_sessions s
  WHERE s.interview_config_id = ANY(p_config_ids)
  GROUP BY s.interview_config_id;
$$;

CREATE OR REPLACE FUNCTION public.find_public_reports_by_bill_id_ordered_by_reactions(
  p_bill_id uuid,
  p_limit integer DEFAULT 1000,
  p_offset integer DEFAULT 0,
  p_stance text DEFAULT NULL::text,
  p_sort_order text DEFAULT 'recommended'::text
)
RETURNS TABLE(
  id uuid,
  stance public.stance_type_enum,
  role public.interview_report_role_enum,
  role_title text,
  summary text,
  total_content_richness integer,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ir.id,
    ir.stance,
    ir.role,
    ir.role_title,
    ir.summary,
    ir.total_content_richness,
    ir.created_at
  FROM interview_report ir
  INNER JOIN interview_sessions s ON s.id = ir.interview_session_id
  INNER JOIN interview_configs c ON c.id = s.interview_config_id
  LEFT JOIN (
    SELECT rr.interview_report_id, COUNT(*) AS helpful_count
    FROM report_reactions rr
    WHERE rr.reaction_type = 'helpful'
    GROUP BY rr.interview_report_id
  ) rc ON rc.interview_report_id = ir.id
  WHERE ir.is_public_by_admin = TRUE
    AND ir.is_public_by_user = TRUE
    AND c.bill_id = p_bill_id
    AND (p_stance IS NULL OR ir.stance::TEXT = p_stance)
  ORDER BY
    CASE WHEN p_sort_order = 'newest' THEN NULL
         ELSE (COALESCE(rc.helpful_count, 0) + COALESCE(ir.total_content_richness, 0))
    END DESC NULLS LAST,
    ir.created_at DESC,
    ir.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_sessions_ordered_by_helpful_count(
  p_config_id uuid,
  p_ascending boolean DEFAULT false,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 30,
  p_status text DEFAULT NULL::text,
  p_visibility text DEFAULT NULL::text,
  p_stance text DEFAULT NULL::text,
  p_role text DEFAULT NULL::text
)
RETURNS TABLE(session_id uuid)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN interview_report r ON r.interview_session_id = s.id
  LEFT JOIN (
    SELECT rr.interview_report_id, COUNT(*)::BIGINT AS cnt
    FROM report_reactions rr
    WHERE rr.reaction_type = 'helpful'
    GROUP BY rr.interview_report_id
  ) hc ON hc.interview_report_id = r.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN COALESCE(hc.cnt, 0) END ASC,
    CASE WHEN NOT p_ascending THEN COALESCE(hc.cnt, 0) END DESC,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_sessions_ordered_by_message_count(
  p_config_id uuid,
  p_ascending boolean DEFAULT false,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 30,
  p_status text DEFAULT NULL::text,
  p_visibility text DEFAULT NULL::text,
  p_stance text DEFAULT NULL::text,
  p_role text DEFAULT NULL::text
)
RETURNS TABLE(session_id uuid)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN (
    SELECT im.interview_session_id, COUNT(*)::BIGINT AS cnt
    FROM interview_messages im
    INNER JOIN interview_sessions iss
      ON iss.id = im.interview_session_id
    WHERE iss.interview_config_id = p_config_id
    GROUP BY im.interview_session_id
  ) mc ON mc.interview_session_id = s.id
  LEFT JOIN interview_report r ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN COALESCE(mc.cnt, 0) END ASC,
    CASE WHEN NOT p_ascending THEN COALESCE(mc.cnt, 0) END DESC,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_sessions_ordered_by_moderation_score(
  p_config_id uuid,
  p_ascending boolean DEFAULT false,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 30,
  p_status text DEFAULT NULL::text,
  p_visibility text DEFAULT NULL::text,
  p_stance text DEFAULT NULL::text,
  p_role text DEFAULT NULL::text
)
RETURNS TABLE(session_id uuid)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN interview_report r
    ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN r.moderation_score END ASC NULLS LAST,
    CASE WHEN NOT p_ascending THEN r.moderation_score END DESC NULLS LAST,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_sessions_ordered_by_total_content_richness(
  p_config_id uuid,
  p_ascending boolean DEFAULT false,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 30,
  p_status text DEFAULT NULL::text,
  p_visibility text DEFAULT NULL::text,
  p_stance text DEFAULT NULL::text,
  p_role text DEFAULT NULL::text
)
RETURNS TABLE(session_id uuid)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id AS session_id
  FROM interview_sessions s
  LEFT JOIN interview_report r
    ON r.interview_session_id = s.id
  WHERE s.interview_config_id = p_config_id
    AND (p_status IS NULL OR
         (p_status = 'completed' AND s.completed_at IS NOT NULL) OR
         (p_status = 'in_progress' AND s.completed_at IS NULL AND s.archived_at IS NULL) OR
         (p_status = 'archived' AND s.completed_at IS NULL AND s.archived_at IS NOT NULL))
    AND (p_visibility IS NULL OR
         (p_visibility = 'public' AND r.is_public_by_admin = TRUE) OR
         (p_visibility = 'private' AND r.is_public_by_admin = FALSE))
    AND (p_stance IS NULL OR r.stance = p_stance::stance_type_enum)
    AND (p_role IS NULL OR r.role = p_role::interview_report_role_enum)
  ORDER BY
    CASE WHEN p_ascending THEN r.total_content_richness END ASC NULLS LAST,
    CASE WHEN NOT p_ascending THEN r.total_content_richness END DESC NULLS LAST,
    s.started_at DESC,
    s.id DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_interview_message_counts(session_ids uuid[])
RETURNS TABLE(interview_session_id uuid, message_count bigint)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    im.interview_session_id,
    COUNT(*)::BIGINT AS message_count
  FROM interview_messages im
  WHERE im.interview_session_id = ANY(session_ids)
  GROUP BY im.interview_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_interview_statistics(p_config_id uuid)
RETURNS TABLE(
  total_sessions bigint,
  completed_sessions bigint,
  avg_rating numeric,
  stance_for_count bigint,
  stance_against_count bigint,
  stance_neutral_count bigint,
  avg_total_content_richness numeric,
  role_subject_expert_count bigint,
  role_work_related_count bigint,
  role_daily_life_affected_count bigint,
  role_general_citizen_count bigint,
  avg_message_count numeric,
  median_duration_seconds numeric,
  public_by_user_count bigint,
  feedback_irrelevant_questions bigint,
  feedback_not_aligned bigint,
  feedback_misunderstood bigint,
  feedback_too_many_questions bigint,
  feedback_other bigint,
  total_cost_usd numeric,
  avg_cost_usd numeric
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    count(s.id) AS total_sessions,
    count(s.completed_at) AS completed_sessions,
    round(avg(s.rating)::numeric, 2) AS avg_rating,
    count(CASE WHEN r.stance = 'for' THEN 1 END) AS stance_for_count,
    count(CASE WHEN r.stance = 'against' THEN 1 END) AS stance_against_count,
    count(CASE WHEN r.stance = 'neutral' THEN 1 END) AS stance_neutral_count,
    round(avg(r.total_content_richness)::numeric, 1) AS avg_total_content_richness,
    count(CASE WHEN r.role = 'subject_expert' THEN 1 END) AS role_subject_expert_count,
    count(CASE WHEN r.role = 'work_related' THEN 1 END) AS role_work_related_count,
    count(CASE WHEN r.role = 'daily_life_affected' THEN 1 END) AS role_daily_life_affected_count,
    count(CASE WHEN r.role = 'general_citizen' THEN 1 END) AS role_general_citizen_count,
    round(avg(coalesce(mc.message_count, 0))::numeric, 1) AS avg_message_count,
    round(
      (SELECT percentile_cont(0.5) WITHIN GROUP (
        ORDER BY extract(epoch FROM (sub.completed_at - sub.started_at))
      )
      FROM interview_sessions sub
      WHERE sub.interview_config_id = p_config_id
        AND sub.completed_at IS NOT NULL
      )::numeric, 0
    ) AS median_duration_seconds,
    count(CASE WHEN r.is_public_by_user = true THEN 1 END) AS public_by_user_count,
    coalesce(max(fc.feedback_irrelevant_questions), 0) AS feedback_irrelevant_questions,
    coalesce(max(fc.feedback_not_aligned), 0) AS feedback_not_aligned,
    coalesce(max(fc.feedback_misunderstood), 0) AS feedback_misunderstood,
    coalesce(max(fc.feedback_too_many_questions), 0) AS feedback_too_many_questions,
    coalesce(max(fc.feedback_other), 0) AS feedback_other,
    coalesce(max(cc.total_cost), 0)::numeric AS total_cost_usd,
    CASE
      WHEN count(s.id) > 0 THEN round(coalesce(max(cc.total_cost), 0)::numeric / count(s.id), 6)
      ELSE 0::numeric
    END AS avg_cost_usd
  FROM interview_sessions s
  LEFT JOIN interview_report r ON r.interview_session_id = s.id
  LEFT JOIN (
    SELECT im.interview_session_id, count(*) AS message_count
    FROM interview_messages im
    GROUP BY im.interview_session_id
  ) mc ON mc.interview_session_id = s.id
  LEFT JOIN (
    SELECT
      count(*) FILTER (WHERE f.tag = 'irrelevant_questions') AS feedback_irrelevant_questions,
      count(*) FILTER (WHERE f.tag = 'not_aligned') AS feedback_not_aligned,
      count(*) FILTER (WHERE f.tag = 'misunderstood') AS feedback_misunderstood,
      count(*) FILTER (WHERE f.tag = 'too_many_questions') AS feedback_too_many_questions,
      count(*) FILTER (WHERE f.tag = 'other') AS feedback_other
    FROM interview_rating_feedbacks f
    JOIN interview_sessions fs ON fs.id = f.interview_session_id
    WHERE fs.interview_config_id = p_config_id
  ) fc ON true
  LEFT JOIN (
    SELECT sum(c.cost_usd) AS total_cost
    FROM chat_usage_events c
    JOIN interview_sessions cs ON cs.id::text = c.session_id
    WHERE cs.interview_config_id = p_config_id
  ) cc ON true
  WHERE s.interview_config_id = p_config_id;
END;
$$;

-- 全インタビュー系 RPC を service_role 専用に制限
REVOKE EXECUTE ON FUNCTION public.bulk_publish_reports(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_publish_reports(uuid, integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.count_bulk_publish_targets(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_bulk_publish_targets(uuid, integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.count_public_reports_by_stance(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_public_reports_by_stance(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.count_reactions_by_report_ids(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_reactions_by_report_ids(uuid[]) TO service_role;

REVOKE EXECUTE ON FUNCTION public.count_sessions_by_config_ids(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_sessions_by_config_ids(uuid[]) TO service_role;

REVOKE EXECUTE ON FUNCTION public.find_public_reports_by_bill_id_ordered_by_reactions(uuid, integer, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_public_reports_by_bill_id_ordered_by_reactions(uuid, integer, integer, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.find_sessions_ordered_by_helpful_count(uuid, boolean, integer, integer, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_sessions_ordered_by_helpful_count(uuid, boolean, integer, integer, text, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.find_sessions_ordered_by_message_count(uuid, boolean, integer, integer, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_sessions_ordered_by_message_count(uuid, boolean, integer, integer, text, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.find_sessions_ordered_by_moderation_score(uuid, boolean, integer, integer, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_sessions_ordered_by_moderation_score(uuid, boolean, integer, integer, text, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.find_sessions_ordered_by_total_content_richness(uuid, boolean, integer, integer, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_sessions_ordered_by_total_content_richness(uuid, boolean, integer, integer, text, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_interview_message_counts(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_interview_message_counts(uuid[]) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_interview_statistics(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_interview_statistics(uuid) TO service_role;
