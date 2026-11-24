import "server-only";
import { ArrowDown, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { routes } from "@/lib/routes";
import { toSafeExternalUrl } from "@/lib/utils/safe-url";
import { ChatTranscript } from "../../client/components/chat-transcript";
import type { CommitteeMeetingDetail } from "../../shared/types";
import { buildPublicTranscriptSections } from "../../shared/utils/build-transcript-sections";
import { formatJapaneseDate } from "../../shared/utils/format-japanese-date";
import { normalizeSpeeches } from "../../shared/utils/normalize-speeches";

type Props = {
  meeting: CommitteeMeetingDetail;
};

export function TranscriptView({ meeting }: Props) {
  const sections = buildPublicTranscriptSections(
    normalizeSpeeches(meeting.speeches),
    meeting.topics
  );
  const topicSections = sections.filter((s) => s.topic !== null);
  const safeSourceUrl = toSafeExternalUrl(meeting.sourceUrl);
  const sourceHref =
    safeSourceUrl ?? toSafeExternalUrl(siteConfig.councilBaseUrl);
  const sourceLabel = safeSourceUrl
    ? `${siteConfig.councilName} 公式会議録を見る`
    : `${siteConfig.councilName} 公式サイトを見る`;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={routes.committeeMeeting(meeting.committeeSlug, meeting.id)}
          className="inline-flex items-center gap-1 text-sm text-mirai-text-muted hover:text-mirai-text"
        >
          <ArrowLeft className="size-3.5" />
          会議のまとめへ戻る
        </Link>
        <h1 className="mt-3 text-xl sm:text-2xl font-bold text-mirai-text">
          わかりやすいやり取り
        </h1>
        <p className="mt-1 text-sm text-mirai-text-secondary">
          {meeting.committeeName}・{formatJapaneseDate(meeting.meetingDate)}{" "}
          開催
        </p>
      </div>

      {topicSections.length > 0 && (
        <nav className="rounded-2xl bg-gradient-to-br from-mirai-gradient-start to-mirai-gradient-end p-5">
          <h2 className="text-sm font-bold text-mirai-text">目次</h2>
          <ol className="mt-3 space-y-2">
            {topicSections.map((section) => (
              <li key={section.topic?.id}>
                <a
                  href={`#topic-${section.topic?.topicOrder}`}
                  className="inline-flex items-start gap-1.5 text-sm text-primary-accent hover:underline"
                >
                  <ArrowDown className="mt-1 w-3.5 h-3.5 shrink-0" />
                  <span>
                    {section.topic?.topicOrder}. {section.topic?.title}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <ChatTranscript sections={sections} />

      {sourceHref && (
        <div className="rounded-2xl border border-mirai-border bg-white p-5">
          <p className="text-xs text-mirai-text-secondary leading-relaxed">
            正確な発言記録・原文は公式会議録をご確認ください。
          </p>
          <a
            href={sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-accent hover:underline"
          >
            {sourceLabel}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
