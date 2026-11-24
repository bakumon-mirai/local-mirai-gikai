"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/routes";

const SUGGESTED_KEYWORDS = ["子育て", "防災", "道路", "環境", "福祉", "予算"];

export function SearchForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q") as string;
    const trimmed = q.trim();
    router.push(routes.search(trimmed || undefined));
  }

  return (
    <div>
      <form key={query} onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-mirai-text-muted" />
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="キーワードを入力..."
          className="pl-9 h-11 text-base bg-white border-mirai-border"
          autoFocus
        />
      </form>
      {!query && (
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTED_KEYWORDS.map((kw) => (
            <Button
              key={kw}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(routes.search(kw))}
              className="h-auto px-3 py-1 text-xs border-mirai-border rounded-full text-mirai-text-secondary hover:bg-mirai-surface"
            >
              {kw}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
