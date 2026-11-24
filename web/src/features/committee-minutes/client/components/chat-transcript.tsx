import type { PublicTranscriptSpeech } from "../../shared/types";
import type { PublicTranscriptSection } from "../../shared/utils/build-transcript-sections";
import { splitSpeechSegments } from "../../shared/utils/split-speech-segments";

type Props = {
  sections: PublicTranscriptSection[];
};

const SPEAKER_TYPE_LABEL: Record<
  PublicTranscriptSpeech["speakerType"],
  string
> = {
  chairperson: "委員長",
  member: "委員",
  executive: "行政の担当者",
  unknown: "記録",
};

/** 執行部（答える側）を右、委員・委員長（聞く側）を左に出す */
function isRightSide(speech: PublicTranscriptSpeech): boolean {
  return speech.speakerType === "executive";
}

function SpeechBubbles({ speech }: { speech: PublicTranscriptSpeech }) {
  if (speech.isNameCall) {
    return (
      <p className="text-center text-xs text-mirai-text-muted">
        ▷ {speech.simpleText}
      </p>
    );
  }

  const right = isRightSide(speech);
  const segments = splitSpeechSegments(speech.simpleText);
  const firstTextIndex = segments.findIndex((s) => s.kind === "text");

  return (
    <div className="space-y-2">
      {segments.map((segment, i) =>
        segment.kind === "interjection" ? (
          <p
            key={`${speech.voiceNo}-${i}`}
            className="text-center text-xs text-mirai-text-muted"
          >
            ―― {segment.content} ――
          </p>
        ) : (
          <div
            key={`${speech.voiceNo}-${i}`}
            className={`flex ${right ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] ${right ? "text-right" : ""}`}>
              {i === firstTextIndex && speech.speakerLabel && (
                <div
                  className={`mb-1 flex items-center gap-1.5 text-xs ${
                    right ? "justify-end" : ""
                  }`}
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      right
                        ? "bg-mirai-surface-grouped text-mirai-text-secondary"
                        : "bg-mirai-gradient-start text-primary-accent"
                    }`}
                  >
                    {SPEAKER_TYPE_LABEL[speech.speakerType]}
                  </span>
                  <span className="font-bold text-mirai-text">
                    {speech.speakerLabel}
                  </span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-left text-sm text-mirai-text-secondary leading-relaxed whitespace-pre-wrap border ${
                  right
                    ? "rounded-tr-sm bg-white border-mirai-border"
                    : "rounded-tl-sm bg-mirai-gradient-end border-mirai-gradient-start"
                }`}
              >
                {segment.content}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/**
 * 委員会のわかりやすいやり取り（サーバー側で原文 text を除去済みの simpleText のみ描画）。
 */
export function ChatTranscript({ sections }: Props) {
  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-mirai-border bg-white p-5 text-sm text-mirai-text-secondary leading-relaxed">
        この会議のわかりやすい表現は現在準備中です。詳しい発言内容は下記の公式会議録をご確認ください。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <section
          key={section.topic?.id ?? "opening"}
          id={section.topic ? `topic-${section.topic.topicOrder}` : undefined}
          className="scroll-mt-24 flex flex-col gap-4"
        >
          <h2 className="rounded-full bg-mirai-surface-grouped px-4 py-2 text-sm font-bold text-mirai-text leading-relaxed w-fit">
            {section.topic
              ? `${section.topic.topicOrder}. ${section.topic.title}`
              : "開会・はじめの手続き"}
          </h2>
          {section.speeches.map((speech, i) => (
            <SpeechBubbles key={`${speech.voiceNo}-${i}`} speech={speech} />
          ))}
        </section>
      ))}
    </div>
  );
}
