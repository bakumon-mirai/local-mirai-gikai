-- ============================================================
-- 02. 議案・会派別賛否・タグ・プレビュー・サムネイル Storage
-- ============================================================
-- 対応パーツ: siteConfig.features.bills / showFactionStances
-- 依存先: 01_foundation_and_council.sql

-- ------------------------------------------------------------
-- ENUM 型
-- ------------------------------------------------------------
CREATE TYPE public.bill_publish_status AS ENUM (
  'draft',
  'published',
  'coming_soon'
);
COMMENT ON TYPE public.bill_publish_status IS 'ENUM type for bill publication status';

CREATE TYPE public.bill_status_enum AS ENUM (
  'preparing',
  'submitted',
  'in_committee',
  'plenary_session',
  'approved',
  'rejected',
  'adopted',
  'partially_adopted',
  'reported'
);

CREATE TYPE public.difficulty_level_enum AS ENUM (
  'normal',
  'hard'
);

CREATE TYPE public.stance_type_enum AS ENUM (
  'for',
  'against',
  'neutral',
  'conditional_for',
  'conditional_against',
  'considering',
  'continued_deliberation'
);

-- ------------------------------------------------------------
-- bills（議案基本情報）
-- ------------------------------------------------------------
CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  bill_number text NOT NULL DEFAULT '',
  status public.bill_status_enum NOT NULL,
  status_note text,
  publish_status public.bill_publish_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  is_featured boolean NOT NULL DEFAULT false,
  thumbnail_url text,
  share_thumbnail_url text,
  pdf_url text,
  council_session_id uuid REFERENCES public.council_sessions(id) ON DELETE SET NULL,
  committee_id uuid REFERENCES public.committees(id),
  publish_status_order integer GENERATED ALWAYS AS (
    CASE publish_status
      WHEN 'draft'::public.bill_publish_status THEN 0
      WHEN 'coming_soon'::public.bill_publish_status THEN 1
      WHEN 'published'::public.bill_publish_status THEN 2
      ELSE NULL::integer
    END
  ) STORED,
  status_order integer GENERATED ALWAYS AS (
    CASE status
      WHEN 'approved'::public.bill_status_enum THEN 0
      WHEN 'adopted'::public.bill_status_enum THEN 0
      WHEN 'reported'::public.bill_status_enum THEN 0
      WHEN 'partially_adopted'::public.bill_status_enum THEN 1
      WHEN 'rejected'::public.bill_status_enum THEN 2
      WHEN 'plenary_session'::public.bill_status_enum THEN 3
      WHEN 'in_committee'::public.bill_status_enum THEN 4
      WHEN 'submitted'::public.bill_status_enum THEN 5
      WHEN 'preparing'::public.bill_status_enum THEN 6
      ELSE NULL::integer
    END
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.bills IS '議案の基本情報を格納するテーブル。コンテンツはbill_contentsテーブルで管理。';
COMMENT ON COLUMN public.bills.status IS '議案のステータス';
COMMENT ON COLUMN public.bills.published_at IS 'サービスでの議案公開日時';
COMMENT ON COLUMN public.bills.thumbnail_url IS 'URL to the bill thumbnail image stored in Supabase Storage';
COMMENT ON COLUMN public.bills.publish_status IS 'Publication status: draft (private), coming_soon, or published (public)';
COMMENT ON COLUMN public.bills.is_featured IS 'Flag to indicate if this bill is featured on the homepage';
COMMENT ON COLUMN public.bills.share_thumbnail_url IS 'URL to the share/Twitter OGP image stored in Supabase Storage';
COMMENT ON COLUMN public.bills.council_session_id IS '紐付けられた会期ID';
COMMENT ON COLUMN public.bills.bill_number IS '議案番号（例: 「第1号」「報告第1号」など）。空文字は未設定を示す。';
COMMENT ON COLUMN public.bills.pdf_url IS '議案PDFのURL。Web検索補完時にPDF内容の取得に使用する。';

CREATE UNIQUE INDEX bills_bill_number_unique
  ON public.bills USING btree (bill_number)
  WHERE (bill_number <> ''::text);
CREATE INDEX idx_bills_committee_id ON public.bills USING btree (committee_id);
CREATE INDEX idx_bills_council_session_id ON public.bills USING btree (council_session_id);
CREATE INDEX idx_bills_is_featured ON public.bills USING btree (is_featured) WHERE (is_featured = true);
CREATE INDEX idx_bills_publish_status ON public.bills USING btree (publish_status);
CREATE INDEX idx_bills_publish_status_order ON public.bills USING btree (publish_status_order);
CREATE INDEX idx_bills_published_at ON public.bills USING btree (published_at DESC);
CREATE INDEX idx_bills_status ON public.bills USING btree (status);
CREATE INDEX idx_bills_status_order ON public.bills USING btree (status_order);

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- bill_contents（難易度別の議案解説コンテンツ）
-- ------------------------------------------------------------
CREATE TABLE public.bill_contents (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  difficulty_level public.difficulty_level_enum NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (bill_id, difficulty_level)
);

COMMENT ON TABLE public.bill_contents IS '議案の難易度別コンテンツを管理するテーブル';
COMMENT ON COLUMN public.bill_contents.difficulty_level IS '難易度レベル（normal:ふつう, hard:難しい）';
COMMENT ON COLUMN public.bill_contents.content IS 'Markdown形式の議案内容';

CREATE INDEX idx_bill_contents_bill_id ON public.bill_contents USING btree (bill_id);
CREATE INDEX idx_bill_contents_difficulty ON public.bill_contents USING btree (difficulty_level);

CREATE TRIGGER update_bill_contents_updated_at
  BEFORE UPDATE ON public.bill_contents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bill_contents ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- tags / bills_tags（議案タグ）
-- ------------------------------------------------------------
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  featured_priority integer,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tags IS 'Master table for tags';
COMMENT ON COLUMN public.tags.label IS 'Tag label (display name)';
COMMENT ON COLUMN public.tags.featured_priority IS 'Featured表示の優先度（数値が小さいほど優先度が高い）。NULLの場合は非表示';
COMMENT ON COLUMN public.tags.description IS 'Tag description text';

CREATE INDEX idx_tags_featured_priority
  ON public.tags USING btree (featured_priority)
  WHERE (featured_priority IS NOT NULL);

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bills_tags (
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (bill_id, tag_id)
);

COMMENT ON TABLE public.bills_tags IS 'Junction table for bills and tags relationship';
COMMENT ON COLUMN public.bills_tags.bill_id IS 'Bill ID';
COMMENT ON COLUMN public.bills_tags.tag_id IS 'Tag ID';

ALTER TABLE public.bills_tags ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- faction_stances（会派別の議案賛否）
-- ------------------------------------------------------------
CREATE TABLE public.faction_stances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
  type public.stance_type_enum NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (bill_id, faction_id)
);

