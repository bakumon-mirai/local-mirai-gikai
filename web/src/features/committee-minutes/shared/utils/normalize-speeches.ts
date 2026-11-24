import type { CommitteeSpeech, SpeakerType } from "../types";

// 「　　　令和八年四月二十八日（火曜日）」「　　　午　後　四　時　一　分　開　会」
// のような日時・開閉会の記録行（発言ではない）
const RECORD_LINE_RE =
  /^[\s　]*((令和|平成)[〇一二三四五六七八九十百元\s　]+年.+)$|^[\s　]*午[\s　]*[前後][\s　].*$/;

// 「鈴木企画課長。」のような、次の発言者を指名しただけの発言
const NAME_CALL_RE =
  /^[^\n]{1,30}(課長|部長|局長|次長|室長|理事|監|所長|委員|知事|副知事|市長|副市長|区長|副区長|町長|副町長|村長|副村長|教育長|本部長|書記)。$/;

// 発言者ラベルの末尾に来る役職語尾
const ROLE_SUFFIX_RE =
  /(委員長|副委員長|委員|知事|副知事|市長|副市長|区長|副区長|町長|副町長|村長|副村長|教育長|本部長|書記|課長|部長|局長|次長|室長|所長|理事|参事|監|議長|副議長)$/;

function classifySpeaker(label: string): SpeakerType {
  if (label.endsWith("委員長")) return "chairperson";
  if (label.endsWith("委員")) return "member";
  return "executive";
}

/**
 * 「◯佐藤\n花子委員」のように氏名が改行で分断されてラベルが不完全な発言を直す。
 */
function repairSplitLabel(speech: CommitteeSpeech): CommitteeSpeech {
  if (!speech.speakerLabel || ROLE_SUFFIX_RE.test(speech.speakerLabel)) {
    return speech;
  }
  const continued = speech.text.match(/^([^\s　]+)[　\s]+([\s\S]*)$/);
  if (!continued || !ROLE_SUFFIX_RE.test(continued[1])) {
    return speech;
  }
  const speakerLabel = speech.speakerLabel + continued[1];
  return {
    ...speech,
    speakerLabel,
    speakerType: classifySpeaker(speakerLabel),
    text: continued[2],
  };
}

/**
 * 表示用に発言一覧を整える。
 * - 日時・開閉会の記録行を取り除く
 * - 発言の途中に「◯氏名役職　…」で始まる別の発言が埋め込まれている場合は分割する
 * - 改行で分断された発言者ラベルを修復する
 * - 中身が空になったブロックは取り除く
 * - 複数発言へ分割された場合は simpleText の重複適用を避けるため先頭単一チャンク時のみ引き継ぐ
 */
export function normalizeSpeeches(
  speeches: CommitteeSpeech[]
): CommitteeSpeech[] {
  const result: CommitteeSpeech[] = [];

  for (const speech of speeches) {
    if (speech.speakerLabel) {
      result.push(repairSplitLabel(speech));
      continue;
    }

    const chunks: { label: string | null; lines: string[] }[] = [];
    for (const line of speech.text.split("\n")) {
      if (RECORD_LINE_RE.test(line)) continue;
      const marker = line.match(/^◯([^\s　]+)[　\s]*(.*)$/);
      if (marker) {
        chunks.push({ label: marker[1], lines: marker[2] ? [marker[2]] : [] });
      } else if (chunks.length === 0) {
        chunks.push({ label: null, lines: [line] });
      } else {
        chunks[chunks.length - 1].lines.push(line);
      }
    }

    const nonEmptyChunks = chunks
      .map((chunk) => ({
        label: chunk.label,
        text: chunk.lines.join("\n").trim(),
      }))
      .filter((chunk) => chunk.text.length > 0);

    for (const chunk of nonEmptyChunks) {
      result.push({
        voiceNo: speech.voiceNo,
        speakerLabel: chunk.label,
        speakerType: chunk.label ? classifySpeaker(chunk.label) : "unknown",
        text: chunk.text,
        // 1発言が複数人の発言に分割された場合、同じ simpleText を全発言へ複製しない
        simpleText: nonEmptyChunks.length === 1 ? speech.simpleText : undefined,
      });
    }
  }

  return result;
}

/** 次の発言者を指名しただけの発言か（チャットでは小さく中央表示する） */
export function isNameCallSpeech(speech: CommitteeSpeech): boolean {
  return speech.speakerType === "chairperson" && NAME_CALL_RE.test(speech.text);
}
