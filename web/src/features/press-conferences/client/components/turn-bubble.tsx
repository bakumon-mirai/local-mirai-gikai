"use client";

import { siteConfig } from "@/config/site.config";
import type { PressConferenceTurn } from "../../shared/types";

type Props = {
  turn: PressConferenceTurn;
};

export function TurnBubble({ turn }: Props) {
  const isReporter = turn.speaker === "reporter";
  const isSecretariat = turn.speaker === "secretariat";
  // 首長・事務局は自治体側として右寄せ・同じ配色を共有し、記者は左寄せにする
  const isGovernmentSide = !isReporter;

  const executiveLabel = siteConfig.executiveName
    ? `${siteConfig.executiveName}${siteConfig.executiveTitle}`
    : siteConfig.executiveTitle;

  const label = isReporter
    ? "記者"
    : isSecretariat
      ? turn.speakerName || "担当課"
      : turn.speakerName || executiveLabel;
  const avatar = isReporter ? "🎤" : isSecretariat ? "📋" : "🏛️";

  return (
    <div
      className={`flex gap-3 ${isGovernmentSide ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="shrink-0 mt-1">
        <div
          className={`w-9 h-9 rounded-full flex flex-col items-center justify-center text-[10px] font-bold leading-tight shadow-sm ${
            isGovernmentSide
              ? "bg-gradient-to-br from-mirai-gradient-start to-primary text-primary-accent"
              : "bg-mirai-surface-warm text-mirai-text-muted border border-mirai-border"
          }`}
        >
          <span className="text-base leading-none">{avatar}</span>
        </div>
      </div>
      <div
        className={`flex flex-col gap-1 max-w-[85%] ${isGovernmentSide ? "items-end" : "items-start"}`}
      >
        <span className="text-xs font-medium text-mirai-text-muted px-1">
          {label}
        </span>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed text-mirai-text shadow-sm ${
            isGovernmentSide
              ? "bg-gradient-to-br from-mirai-gradient-end to-mirai-gradient-start rounded-tr-sm"
              : "bg-white border border-mirai-border rounded-tl-sm"
          }`}
        >
          {turn.content}
        </div>
      </div>
    </div>
  );
}
