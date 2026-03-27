import type { NormalizedProduct, Recommendation } from "@/types";
import { adtractionFetch } from "./client";
import { normalizeProducts } from "./normalize";
import { getMockProducts } from "@/lib/shopify/mock";

const USE_MOCK =
  process.env.USE_MOCK_PRODUCTS === "true" ||
  !process.env.ADTRACTION_API_TOKEN;

export async function searchProducts(
  query: string,
  limit = 6
): Promise<NormalizedProduct[]> {
  if (USE_MOCK) {
    return getMockProducts(query);
  }

  const raw = await adtractionFetch(query, limit + 2);
  return normalizeProducts(raw).slice(0, limit);
}

export async function searchProductsForRecommendation(
  recommendation: Recommendation
): Promise<NormalizedProduct[]> {
  for (const term of recommendation.searchTerms) {
    const results = await searchProducts(term, 6);
    if (results.length >= 2) return results;
  }

  // Fallback: search by category only
  return searchProducts(recommendation.category, 6);
}
