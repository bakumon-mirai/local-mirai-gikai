import type { Route } from "next";
import Link from "next/link";
import type { GeneralQuestion } from "@/features/general-questions/shared/types";
import { questionTypeLabel } from "@/features/general-questions/shared/utils/question-type-label";
import { routes } from "@/lib/routes";

type Props = {
  questions: GeneralQuestion[];
  sessionName: string | null;
};

export function QuestionsSection({ questions, sessionName }: Props) {
  if (questions.length === 0) return null;

  return (
    <section className="mx-4 mt-10 rounded-[28px] bg-white p-5 pc:mx-16 pc:mt-12 pc:rounded-[32px] pc:p-9">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-rounded text-xl font-bold text-mirai-text pc:text-2xl">
          代表質問・一般質問から
        </h2>
        <Link
          href={routes.questions() as Route}
          className="text-sm font-medium text-archive-accent hover:text-archive-accent-hover"
        >
          もっと見る
        </Link>
      </div>

      <ul className="mt-3 flex flex-col">
        {questions.map((question) => {
          const headline = question.topics[0]?.title ?? question.summary ?? "";
          return (
            <li
              key={question.id}
              className="border-b border-archive-divider last:border-b-0"
            >
              <Link
                href={routes.questionDetail(question.id) as Route}
                className="group flex flex-col gap-0.5 py-3"
              >
                <span className="text-sm leading-relaxed text-mirai-text group-hover:text-archive-accent">
                  {headline}
                </span>
                <span className="text-xs text-mirai-text-secondary">
                  {questionTypeLabel(question.question_type)}／
                  {question.questioner_name} 議員
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {sessionName && (
        <p className="mt-2 text-xs text-mirai-text-secondary">
          {sessionName}より
        </p>
      )}
    </section>
  );
}
