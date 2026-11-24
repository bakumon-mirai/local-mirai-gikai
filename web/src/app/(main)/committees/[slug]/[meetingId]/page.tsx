import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { MeetingDetailView } from "@/features/committee-minutes/server/components/meeting-detail-view";
import { getCommitteeMeeting } from "@/features/committee-minutes/server/loaders/get-committee-meeting";

type Props = {
  params: Promise<{ slug: string; meetingId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!siteConfig.features.committeeMinutes) {
    return { title: "ページが見つかりません" };
  }

  const { slug, meetingId } = await params;
  const meeting = await getCommitteeMeeting(meetingId);

  if (!meeting || meeting.committeeSlug !== slug) {
    return { title: "会議が見つかりません" };
  }

  return {
    title: `${meeting.committeeName}（${meeting.meetingDate}） | ${siteConfig.siteName}`,
    description: meeting.summary ?? undefined,
  };
}

export default async function CommitteeMeetingPage({ params }: Props) {
  if (!siteConfig.features.committeeMinutes) {
    notFound();
  }

  const { slug, meetingId } = await params;
  const meeting = await getCommitteeMeeting(meetingId);
  if (!meeting || meeting.committeeSlug !== slug) {
    notFound();
  }

  return (
    <Container className="py-8">
      <MeetingDetailView meeting={meeting} />
    </Container>
  );
}
