import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { CommitteesView } from "@/features/committee-minutes/server/components/committees-view";
import { getCommitteeArchives } from "@/features/committee-minutes/server/loaders/get-committee-archives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `委員会アーカイブ | ${siteConfig.siteName}`,
  description: `${siteConfig.councilName}の各委員会で話し合われた議題とやり取りを、会議ごとにわかりやすくまとめています。`,
};

export default async function CommitteesPage() {
  if (!siteConfig.features.committeeMinutes) {
    notFound();
  }

  const { archives, meetings } = await getCommitteeArchives();

  return (
    <Container className="py-8">
      <CommitteesView archives={archives} meetings={meetings} />
    </Container>
  );
}
