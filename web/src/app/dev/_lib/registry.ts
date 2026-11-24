type PreviewItem = {
  path: string;
  label: string;
  description: string;
};

type PreviewGroup = {
  name: string;
  items: PreviewItem[];
};

export const previewRegistry: PreviewGroup[] = [
  {
    name: "Top Layout & Parts",
    items: [
      {
        path: "/dev/top-preview",
        label: "トップ構成・パーツ選択シミュレーター",
        description:
          "bills / archive 型の切替と各パーツ ON/OFF をブラウザ上で確認し、siteConfig 設定を生成できます",
      },
    ],
  },
  {
    name: "UI Primitives",
    items: [
      {
        path: "/dev/ui",
        label: "UI Components",
        description: "Button, Badge, Card, SpeechBubble",
      },
    ],
  },
  {
    name: "Bills",
    items: [
      {
        path: "/dev/features/bills/bill-card",
        label: "BillCard",
        description: "議案カードコンポーネント",
      },
      {
        path: "/dev/features/bills/bill-status-badge",
        label: "BillStatusBadge",
        description: "議案ステータスバッジ全バリアント",
      },
    ],
  },
  {
    name: "Interview",
    items: [
      {
        path: "/dev/features/interview/consent-modal",
        label: "ConsentModal",
        description: "AIインタビュー同意モーダル",
      },
      {
        path: "/dev/features/interview/public-consent-modal",
        label: "PublicConsentModal",
        description: "インタビュー公開設定モーダル",
      },
      {
        path: "/dev/features/interview/rating-widget",
        label: "InterviewRatingWidget",
        description: "満足度評価ウィジェット（星評価＋フィードバック）",
      },
    ],
  },
];
