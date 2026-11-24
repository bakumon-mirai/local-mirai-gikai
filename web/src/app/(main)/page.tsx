import { Container } from "@/components/layouts/container";
import { About } from "@/components/top/about";
import { Hero } from "@/components/top/hero";
import { TeamMirai } from "@/components/top/team-mirai";
import { siteConfig } from "@/config/site.config";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDisclaimer } from "@/features/bills/client/components/bill-detail/bill-disclaimer";
import { BillsByTagSection } from "@/features/bills/server/components/bills-by-tag-section";
import { FeaturedBillSection } from "@/features/bills/server/components/featured-bill-section";
import { PreviousSessionSection } from "@/features/bills/server/components/previous-session-section";
import { loadHomeData } from "@/features/bills/server/loaders/load-home-data";
import type { BillWithContent } from "@/features/bills/shared/types";
import { HomeChatClient } from "@/features/chat/client/components/home-chat-client";
import { CurrentCouncilSession } from "@/features/council-sessions/client/components/current-council-session";
import { getAllPastSessions } from "@/features/council-sessions/server/loaders/get-all-past-sessions";
import { getCurrentCouncilSession } from "@/features/council-sessions/server/loaders/get-current-council-session";
import { getPressConferences } from "@/features/press-conferences/server/loaders/get-press-conferences";
import { loadTopHeroData } from "@/features/top-hero/server/loaders/load-top-hero-data";
import { ArchiveHomeView } from "@/features/top-sections/server/components/archive-home-view";
import { loadTopSectionsData } from "@/features/top-sections/server/loaders/load-top-sections-data";
import { getJapanTime } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

async function ArchiveHome() {
  const [heroData, sectionsData, pastSessions, pressConferences, difficulty] =
    await Promise.all([
      loadTopHeroData(),
      loadTopSectionsData(),
      getAllPastSessions(),
      siteConfig.features.pressConferences
        ? getPressConferences()
        : Promise.resolve([]),
      siteConfig.features.aiChat
        ? getDifficultyLevel()
        : Promise.resolve("normal" as const),
    ]);

  return (
    <>
      <ArchiveHomeView
        currentSession={heroData.currentSession}
        nextSession={heroData.nextSession}
        latestConference={heroData.latestConference}
        recentConferences={heroData.recentConferences}
        inSessionCounts={heroData.inSessionCounts}
        today={heroData.today}
        sessionSlots={sectionsData.sessionSlots}
        committeeMeetings={sectionsData.committeeMeetings}
        questions={sectionsData.questions}
        questionSessionName={sectionsData.questionSessionName}
        billSummary={sectionsData.billSummary}
        billsSessionSlug={sectionsData.billsSessionSlug}
        isBillSessionInSession={sectionsData.isBillSessionInSession}
        pastSessions={pastSessions}
        pressConferences={pressConferences}
      />

      <Container>
        <About />
        <TeamMirai />
        <BillDisclaimer />
      </Container>

      {siteConfig.features.aiChat && (
        <HomeChatClient currentDifficulty={difficulty} bills={[]} />
      )}
    </>
  );
}

async function BillsHome() {
  const { billsByTag, featuredBills, previousSessionData, activeSessionSlug } =
    await loadHomeData();

  const [currentSession, currentDifficulty] = await Promise.all([
    getCurrentCouncilSession(getJapanTime()),
    getDifficultyLevel(),
  ]);

  const featuredBillIds = new Set(featuredBills.map((b) => b.id));

  const toBillChatContext = (bill: BillWithContent) => {
    return {
      name: `${bill.bill_content?.title}（${bill.name}）`,
      summary: bill.bill_content?.summary,
      tags: bill.tags?.map((tag) => tag.label) || [],
      isFeatured: featuredBills.some((b) => b.id === bill.id),
    };
  };

  return (
    <>
      <Hero />

      <CurrentCouncilSession session={currentSession} />

      <Container className="">
        <div className="py-10">
          <main className="flex flex-col gap-16">
            <FeaturedBillSection bills={featuredBills} />

            <BillsByTagSection
              billsByTag={billsByTag}
              featuredBillIds={featuredBillIds}
              sessionSlug={activeSessionSlug}
            />
          </main>
        </div>
      </Container>

      {previousSessionData && (
        <div className="bg-mirai-surface-muted py-10">
          <Container>
            <PreviousSessionSection
              session={previousSessionData.session}
              bills={previousSessionData.bills}
              totalBillCount={previousSessionData.totalBillCount}
            />
          </Container>
        </div>
      )}

      <Container>
        <About />
        <TeamMirai />
        <BillDisclaimer />
      </Container>

      {siteConfig.features.aiChat && (
        <HomeChatClient
          currentDifficulty={currentDifficulty}
          bills={billsByTag
            .flatMap((x) => x.bills)
            .concat(featuredBills)
            .map(toBillChatContext)}
        />
      )}
    </>
  );
}

export default async function Home() {
  if (siteConfig.homeLayout === "archive") {
    return <ArchiveHome />;
  }
  return <BillsHome />;
}
