import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import {
  OTHER_KEYWORDS_HREF,
  type ThemeTone,
  buildTopThemes,
  splitThemeLabel,
  themeHref,
} from "@/features/top-themes/shared/utils/theme-mapping";

const TONE_STYLES: Record<ThemeTone, { tile: string; icon: string }> = {
  accent: {
    tile: "bg-archive-surface-tint",
    icon: "bg-archive-pill-bg text-archive-accent-deep",
  },
  beige: {
    tile: "bg-archive-surface-sub",
    icon: "bg-mirai-surface-warm text-archive-beige-text",
  },
  coral: {
    tile: "bg-archive-coral-tint",
    icon: "bg-archive-coral-bg text-archive-coral-text",
  },
};

type Props = {
  governmentTerm?: string;
};

export function ThemeSection({
  governmentTerm = siteConfig.governmentTerm,
}: Props) {
  const themes = buildTopThemes(governmentTerm);

  return (
    <section className="mx-4 mt-10 rounded-[28px] bg-white p-5 pc:mx-16 pc:mt-12 pc:rounded-[32px] pc:p-9">
      <div className="flex flex-col gap-1 pc:flex-row pc:items-baseline pc:justify-between">
        <h2 className="font-rounded text-xl font-bold text-mirai-text pc:text-2xl">
          気になるテーマから
        </h2>
        <p className="text-xs text-mirai-text-secondary pc:text-sm">
          テーマで横断検索できます
        </p>
      </div>

      <ul className="mt-4 grid grid-cols-4 gap-2 md:gap-2.5 pcl:grid-cols-8 pcl:gap-3">
        {themes.map((theme) => {
          const tone = TONE_STYLES[theme.tone];
          const { head, tail } = splitThemeLabel(theme.label);
          return (
            <li key={theme.slug}>
              <Link
                href={themeHref(theme) as Route}
                className={`${tone.tile} flex h-full flex-col items-center gap-1.5 rounded-2xl px-0.5 py-3 text-center hover:opacity-80 md:gap-2.5 md:rounded-[18px] md:px-1.5 md:py-5`}
              >
                <span
                  aria-hidden
                  className={`${tone.icon} font-rounded flex size-10 items-center justify-center rounded-[13px] text-lg font-bold pcl:size-14 pcl:rounded-[18px] pcl:text-[26px]`}
                >
                  {theme.kanji}
                </span>
                <span className="text-xs leading-[1.35] font-medium text-mirai-text md:whitespace-nowrap pcl:text-sm">
                  {head}
                  {tail && (
                    <>
                      <span className="hidden md:inline">・</span>
                      <span className="block md:inline">{tail}</span>
                    </>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={OTHER_KEYWORDS_HREF as Route}
        className="mt-2.5 flex min-h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-archive-accent text-sm font-medium text-archive-pill-text hover:bg-archive-surface-tint pc:mt-3.5 pc:min-h-[52px] pc:text-[15px]"
      >
        <Search className="size-4 pc:size-[18px]" aria-hidden />
        ほかのキーワードで探す
      </Link>
    </section>
  );
}
