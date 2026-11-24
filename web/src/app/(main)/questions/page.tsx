import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { getLatestSessionWithQuestions } from "@/features/general-questions/server/loaders/get-latest-session-with-questions";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

/**
 * 質問が公開されている最新会期の一般質問一覧へリダイレクトする。
 * まだ 1 件も公開されていない場合は 404 にせず準備中画面を表示する。
 */
export default async function QuestionsPage() {
  if (!siteConfig.features.generalQuestions) {
    notFound();
  }

  const sessionSlug = await getLatestSessionWithQuestions();

  if (!sessionSlug) {
    return (
      <Container className="py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-mirai-text">
            代表質問・一般質問
          </h1>
        </div>
        <div className="rounded-2xl border border-mirai-border bg-white p-8 text-center text-mirai-text-secondary">
          <p>現在、代表質問・一般質問の記録を準備中です。</p>
          <p className="mt-2 text-sm">しばらくお待ちください。</p>
        </div>
      </Container>
    );
  }

  redirect(routes.sessionQuestions(sessionSlug));
}
