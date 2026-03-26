import type { NormalizedProduct } from "@/types";
import type { Recommendation } from "@/types";
import { shopifyFetch } from "./client";
import { PRODUCT_SEARCH_QUERY, type ShopifySearchResponse } from "./queries";
import { normalizeProducts } from "./normalize";
import { getMockProducts } from "./mock";

const USE_MOCK = process.env.USE_MOCK_PRODUCTS === "true" || !process.env.SHOPIFY_STORE_DOMAIN;

export async function searchProducts(
  query: string,
  limit = 6
): Promise<NormalizedProduct[]> {
  if (USE_MOCK) {
    return getMockProducts(query);
  }

  const data = await shopifyFetch<ShopifySearchResponse>(PRODUCT_SEARCH_QUERY, {
    query,
    first: limit + 2, // fetch a few extra to account for filtered-out items
  });

  return normalizeProducts(data.products.edges).slice(0, limit);
}

export async function searchProductsForRecommendation(
  recommendation: Recommendation
): Promise<NormalizedProduct[]> {
  // Try each search term until we get enough results
  for (const term of recommendation.searchTerms) {
    const results = await searchProducts(term, 6);
    if (results.length >= 2) return results;
  }

  // Fallback: search by category only
  const fallback = await searchProducts(recommendation.category, 6);
  return fallback;
}
