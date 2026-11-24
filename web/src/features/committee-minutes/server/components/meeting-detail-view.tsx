import "server-only";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  FileText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { routes } from "@/lib/routes";
import { toSafeExternalUrl } from "@/lib/utils/safe-url";
import type { CommitteeMeetingDetail } from "../../shared/types";
import { buildPublicTranscriptSections } from "../../shared/utils/build-transcript-sections";
import { getCommitteeTypeLabel } from "../../shared/utils/committee-type";
import { formatJapaneseDate } from "../../shared/utils/format-japanese-date";
import { normalizeSpeeches } from "../../shared/utils/normalize-speeches";

type Props = {
  meeting: CommitteeMeetingDetail;
};

export function MeetingDetailView({ meeting }: Props) {
  const transcriptPath = routes.committeeMeetingTranscript(
    meeting.committeeSlug,
    meeting.id
  );
  const publicSections = buildPublicTranscriptSections(
    normalizeSpeeches(meeting.speeches),
    meeting.topics
  );
  const simpleSpeechCount = publicSections.reduce(
    (sum, s) => sum + s.speeches.length,
    0
  );
  const hasSimpleTranscript = simpleSpeechCount > 0;
  const linkedTopicOrders = new Set(
    publicSections
      .map((s) => s.topic?.topicOrder)
      .filter((order): order is number => order != null)
  );
  const safeSourceUrl = toSafeExternalUrl(meeting.sourceUrl);
  const sourceHref =
    safeSourceUrl ?? toSafeExternalUrl(siteConfig.councilBaseUrl);
  const sourceLabel = safeSourceUrl
    ? `${siteConfig.councilName} 公式会議録を見る`
    : `${siteConfig.councilName} 公式サイトを見る`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href={routes.committeeDetail(meeting.committeeSlug)}
          className="inline-flex items-center gap-1 text-sm text-mirai-text-muted hover:text-mirai-text"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {meeting.committeeName}の一覧へ戻る
        </Link>
        <div className="rounded-2xl bg-gradient-to-br from-mirai-gradient-start to-mirai-gradient-end px-6 py-6 flex flex-col gap-2">
          <span className="text-xs font-medium text-primary-accent bg-white/70 rounded-full px-3 py-1 w-fit">
            {getCommitteeTypeLabel(
              meeting.committeeType,
              meeting.committeeName,
              meeting.committeeSlug
            )}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-mirai-text leading-snug">
            {meeting.committeeName}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-mirai-text-secondary">
            <CalendarDays className="w-4 h-4" />
            {formatJapaneseDate(meeting.meetingDate)} 開催
          </p>
          {meeting.summary && (
            <p className="mt-1 text-sm text-mirai-text-secondary leading-relaxed">
              {meeting.summary}
            </p>
          )}
        </div>
      </div>

      {meeting.topics.length === 0 ? (
        <div className="rounded-2xl border border-mirai-border bg-white p-5">
          <p className="text-sm text-mirai-text-secondary leading-relaxed">
            この会議では、委員長の選出など会議を運営するための手続きが行われました。くわしい内容は公式会議録をご覧ください。
          </p>
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-mirai-text">
            この日に話し合われた議題
          </h2>
          <ol className="flex flex-col gap-4">
            {meeting.topics.map((topic) => (
              <li
                key={topic.id}
                className="rounded-2xl border-l-4 border-primary bg-white shadow-sm px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-mirai-gradient-start text-primary-accent text-xs font-bold flex items-center justify-center">
                    {topic.topicOrder}
                  </span>
                  <h3 className="font-bold text-mirai-text leading-relaxed">
                    {topic.title}
                  </h3>
                </div>
                {topic.summary && (
                  <p className="mt-2 pl-9 text-sm text-mirai-text-secondary leading-relaxed">
                    {topic.summary}
                  </p>
                )}
                {topic.speakers.length > 0 && (
                  <div className="mt-3 pl-9 flex items-start gap-1.5">
                    <Users className="mt-1 w-3.5 h-3.5 shrink-0 text-mirai-text-muted" />
                    <div className="flex flex-wrap gap-1.5">
                      {topic.speakers.map((s) => (
                        <span
                          key={s.label}
                          className="rounded-full bg-mirai-surface-grouped px-2.5 py-0.5 text-xs text-mirai-text-secondary"
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {linkedTopicOrders.has(topic.topicOrder) && (
                  <div className="mt-3 pl-9">
                    <Link
                      href={`${transcriptPath}#topic-${topic.topicOrder}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-accent hover:underline"
                    >
                      わかりやすいやり取りを読む
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {hasSimpleTranscript && (
        <div className="rounded-2xl border border-mirai-border bg-white p-5">
          <Link
            href={transcriptPath}
            className="inline-flex items-center gap-2 font-bold text-primary-accent hover:underline"
          >
            <FileText className="w-4 h-4" />
            わかりやすいやり取りを読む（{simpleSpeechCount}発言）
          </Link>
          <p className="mt-2 text-xs text-mirai-text-muted">
            チャット形式で会議のやり取りをわかりやすく読めます。
          </p>
        </div>
      )}

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
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
