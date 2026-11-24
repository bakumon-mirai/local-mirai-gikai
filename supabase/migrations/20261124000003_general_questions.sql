-- ============================================================
-- 03. 一般質問・代表質問
-- ============================================================
-- 対応パーツ: siteConfig.features.generalQuestions
-- 依存先: 01_foundation_and_council.sql (council_sessions のみ)

CREATE TABLE public.general_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  council_session_id uuid NOT NULL REFERENCES public.council_sessions(id) ON DELETE CASCADE,
  -- 代表質問（会派を代表して行う質問）と一般質問の別
  question_type text NOT NULL DEFAULT 'general'
    CHECK (question_type IN ('general', 'representative')),
  questioner_name text NOT NULL,
  questioner_party text,
  -- 議席番号など（無ければ null）
  questioner_number integer,
  -- 会期の何日目か・その日の何番目か（並び順と重複防止に使う）
  session_day integer NOT NULL DEFAULT 1,
  question_order integer NOT NULL DEFAULT 1,
  -- 質問全体の要約（AI生成・確認後に格納）
  summary text,
  -- 論点ごとの要約 [{title, question_summary, answer_summary, answerer_role, answerer_name, block_summary?}]
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- 取り込み・AI要約用の中間原文（Web公開画面では表示せず、出典リンク source_url で案内する）
  raw_text text,
  answer_raw_text text,
  source_url text,
  publish_status text NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (council_session_id, session_day, question_order)
);

CREATE INDEX general_questions_session_order_idx
  ON public.general_questions USING btree (council_session_id, session_day, question_order);
CREATE INDEX general_questions_publish_status_idx
  ON public.general_questions USING btree (publish_status);

CREATE TRIGGER update_general_questions_updated_at
  BEFORE UPDATE ON public.general_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.general_questions ENABLE ROW LEVEL SECURITY;
