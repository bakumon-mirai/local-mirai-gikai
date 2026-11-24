export type ClosedHeroFeatureKind =
  | "press-conference"
  | "committee"
  | "general-questions"
  | "none";

export type HeroFeatureFlags = {
  pressConferences: boolean;
  committeeMinutes: boolean;
  generalQuestions: boolean;
};

export type HeroFeatureAvailability = {
  hasPressConference: boolean;
  hasCommitteeMeetings: boolean;
  hasGeneralQuestions: boolean;
};

/**
 * 閉会中ヒーロー右側に表示する主役カードを優先順で決める。
 *
 * 1. 首長記者会見（有効＆データあり）
 * 2. 委員会議事録（有効＆データあり）
 * 3. 一般質問・代表質問（有効＆データあり）
 * 4. いずれも無し → 1カラム表示
 */
export function resolveClosedHeroFeature(
  features: HeroFeatureFlags,
  availability: HeroFeatureAvailability
): ClosedHeroFeatureKind {
  if (features.pressConferences && availability.hasPressConference) {
    return "press-conference";
  }
  if (features.committeeMinutes && availability.hasCommitteeMeetings) {
    return "committee";
  }
  if (features.generalQuestions && availability.hasGeneralQuestions) {
    return "general-questions";
  }
  return "none";
}

/**
 * 閉会中ヒーロー左側の説明文を、主役カードに合わせて返す。
 */
export function buildClosedHeroCopy(
  kind: ClosedHeroFeatureKind,
  context: {
    cityName: string;
    councilName: string;
    executiveTitle: string;
  }
): { line1: string; line2: string } {
  switch (kind) {
    case "press-conference":
      return {
        line1: `${context.executiveTitle}の記者会見は、定例会のあいだも随時ひらかれます。`,
        line2: `${context.cityName}がいま力を入れていることが、いちばん早くわかります。`,
      };
    case "committee":
      return {
        line1: `閉会中も、${context.councilName}では委員会ごとに話し合いが続いています。`,
        line2: "暮らしに関わるテーマの議論を、発言のやり取りから読めます。",
      };
    case "general-questions":
      return {
        line1: `${context.councilName}での一般質問・代表質問を、やさしく読めるサイトです。`,
        line2: "議員と行政のやり取りを、論点ごとにまとめています。",
      };
    case "none":
      return {
        line1: `${context.councilName}で話し合われていることを、やさしく読めるサイトです。`,
        line2: "定例会の議案や会議録を、テーマや会期ごとに探せます。",
      };
  }
}
