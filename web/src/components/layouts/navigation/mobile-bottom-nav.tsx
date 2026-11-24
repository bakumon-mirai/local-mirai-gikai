"use client";

import { Home, Landmark, Megaphone, Search, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { isInterviewSection } from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";
import {
  type MobileNavIcon,
  type NavFeatures,
  buildMobileNavItems,
  isNavItemActive,
} from "./nav-items";

const ICONS: Record<MobileNavIcon, typeof Home> = {
  home: Home,
  megaphone: Megaphone,
  users: Users,
  landmark: Landmark,
  search: Search,
};

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

type Props = {
  features?: NavFeatures;
};

/**
 * スマホのボトムナビ（homeLayout: "archive" 用）。
 */
export function MobileBottomNav({ features = siteConfig.features }: Props) {
  const pathname = usePathname();

  if (isInterviewSection(pathname)) return null;

  const items = buildMobileNavItems(features);
  if (items.length <= 1) return null;

  const gridClass = GRID_COLS[items.length] ?? "grid-cols-5";

  return (
    <>
      <div
        aria-hidden
        className="h-[calc(72px+env(safe-area-inset-bottom))] pc:hidden"
      />
      <nav
        aria-label="グローバルナビゲーション"
        className={cn(
          "pc:hidden fixed bottom-0 left-0 right-0 z-40 grid border-t border-archive-divider bg-white pb-[env(safe-area-inset-bottom)]",
          gridClass
        )}
      >
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-[72px] flex-col items-center justify-center gap-1 transition-colors",
                isActive
                  ? "text-archive-pill-text"
                  : "text-mirai-text-secondary"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  isActive && "bg-archive-pill-bg"
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className={cn("text-xs", isActive && "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
