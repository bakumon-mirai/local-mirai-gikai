import { summarizeBillStatuses } from "@/features/bills/shared/utils/summarize-bill-statuses";
import type { CommitteeMeetingSummary } from "@/features/committee-minutes/shared/types";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import type { GeneralQuestion } from "@/features/general-questions/shared/types";
import type {
  PressConference,
  PressConferenceRef,
  PressConferenceSummary,
} from "@/features/press-conferences/shared/types";

export type MunicipalityPresetKey = "city" | "town" | "pref";

export type MunicipalityPreset = {
  key: MunicipalityPresetKey;
  label: string;
  cityName: string;
  councilName: string;
  executiveTitle: string;
  governmentTerm: string;
  regularSessionMonths: readonly number[];
};

export const MUNICIPALITY_PRESETS: Record<
  MunicipalityPresetKey,
  MunicipalityPreset
> = {
  city: {
    key: "city",
    label: "市（市長・市政・3/6/9/12月）",
    cityName: "サンプル市",
    councilName: "サンプル市議会",
    executiveTitle: "市長",
    governmentTerm: "市政",
    regularSessionMonths: [3, 6, 9, 12],
  },
  town: {
    key: "town",
    label: "町（町長・町政・3/6/9/12月）",
    cityName: "サンプル町",
    councilName: "サンプル町議会",
    executiveTitle: "町長",
    governmentTerm: "町政",
    regularSessionMonths: [3, 6, 9, 12],
  },
  pref: {
    key: "pref",
    label: "県（知事・県政・2/6/9/12月）",
    cityName: "サンプル県",
    councilName: "サンプル県議会",
    executiveTitle: "知事",
    governmentTerm: "県政",
    regularSessionMonths: [2, 6, 9, 12],
  },
};

