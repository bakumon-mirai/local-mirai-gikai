-- ============================================================
-- 04. 委員会議事録・議題
-- ============================================================
-- 対応パーツ: siteConfig.features.committeeMinutes
-- 依存先: 01_foundation_and_council.sql (committees) / 任意参照 02_bills.sql (bills)

-- ------------------------------------------------------------
-- committee_meetings（委員会の開催1回分）
-- ------------------------------------------------------------
CREATE TABLE public.committee_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 特別委員会など committees 未登録の会議もあるため nullable
  committee_id uuid REFERENCES public.committees(id) ON DELETE SET NULL,
  -- 開催時点の委員会名（改組前の旧名称のことがある）
  committee_name text NOT NULL,
  -- 同一系統の委員会を名称変更をまたいで束ねるスラッグ
  committee_slug text NOT NULL,
  meeting_date date NOT NULL,
  title text NOT NULL,
  -- 会議録システム側の ID（あれば）。振り直されることがあるため一意にはしない
  source_id text,
  source_url text,
  -- 会議全体の要約（AI生成・確認後に格納）
  summary text,
  -- 発言単位の構造化データ [{voiceNo, speakerLabel, speakerType, text, simpleText?}]
  -- speakerType: chairperson | member | executive | unknown
  speeches jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- 取り込み・AI要約用の会議録原文（Web公開画面には表示せず、出典リンク source_url で案内する）
  raw_text text NOT NULL DEFAULT '',
  publish_status text NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft', 'published')),
  -- 発言数（一覧で speeches 本体を送らずに件数だけを使うための生成列）
  speech_count integer GENERATED ALWAYS AS (
    CASE
      WHEN jsonb_typeof(speeches) = 'array' THEN jsonb_array_length(speeches)
      ELSE 0
    END
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 同じ委員会・同じ日・同じ件名の会議は1件（取り込み時の重複防止キー）
  UNIQUE (committee_slug, meeting_date, title)
);

COMMENT ON COLUMN public.committee_meetings.speech_count IS '発言数（speeches の要素数）。生成列のため直接更新しない';

CREATE INDEX committee_meetings_committee_id_idx
  ON public.committee_meetings USING btree (committee_id);
CREATE INDEX committee_meetings_slug_date_idx
  ON public.committee_meetings USING btree (committee_slug, meeting_date DESC);
CREATE INDEX committee_meetings_source_id_idx
  ON public.committee_meetings USING btree (source_id);
CREATE INDEX committee_meetings_speech_count_idx
  ON public.committee_meetings USING btree (publish_status, speech_count, meeting_date DESC);

CREATE TRIGGER update_committee_meetings_updated_at
  BEFORE UPDATE ON public.committee_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.committee_meetings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- committee_meeting_topics（会議内の議題1件分）
-- ------------------------------------------------------------
CREATE TABLE public.committee_meeting_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.committee_meetings(id) ON DELETE CASCADE,
  topic_order integer NOT NULL,
  title text NOT NULL,
  -- 議題の住民向け要約（AI生成・確認後に格納）
  summary text,
  -- 質疑の流れの要約（AI生成・確認後に格納）
  discussion_summary text,
  -- 発言者一覧 [{label}]
  speakers jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- この議題に対応する発言範囲（committee_meetings.speeches の voiceNo）
  start_voice_no integer,
  end_voice_no integer,
  -- 付託議案の審査であれば、その議案（議案機能と併用する場合）
  bill_id uuid REFERENCES public.bills(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (meeting_id, topic_order)
);

CREATE INDEX committee_meeting_topics_meeting_id_idx
  ON public.committee_meeting_topics USING btree (meeting_id);
CREATE INDEX committee_meeting_topics_bill_id_idx
  ON public.committee_meeting_topics USING btree (bill_id);

CREATE TRIGGER update_committee_meeting_topics_updated_at
  BEFORE UPDATE ON public.committee_meeting_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.committee_meeting_topics ENABLE ROW LEVEL SECURITY;
