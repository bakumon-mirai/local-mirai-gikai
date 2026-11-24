import type { Metadata } from "next";
import { TopPreviewClient } from "./_components/top-preview-client";

export const metadata: Metadata = {
  title: "トップ構成・パーツ選択シミュレーター | Dev Preview",
};

export default function TopPreviewPage() {
  return <TopPreviewClient />;
}
