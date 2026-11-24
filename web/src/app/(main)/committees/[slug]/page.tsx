import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { CommitteeArchiveView } from "@/features/committee-minutes/server/components/committee-archive-view";
import { getCommitteeMeetingsBySlug } from "@/features/committee-minutes/server/loaders/get-committee-meetings-by-slug";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!siteConfig.features.committeeMinutes) {
    return { title: "ページが見つかりません" };
  }

  const { slug } = await params;
  const meetings = await getCommitteeMeetingsBySlug(slug);
  const name = meetings[0]?.committeeName;

  if (!name) {
    return { title: "委員会が見つかりません" };
  }

  return {
    title: `${name} | ${siteConfig.siteName}`,
    description: `${siteConfig.councilName} ${name} の議事録アーカイブです。`,
  };
}

export default async function CommitteeDetailPage({ params }: Props) {
  if (!siteConfig.features.committeeMinutes) {
    notFound();
  }

  const { slug } = await params;
  const meetings = await getCommitteeMeetingsBySlug(slug);

  if (meetings.length === 0) {
    notFound();
  }

  return (
    <Container className="py-8">
      <CommitteeArchiveView meetings={meetings} />
    </Container>
  );
}
