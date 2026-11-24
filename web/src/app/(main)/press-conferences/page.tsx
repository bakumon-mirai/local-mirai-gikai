import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { PressConferenceList } from "@/features/press-conferences/client/components/press-conference-list";
import { getPressConferences } from "@/features/press-conferences/server/loaders/get-press-conferences";

export const metadata: Metadata = {
  title: `${siteConfig.executiveTitle}記者会見 | ${siteConfig.siteName}`,
  description: `${siteConfig.cityName}${siteConfig.executiveTitle}の定例記者会見の内容をわかりやすくまとめています。`,
};

export default async function PressConferencesPage() {
  if (!siteConfig.features.pressConferences) {
    notFound();
  }

  const pressConferences = await getPressConferences();

  return (
    <Container className="py-8 max-w-2xl">
      <PressConferenceList pressConferences={pressConferences} />
    </Container>
  );
}
