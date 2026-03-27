import type { NormalizedProduct } from "@/types";
import type { AdtractionProduct } from "./client";

export function normalizeProduct(p: AdtractionProduct): NormalizedProduct {
  return {
    id: p.SKU,
    title: p.name,
    brand: p.brand ?? null,
    price: p.price.toFixed(2),
    currencyCode: p.currency,
    imageUrl: p.imageUrl,
    productUrl: p.trackingUrl,
    available: p.inStock,
    category: p.category ?? null,
  };
}

export function normalizeProducts(
  products: AdtractionProduct[]
): NormalizedProduct[] {
  return products
    .filter((p) => p.inStock && p.imageUrl && p.trackingUrl)
    .map(normalizeProduct);
}
