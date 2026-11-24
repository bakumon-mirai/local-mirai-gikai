import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { PressConferenceDetail } from "@/features/press-conferences/client/components/press-conference-detail";
import { getPressConferenceBySlug } from "@/features/press-conferences/server/loaders/get-press-conference-by-slug";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!siteConfig.features.pressConferences) {
    return { title: "ページが見つかりません" };
  }

  const { slug } = await params;
  const pressConference = await getPressConferenceBySlug(slug);

  if (!pressConference) {
    return { title: "記者会見が見つかりません" };
  }

  return {
    title: `${pressConference.title} | ${siteConfig.siteName}`,
    description: `${siteConfig.cityName}${siteConfig.executiveTitle}の記者会見の内容をわかりやすくまとめています。`,
  };
}

export default async function PressConferenceDetailPage({ params }: Props) {
  if (!siteConfig.features.pressConferences) {
    notFound();
  }

  const { slug } = await params;
  const pressConference = await getPressConferenceBySlug(slug);

  if (!pressConference) {
    notFound();
  }

  return (
    <Container className="py-8 max-w-2xl">
      <div className="mb-4">
        <Link
          href={routes.pressConferences()}
          className="inline-flex items-center gap-1 text-sm text-mirai-text-muted hover:text-mirai-text"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {siteConfig.executiveTitle}記者会見の一覧へ戻る
        </Link>
      </div>
      <PressConferenceDetail pressConference={pressConference} />
    </Container>
  );
}
