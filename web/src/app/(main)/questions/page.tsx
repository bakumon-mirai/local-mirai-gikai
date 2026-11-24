import { notFound, redirect } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { findLatestSessionWithPublishedQuestions } from "@/features/general-questions/server/repositories/general-questions-repository";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

/**
 * 質問が公開されている最新会期の一般質問一覧へリダイレクトする。
 */
export default async function QuestionsPage() {
  if (!siteConfig.features.generalQuestions) {
    notFound();
  }

  const session = await findLatestSessionWithPublishedQuestions();

  if (!session?.slug) {
    notFound();
  }

  redirect(routes.sessionQuestions(session.slug));
}
