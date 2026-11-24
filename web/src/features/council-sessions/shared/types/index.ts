export type CouncilSession = {
  id: string;
  name: string;
  slug: string | null;
  council_url: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  /** 会期の節目。会期日程ページ未取得なら null */
  schedule_milestones: SessionMilestones | null;
  created_at: string;
  updated_at: string;
};

/** 日付の範囲。1日だけなら from と to が同じ */
export type DateRange = {
  from: string;
  to: string;
};

/**
 * 会期の節目。トップの「会期の流れ」に出す。
 *
 * `billVote`（議案採決日）は `end_date`（閉会日）と別の日になりうる。
 * 臨時会は質問を行わないことがあり、各項目は欠けうる。
 */
export type SessionMilestones = {
  representativeQuestions: DateRange | null;
  generalQuestions: DateRange | null;
  standingCommittees: DateRange | null;
  billVote: string | null;
};

/** 過去定例会一覧用（議案・一般質問それぞれの公開有無を保持） */
export type PastCouncilSession = CouncilSession & {
  hasBills?: boolean;
  hasQuestions?: boolean;
};
