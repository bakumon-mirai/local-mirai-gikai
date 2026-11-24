import { siteConfig } from "@/config/site.config";
import { routes } from "@/lib/routes";

export type ThemeTone = "accent" | "beige" | "coral";

export type ThemeSlug =
  | "kosodate-kyoiku"
  | "fukushi-iryo"
  | "bosai-anzen"
  | "machi-kotsu"
  | "kankyo-energy"
  | "shigoto-nogyo"
  | "kanko-bunka"
  | "gyosei-okane";

export type TopTheme = {
  slug: ThemeSlug;
  label: string;
  /** タイルの漢字一文字アイコン */
  kanji: string;
  tone: ThemeTone;
  /** 検索ページへ渡す初期クエリ */
  searchQuery: string;
  /** 一般質問側の分類ラベルとの対応 */
  questionCategories: string[];
};

/**
 * 行政呼称（市政・町政・県政等）に応じて 8 テーマ定義を生成する。
 */
export function buildTopThemes(
  governmentTerm: string = siteConfig.governmentTerm
): TopTheme[] {
  const govKanji = [...governmentTerm][0] ?? "政";

  return [
    {
      slug: "kosodate-kyoiku",
      label: "子育て・教育",
      kanji: "育",
      tone: "coral",
      searchQuery: "子育て",
      questionCategories: ["子育て・教育"],
    },
    {
      slug: "fukushi-iryo",
      label: "福祉・医療",
      kanji: "医",
      tone: "accent",
      searchQuery: "医療",
      questionCategories: ["健康・医療", "高齢者・福祉"],
    },
    {
      slug: "bosai-anzen",
      label: "防災・安全",
      kanji: "防",
      tone: "beige",
      searchQuery: "防災",
      questionCategories: ["防災・安全", "警察・人権"],
    },
    {
      slug: "machi-kotsu",
      label: "まち・交通",
      kanji: "街",
      tone: "accent",
      searchQuery: "交通",
      questionCategories: ["交通・まちづくり"],
    },
    {
      slug: "kankyo-energy",
      label: "環境・エネルギー",
      kanji: "環",
      tone: "beige",
      searchQuery: "環境",
      questionCategories: ["環境・脱炭素"],
    },
    {
      slug: "shigoto-nogyo",
      label: "しごと・農業",
      kanji: "農",
      tone: "coral",
      searchQuery: "農業",
      questionCategories: ["産業・農林水産"],
    },
    {
      slug: "kanko-bunka",
      label: "観光・文化",
      kanji: "観",
      tone: "accent",
      searchQuery: "観光",
      questionCategories: ["観光・地域振興", "スポーツ・文化"],
    },
    {
      slug: "gyosei-okane",
      label: `${governmentTerm}・お金`,
      kanji: govKanji,
      tone: "beige",
      searchQuery: governmentTerm,
      questionCategories: ["行政・議会"],
    },
  ];
}

export const TOP_THEMES: TopTheme[] = buildTopThemes();

export function themeHref(theme: TopTheme): string {
  return routes.search(theme.searchQuery);
}

export const OTHER_KEYWORDS_HREF = routes.search();

export function splitThemeLabel(label: string): {
  head: string;
  tail: string | null;
} {
  const index = label.indexOf("・");
  if (index === -1) return { head: label, tail: null };

  return {
    head: label.slice(0, index),
    tail: label.slice(index + 1),
  };
}

export function themeForQuestionCategory(
  categoryLabel: string,
  themes: TopTheme[] = TOP_THEMES
): TopTheme | null {
  return (
    themes.find((theme) => theme.questionCategories.includes(categoryLabel)) ??
    null
  );
}
