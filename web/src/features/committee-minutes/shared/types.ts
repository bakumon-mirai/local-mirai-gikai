/** 発言者の種別 */
export type SpeakerType = "chairperson" | "member" | "executive" | "unknown";

/** DB の committees.committee_type に対応する委員会区分 */
export type CommitteeType =
  | "standing"
  | "special"
  | "budget"
  | "audit"
  | "management";

/** 会議録の1発言（サーバー内部処理用） */
export type CommitteeSpeech = {
  voiceNo: number;
  speakerLabel: string | null;
  speakerType: SpeakerType;
  text: string;
  /** やさしい表現に直した本文（任意） */
  simpleText?: string;
};

/** 公開表示用の1発言（原文 text を含まない） */
export type PublicTranscriptSpeech = {
  voiceNo: number;
  speakerLabel: string | null;
  speakerType: SpeakerType;
  simpleText: string;
  isNameCall: boolean;
};

/** 会議内の1議題 */
export type CommitteeMeetingTopic = {
  id: string;
  topicOrder: number;
  title: string;
  summary: string | null;
  discussionSummary: string | null;
  speakers: { label: string }[];
  startVoiceNo: number | null;
  endVoiceNo: number | null;
};

/** 委員会の開催1回分（一覧用・発言なし） */
export type CommitteeMeetingSummary = {
  id: string;
  committeeName: string;
  committeeSlug: string;
  /** committees テーブルに紐づく場合の区分。未登録なら null */
  committeeType: CommitteeType | null;
  meetingDate: string;
  title: string;
  /** 会議録システム側のID（あれば。任意・非一意） */
  sourceId: string | null;
  sourceUrl: string | null;
  /** 会議全体の要約（AI生成・確認後に格納） */
  summary: string | null;
  topics: CommitteeMeetingTopic[];
  /** 発言数。committee_meetings.speech_count（生成列）から取る */
  speechCount: number | null;
};

/** 委員会の開催1回分（詳細用・発言つき） */
export type CommitteeMeetingDetail = CommitteeMeetingSummary & {
  speeches: CommitteeSpeech[];
};

/** 委員会（アーカイブの単位） */
export type CommitteeArchive = {
  slug: string;
  /** 現行の委員会名（最新の会議の開催時名称） */
  name: string;
  committeeType: CommitteeType | null;
  meetingCount: number;
  latestMeetingDate: string;
};
