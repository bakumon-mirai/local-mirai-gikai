import "server-only";
import { siteConfig } from "@/config/site.config";
import type { SearchResults } from "../../shared/types/search-types";
import {
  searchBills,
  searchCommittees,
  searchGeneralQuestions,
} from "../repositories/search-repository";

export async function loadSearchResults(query: string): Promise<SearchResults> {
  const [bills, questions, committees] = await Promise.all([
    siteConfig.features.bills ? searchBills(query) : Promise.resolve([]),
    siteConfig.features.generalQuestions
      ? searchGeneralQuestions(query)
      : Promise.resolve([]),
    siteConfig.features.committeeMinutes
      ? searchCommittees(query)
      : Promise.resolve([]),
  ]);
  return { bills, questions, committees };
}
