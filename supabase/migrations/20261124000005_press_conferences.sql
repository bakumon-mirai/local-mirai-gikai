-- ============================================================
-- 05. 首長の記者会見（完全独立モジュール）
-- ============================================================
-- 対応パーツ: siteConfig.features.pressConferences
-- 依存先: 01_foundation_and_council.sql (update_updated_at_column トリガー関数のみ)
--
-- 首長の定例記者会見を公開している自治体でのみ利用する。
-- 他テーブルへの外部キーを持たない完全独立構成。

-- ------------------------------------------------------------
-- press_conferences（記者会見1回分）
-- ------------------------------------------------------------
CREATE TABLE public.press_conferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  held_at date NOT NULL,
  youtube_url text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'structuring', 'review', 'published', 'error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX press_conferences_held_at_idx
  ON public.press_conferences USING btree (held_at DESC);
CREATE INDEX press_conferences_status_idx
  ON public.press_conferences USING btree (status);

CREATE TRIGGER update_press_conferences_updated_at
  BEFORE UPDATE ON public.press_conferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.press_conferences ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- press_conference_items（発表項目と質疑応答）
-- ------------------------------------------------------------
CREATE TABLE public.press_conference_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  press_conference_id uuid NOT NULL REFERENCES public.press_conferences(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('announcement', 'qa')),
  order_index integer NOT NULL,
  title text NOT NULL,
  -- 概要（常時表示）
  summary text,
  -- 詳しい内容（無ければ null）
  detail text,
  -- 配付資料（PDF 等）への URL。主に announcement で使用
  material_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX press_conference_items_conference_order_idx
  ON public.press_conference_items USING btree (press_conference_id, order_index);

ALTER TABLE public.press_conference_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- press_conference_turns（会見中の発言）
-- ------------------------------------------------------------
CREATE TABLE public.press_conference_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  press_conference_item_id uuid NOT NULL REFERENCES public.press_conference_items(id) ON DELETE CASCADE,
  -- executive: 首長（知事・市長・区長・町長・村長） / reporter: 記者 / secretariat: 担当課・部局
  speaker text NOT NULL CHECK (speaker IN ('executive', 'reporter', 'secretariat')),
  speaker_name text,
  content text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX press_conference_turns_item_order_idx
  ON public.press_conference_turns USING btree (press_conference_item_id, order_index);

ALTER TABLE public.press_conference_turns ENABLE ROW LEVEL SECURITY;
