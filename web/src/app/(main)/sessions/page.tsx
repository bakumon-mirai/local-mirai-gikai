import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { SessionList } from "@/features/council-sessions/server/components/session-list";
import { getAllPastSessions } from "@/features/council-sessions/server/loaders/get-all-past-sessions";

export const metadata: Metadata = {
  title: `過去の議会一覧 | ${siteConfig.siteName}`,
  description: `${siteConfig.councilName}で過去に開催された定例会の一覧です。`,
};

export default async function SessionsPage() {
  if (!siteConfig.features.bills && !siteConfig.features.generalQuestions) {
    notFound();
  }

  const sessions = await getAllPastSessions();

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-mirai-text">過去の議会一覧</h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          {siteConfig.councilName}
          で過去に開催された定例会をご覧いただけます。
        </p>
      </div>

      <SessionList sessions={sessions} />
    </Container>
  );
}
