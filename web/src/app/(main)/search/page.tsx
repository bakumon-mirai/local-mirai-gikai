import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { SearchForm } from "@/features/search/client/components/search-form";
import { SearchResultTabs } from "@/features/search/client/components/search-result-tabs";
import { loadSearchResults } from "@/features/search/server/loaders/search-loader";

export const metadata: Metadata = {
  title: `検索 | ${siteConfig.siteName}`,
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  if (!siteConfig.features.search) {
    notFound();
  }

  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await loadSearchResults(query) : null;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-mirai-text mb-6">検索</h1>
      <Suspense>
        <SearchForm />
      </Suspense>
      <div className="mt-8">
        <SearchResultTabs key={query} query={query} results={results} />
      </div>
    </Container>
  );
}