CREATE INDEX idx_faction_stances_bill_id ON public.faction_stances USING btree (bill_id);
CREATE INDEX idx_faction_stances_faction_id ON public.faction_stances USING btree (faction_id);

CREATE TRIGGER set_faction_stances_updated_at
  BEFORE UPDATE ON public.faction_stances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.faction_stances ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- preview_tokens（下書き議案のプレビュー用トークン）
-- ------------------------------------------------------------
CREATE TABLE public.preview_tokens (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.preview_tokens IS 'Preview tokens for bill access management';
COMMENT ON COLUMN public.preview_tokens.token IS 'Unique preview access token';
COMMENT ON COLUMN public.preview_tokens.expires_at IS 'Token expiration date (30 days)';

CREATE INDEX idx_preview_tokens_bill_id ON public.preview_tokens USING btree (bill_id);
CREATE INDEX idx_preview_tokens_expires_at ON public.preview_tokens USING btree (expires_at);
CREATE INDEX idx_preview_tokens_token ON public.preview_tokens USING btree (token);

ALTER TABLE public.preview_tokens ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Storage: 議案サムネイル用バケットと RLS ポリシー
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('bill-thumbnails', 'bill-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'bill-thumbnails');

CREATE POLICY "Admin users can upload bill thumbnails"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'bill-thumbnails' AND public.is_admin());

CREATE POLICY "Admin users can update bill thumbnails"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'bill-thumbnails' AND public.is_admin());

CREATE POLICY "Admin users can delete bill thumbnails"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'bill-thumbnails' AND public.is_admin());
