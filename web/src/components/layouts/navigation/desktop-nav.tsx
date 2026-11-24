"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { cn } from "@/lib/utils";
import {
  type NavFeatures,
  buildPcNavItems,
  isNavItemActive,
} from "./nav-items";

type Props = {
  features?: NavFeatures;
  executiveTitle?: string;
};

/**
 * PC の横並びグローバルナビ（homeLayout: "archive" 用）。
 */
export function DesktopNav({
  features = siteConfig.features,
  executiveTitle = siteConfig.executiveTitle,
}: Props) {
  const pathname = usePathname();
  const items = buildPcNavItems(features, executiveTitle);

  return (
    <nav
      aria-label="グローバルナビゲーション"
      className="hidden pc:flex items-center gap-1"
    >
      {items.map((item) => {
        const isActive = isNavItemActive(item, pathname);
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "bg-archive-pill-bg text-archive-pill-text font-medium"
                : "text-mirai-text hover:bg-archive-surface-tint"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
