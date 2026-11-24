import { describe, expect, it } from "vitest";
import { parseGeneralQuestionTopics } from "./parse-topics";

describe("parseGeneralQuestionTopics", () => {
  it("正常なトピック配列をそのまま変換する", () => {
    const raw = [
      {
        title: "防災対策の強化",
        question_summary: "避難所の備蓄状況について質問",
        answer_summary: "今年度中に備蓄を拡充する",
        answerer_role: "市長",
        answerer_name: "山田太郎",
        block_summary: "備蓄を段階的に拡充予定",
      },
    ];

    expect(parseGeneralQuestionTopics(raw)).toEqual(raw);
  });

  it("配列以外の入力は空配列を返す", () => {
    expect(parseGeneralQuestionTopics(null)).toEqual([]);
    expect(parseGeneralQuestionTopics(undefined)).toEqual([]);
    expect(parseGeneralQuestionTopics("invalid")).toEqual([]);
    expect(parseGeneralQuestionTopics({ title: "not-array" })).toEqual([]);
  });

  it("null・プリミティブ・title欠損などの不正要素を除外し正常要素だけ残す", () => {
    const raw = [
      null,
      undefined,
      "string-item",
      123,
      [],
      {},
      { title: 123 },
      { title: "   " },
      {
        title: "子育て支援",
        question_summary: "保育所の待機児童対策",
        answer_summary: "定員を増やす方針",
        answerer_role: "福祉部長",
        answerer_name: "佐藤花子",
      },
    ];

    expect(parseGeneralQuestionTopics(raw)).toEqual([
      {
        title: "子育て支援",
        question_summary: "保育所の待機児童対策",
        answer_summary: "定員を増やす方針",
        answerer_role: "福祉部長",
        answerer_name: "佐藤花子",
      },
    ]);
  });

  it("文字列フィールドが欠損または非文字列なら空文字にフォールバックする", () => {
    const raw = [
      {
        title: "交通インフラ",
        question_summary: null,
        answer_summary: 42,
        answerer_role: undefined,
        answerer_name: ["配列"],
        block_summary: null,
      },
    ];

    expect(parseGeneralQuestionTopics(raw)).toEqual([
      {
        title: "交通インフラ",
        question_summary: "",
        answer_summary: "",
        answerer_role: "",
        answerer_name: "",
        block_summary: null,
      },
    ]);
  });

  it("block_summary が文字列でも null でもない場合は省略する", () => {
    const raw = [
      {
        title: "環境政策",
        block_summary: 999,
      },
    ];

    const parsed = parseGeneralQuestionTopics(raw);
    expect(parsed).toHaveLength(1);
    expect("block_summary" in parsed[0]).toBe(false);
  });
});
