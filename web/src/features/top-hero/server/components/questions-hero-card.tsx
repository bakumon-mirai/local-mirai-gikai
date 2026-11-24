import type { Route } from "next";
import Link from "next/link";
import type { GeneralQuestion } from "@/features/general-questions/shared/types";
import { questionTypeLabel } from "@/features/general-questions/shared/utils/question-type-label";
import { routes } from "@/lib/routes";

const MAX_ITEMS = 3;

type Props = {
  questions: GeneralQuestion[];
  sessionName: string | null;
};

/**
 * 首長記者会見・委員会議事録が無い自治体向けのフォールバック主役カード（一般質問）。
 */
export function QuestionsHeroCard({ questions, sessionName }: Props) {
  const items = questions.slice(0, MAX_ITEMS);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-[28px] bg-white p-6">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-archive-pill-bg px-3 py-1 text-xs font-medium text-archive-pill-text">
          一般質問
        </span>
        <span className="font-rounded text-base font-bold text-mirai-text">
          {sessionName ?? "最近の質問"}
        </span>
        <span className="ml-auto rounded-full bg-mirai-surface-warm px-2.5 py-0.5 text-xs font-medium text-archive-beige-text">
          最新
        </span>
      </div>

      <ol className="flex flex-col">
        {items.map((question, index) => {
          const headline =
            question.topics[0]?.title ?? question.summary ?? "一般質問のまとめ";
          return (
            <li
              key={question.id}
              className="border-b border-archive-divider last:border-b-0"
            >
              <Link
                href={routes.questionDetail(question.id) as Route}
                className="flex flex-col gap-0.5 py-3 hover:text-archive-accent"
              >
                <span className="flex gap-2.5 text-sm leading-relaxed text-mirai-text">
                  <span
                    aria-hidden
                    className="font-bold text-archive-accent tabular-nums"
                  >
                    {index + 1}
                  </span>
                  <span>{headline}</span>
                </span>
                <span className="pl-5 text-xs text-mirai-text-secondary">
                  {questionTypeLabel(question.question_type)}／
                  {question.questioner_name} 議員
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex items-center justify-end border-t border-archive-divider pt-3">
        <Link
          href={routes.questions() as Route}
          className="text-sm font-medium text-archive-accent hover:text-archive-accent-hover"
        >
          質問をぜんぶ見る
        </Link>
      </div>
    </div>
  );
}