export function createSampleSessions(
  months: readonly number[]
): CouncilSession[] {
  const firstMonth = months[0] ?? 3;
  const firstMonthPadded = String(firstMonth).padStart(2, "0");

  return [
    {
      id: "sample-session-1",
      name: `令和8年 ${firstMonth}月定例会`,
      slug: `r8-${firstMonthPadded}`,
      council_url: null,
      start_date: `2026-${firstMonthPadded}-01`,
      end_date: `2026-${firstMonthPadded}-24`,
      is_active: false,
      schedule_milestones: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "sample-session-2",
      name: "令和8年 6月定例会",
      slug: "r8-06",
      council_url: null,
      start_date: "2026-06-04",
      end_date: "2026-06-25",
      is_active: false,
      schedule_milestones: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "sample-session-3",
      name: "令和8年 9月定例会",
      slug: "r8-09",
      council_url: null,
      start_date: "2026-09-08",
      end_date: "2026-10-02",
      is_active: true,
      schedule_milestones: {
        representativeQuestions: { from: "2026-09-14", to: "2026-09-15" },
        generalQuestions: { from: "2026-09-16", to: "2026-09-18" },
        standingCommittees: { from: "2026-09-24", to: "2026-09-29" },
        billVote: "2026-10-02",
      },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "sample-session-4",
      name: "令和8年 12月定例会",
      slug: "r8-12",
      council_url: null,
      start_date: "2026-12-01",
      end_date: "2026-12-18",
      is_active: false,
      schedule_milestones: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ];
}

export const SAMPLE_LATEST_CONFERENCE: PressConferenceSummary = {
  id: "pc-1",
  slug: "2026-08-25",
  heldAt: "2026-08-25",
  topics: [
    { id: "t1", title: "新年度の子育て世帯向け給食費支援について" },
    { id: "t2", title: "秋の防災訓練と避難所備蓄の見直しについて" },
    { id: "t3", title: "地域公共交通（コミュニティバス）の実証運行について" },
  ],
};

export const SAMPLE_RECENT_CONFERENCES: PressConferenceRef[] = [
  { id: "pc-2", slug: "2026-08-10", heldAt: "2026-08-10" },
  { id: "pc-3", slug: "2026-07-24", heldAt: "2026-07-24" },
  { id: "pc-4", slug: "2026-07-08", heldAt: "2026-07-08" },
];

export const SAMPLE_PRESS_CONFERENCES: PressConference[] = [
  {
    id: "pc-1",
    slug: "2026-08-25",
    title: "定例記者会見（8月25日）",
    heldAt: "2026-08-25",
    youtubeUrl: null,
    status: "published",
    items: [
      {
        id: "t1",
        itemType: "announcement",
        orderIndex: 1,
        title: "新年度の子育て世帯向け給食費支援について",
        summary: "小中学校の給食費補助を拡充する方針を説明しました。",
        detail: null,
        materialUrl: null,
        turns: [],
      },
    ],
  },
];

export const SAMPLE_COMMITTEES: CommitteeMeetingSummary[] = [
  {
    id: "cm-1",
    committeeName: "総務企画委員会",
    committeeSlug: "somu",
    committeeType: "standing",
    meetingDate: "2026-08-18",
    title: "デジタル窓口と防災情報発信の拡充について",
    summary:
      "オンライン申請の対象手続き拡大と、高齢者向けスマホ相談窓口の設置状況について質疑が行われました。",
    sourceId: null,
    sourceUrl: null,
    speechCount: 24,
    topics: [
      {
        id: "cmt-1",
        topicOrder: 1,
        title: "オンライン申請の拡充と高齢者サポート体制",
        summary: null,
        discussionSummary: null,
        speakers: [],
        startVoiceNo: null,
        endVoiceNo: null,
      },
      {
        id: "cmt-2",
        topicOrder: 2,
        title: "防災無線・LINE通知の連携改善",
        summary: null,
        discussionSummary: null,
        speakers: [],
        startVoiceNo: null,
        endVoiceNo: null,
      },
    ],
  },
  {
    id: "cm-2",
    committeeName: "文教厚生委員会",
    committeeSlug: "bunkyo",
    committeeType: "standing",
    meetingDate: "2026-08-12",
    title: "小中学校の空調設備更新と地域医療の確保",
    summary:
      "体育館への空調導入スケジュールと、休日夜間診療所の運営体制について意見が交わされました。",
    sourceId: null,
    sourceUrl: null,
    speechCount: 19,
    topics: [
      {
        id: "cmt-3",
        topicOrder: 1,
        title: "学校体育館への空調設備導入スケジュール",
        summary: null,
        discussionSummary: null,
        speakers: [],
        startVoiceNo: null,
        endVoiceNo: null,
      },
    ],
  },
];

export const SAMPLE_QUESTIONS: GeneralQuestion[] = [
  {
    id: "gq-1",
    council_session_id: "sample-session-2",
    questioner_name: "山田 太郎",
    questioner_party: "みらい会派",
    questioner_number: 1,
    question_type: "general",
    session_day: 1,
    question_order: 1,
    summary:
      "通学路の安全対策と放課後児童クラブの定員拡充について質問しました。",
    topics: [
      {
        title: "通学路のガードレール整備と放課後児童クラブの待機児童解消",
        question_summary: "危険箇所の点検結果と整備予定時期を確認しました。",
        answer_summary:
          "今年度内に優先3路線から順次整備を進めると答弁しました。",
        answerer_role: "教育長",
        answerer_name: "佐藤 花子",
      },
    ],
    raw_text: null,
    answer_raw_text: null,
    source_url: null,
    publish_status: "published",
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
  {
    id: "gq-2",
    council_session_id: "sample-session-2",
    questioner_name: "鈴木 一郎",
    questioner_party: "市民クラブ",
    questioner_number: 2,
    question_type: "general",
    session_day: 1,
    question_order: 2,
    summary: "高齢者の移動支援とデマンド交通の利用促進について質問しました。",
    topics: [
      {
        title: "高齢者向けデマンド交通の予約方法改善と運行エリア拡大",
        question_summary:
          "電話予約の負担軽減と医療機関への直通便を提案しました。",
        answer_summary: "秋からの実証運行で予約手順を見直すと答弁しました。",
        answerer_role: "企画部長",
        answerer_name: "高橋 健",
      },
    ],
    raw_text: null,
    answer_raw_text: null,
    source_url: null,
    publish_status: "published",
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  },
  {
    id: "gq-3",
    council_session_id: "sample-session-2",
    questioner_name: "田中 美咲",
    questioner_party: "無所属",
    questioner_number: 3,
    question_type: "representative",
    session_day: 2,
    question_order: 1,
    summary: "防災備蓄の分散配置と避難所のバリアフリー化について質問しました。",
    topics: [
      {
        title: "地区ごとの防災備蓄見直しと福祉避難所の開設手順",
        question_summary: "要配慮者向け物資の備蓄状況を確認しました。",
        answer_summary:
          "全地区センターでの備蓄品目を今年度中に更新すると答弁しました。",
        answerer_role: "危機管理監",
        answerer_name: "伊藤 誠",
      },
    ],
    raw_text: null,
    answer_raw_text: null,
    source_url: null,
    publish_status: "published",
    created_at: "2026-06-21T00:00:00Z",
    updated_at: "2026-06-21T00:00:00Z",
  },
];

export const SAMPLE_BILL_SUMMARY_CLOSED = summarizeBillStatuses([
  { status: "approved", publishStatus: "published" },
  { status: "approved", publishStatus: "published" },
  { status: "approved", publishStatus: "published" },
  { status: "approved", publishStatus: "published" },
  { status: "approved", publishStatus: "published" },
  { status: "rejected", publishStatus: "published" },
]);

export const SAMPLE_BILL_SUMMARY_IN_SESSION = summarizeBillStatuses([
  { status: "submitted", publishStatus: "published" },
  { status: "in_committee", publishStatus: "published" },
  { status: "in_committee", publishStatus: "coming_soon" },
  { status: "plenary_session", publishStatus: "published" },
  { status: "approved", publishStatus: "published" },
]);
