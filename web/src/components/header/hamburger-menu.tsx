"use client";

import { Menu } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { buildPcNavItems } from "@/components/layouts/navigation/nav-items";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { siteConfig } from "@/config/site.config";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { routes } from "@/lib/routes";
import { RubyToggle } from "@/lib/rubyful";

interface HamburgerMenuProps {
  sessions: CouncilSession[];
}

export function HamburgerMenu({ sessions }: HamburgerMenuProps) {
  const isArchiveLayout = siteConfig.homeLayout === "archive";
  const sessionsWithSlug = sessions.filter((s) => s.slug);
  const navItems = buildPcNavItems(
    siteConfig.features,
    siteConfig.executiveTitle
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="flex flex-col gap-3">
          {navItems.length > 1 && (
            <ul
              className={
                isArchiveLayout
                  ? "flex flex-col divide-y divide-mirai-border pc:hidden"
                  : "flex flex-col divide-y divide-mirai-border"
              }
            >
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    className="block px-1 py-2 text-sm font-medium text-mirai-text hover:text-primary-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <RubyToggle />

          {!isArchiveLayout &&
            siteConfig.features.bills &&
            sessionsWithSlug.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-mirai-text-muted mb-1">
                  議案一覧
                </p>
                <ul className="flex flex-col gap-1">
                  {sessionsWithSlug.map((session) => (
                    <li key={session.id}>
                      <Link
                        href={routes.sessionBills(session.slug ?? "") as Route}
                        className="block text-sm py-1 hover:underline"
                      >
                        {session.name}の議案一覧
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
