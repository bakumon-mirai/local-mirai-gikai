import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  PressConference,
  PressConferenceListItem,
  PressConferenceRef,
  PressConferenceSummary,
} from "../../shared/types";

type TurnRow = {
  id: string;
  speaker: string;
  speaker_name: string | null;
  content: string;
  order_index: number;
};

type ItemRow = {
  id: string;
  item_type: string;
  order_index: number;
  title: string;
  summary: string | null;
  material_url: string | null;
  detail: string | null;
  press_conference_turns: TurnRow[];
};

type PressConferenceRow = {
  id: string;
  slug: string;
  title: string;
  held_at: string;
  youtube_url: string | null;
  status: string;
  press_conference_items: ItemRow[];
};

function isMissingTableError(error: { code?: string | null }): boolean {
  return error.code === "42P01" || error.code === "PGRST205";
}

function mapToPressConference(row: PressConferenceRow): PressConference {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    heldAt: row.held_at,
    youtubeUrl: row.youtube_url,
    status: row.status as PressConference["status"],
    items: [...(row.press_conference_items ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((item) => ({
        id: item.id,
        itemType: item.item_type as "announcement" | "qa",
        orderIndex: item.order_index,
        title: item.title,
        summary: item.summary,
        materialUrl: item.material_url ?? null,
        detail: item.detail ?? null,
        turns: [...(item.press_conference_turns ?? [])]
          .sort((a, b) => a.order_index - b.order_index)
          .map((turn) => ({
            id: turn.id,
            speaker: turn.speaker as "executive" | "reporter" | "secretariat",
            speakerName: turn.speaker_name,
            content: turn.content,
            orderIndex: turn.order_index,
          })),
      })),
  };
}

const NESTED_SELECT = `
  *,
  press_conference_items (
    *,
    press_conference_turns (*)
  )
` as const;

const LIST_SELECT = `
  id,
  slug,
  title,
  held_at,
  press_conference_items (
    id,
    item_type,
    order_index,
    title
  )
` as const;

/**
 * 一覧表示に必要な最小項目のみ取得する（detail・turns 本文は取得しない）。
 */
export async function findPublishedPressConferenceList(): Promise<
  PressConferenceListItem[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select(LIST_SELECT)
    .eq("status", "published")
    .order("held_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`Failed to fetch press conferences: ${error.message}`);
  }

  return (data ?? []).map((raw) => {
    const row = raw as unknown as {
      id: string;
      slug: string;
      title: string;
      held_at: string;
      press_conference_items: Array<{
        id: string;
        item_type: string;
        order_index: number;
        title: string;
      }>;
    };
    const items = [...(row.press_conference_items ?? [])].sort(
      (a, b) => a.order_index - b.order_index
    );
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      heldAt: row.held_at,
      announcementTitles: items
        .filter((item) => item.item_type === "announcement")
        .map((item) => item.title),
      qaCount: items.filter((item) => item.item_type === "qa").length,
    };
  });
}

export async function findPublishedPressConferenceBySlug(
  slug: string
): Promise<PressConference | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select(NESTED_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(
      `Failed to fetch press conference by slug: ${error.message}`
    );
  }

  return data
    ? mapToPressConference(data as unknown as PressConferenceRow)
    : null;
}

export async function findLatestPublishedPressConference(): Promise<PressConference | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select(NESTED_SELECT)
    .eq("status", "published")
    .order("held_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(
      `Failed to fetch latest press conference: ${error.message}`
    );
  }

  return data
    ? mapToPressConference(data as unknown as PressConferenceRow)
    : null;
}

/**
 * 最新の会見を、トップのカードに必要な項目だけで取得する。
 */
export async function findLatestPressConferenceSummary(): Promise<PressConferenceSummary | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select(
      "id, slug, held_at, press_conference_items (id, title, order_index)"
    )
    .eq("status", "published")
    .order("held_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(
      `Failed to fetch latest press conference summary: ${error.message}`
    );
  }
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    slug: string;
    held_at: string;
    press_conference_items: {
      id: string;
      title: string;
      order_index: number;
    }[];
  };

  return {
    id: row.id,
    slug: row.slug,
    heldAt: row.held_at,
    topics: [...(row.press_conference_items ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((item) => ({ id: item.id, title: item.title })),
  };
}

/**
 * 直近の会見を、日付チップに必要な項目だけで取得する。
 */
export async function findRecentPressConferenceRefs(
  limit: number
): Promise<PressConferenceRef[]> {
  if (limit <= 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("press_conferences")
    .select("id, slug, held_at")
    .eq("status", "published")
    .order("held_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(
      `Failed to fetch recent press conferences: ${error.message}`
    );
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    heldAt: row.held_at,
  }));
}
