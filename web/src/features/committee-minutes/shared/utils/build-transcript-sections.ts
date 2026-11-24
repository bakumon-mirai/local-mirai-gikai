import type {
  CommitteeMeetingTopic,
  CommitteeSpeech,
  PublicTranscriptSpeech,
} from "../types";
import { isNameCallSpeech } from "./normalize-speeches";

/** 会議のやり取りページの1セクション（議題見出し＋その範囲の発言） */
export type TranscriptSection = {
  /** 対応する議題。冒頭の開会手続き等はnull */
  topic: CommitteeMeetingTopic | null;
  speeches: CommitteeSpeech[];
};

/** 公開表示用の1セクション（原文 text を含まない simpleText のみ） */
export type PublicTranscriptSection = {
  topic: CommitteeMeetingTopic | null;
  speeches: PublicTranscriptSpeech[];
};

/**
 * 発言一覧を議題の発言範囲（startVoiceNo〜endVoiceNo）でセクション分割する。
 */
export function buildTranscriptSections(
  speeches: CommitteeSpeech[],
  topics: CommitteeMeetingTopic[]
): TranscriptSection[] {
  const ranged = topics
    .filter((t) => t.startVoiceNo != null)
    .sort((a, b) => a.topicOrder - b.topicOrder);

  if (ranged.length === 0) {
    return speeches.length > 0 ? [{ topic: null, speeches }] : [];
  }

  const sections: TranscriptSection[] = [];
  const firstStart = ranged[0].startVoiceNo as number;
  const opening = speeches.filter((s) => s.voiceNo < firstStart);
  if (opening.length > 0) {
    sections.push({ topic: null, speeches: opening });
  }

  ranged.forEach((topic, i) => {
    const start = topic.startVoiceNo as number;
    const nextStart =
      i + 1 < ranged.length
        ? (ranged[i + 1].startVoiceNo as number)
        : Number.POSITIVE_INFINITY;
    sections.push({
      topic,
      speeches: speeches.filter(
        (s) => s.voiceNo >= start && s.voiceNo < nextStart
      ),
    });
  });

  return sections;
}

/**
 * 公開ページ用に原文 `text` を完全に除去し、`simpleText` が存在する発言のみを
 * セクション単位で組み立てる。
 */
export function buildPublicTranscriptSections(
  speeches: CommitteeSpeech[],
  topics: CommitteeMeetingTopic[]
): PublicTranscriptSection[] {
  return buildTranscriptSections(speeches, topics)
    .map((section) => ({
      topic: section.topic,
      speeches: section.speeches
        .filter((s) => Boolean(s.simpleText?.trim()))
        .map((s) => ({
          voiceNo: s.voiceNo,
          speakerLabel: s.speakerLabel,
          speakerType: s.speakerType,
          simpleText: (s.simpleText ?? "").trim(),
          isNameCall: isNameCallSpeech(s),
        })),
    }))
    .filter((section) => section.speeches.length > 0);
}
