import type { NormalizedProduct } from "@/types";
import type { ShopifyProductNode } from "./queries";

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "";

export function normalizeProduct(node: ShopifyProductNode): NormalizedProduct {
  const imageUrl = node.images.edges[0]?.node.url ?? "";
  const price = parseFloat(node.priceRange.minVariantPrice.amount).toFixed(2);

  // Prefer onlineStoreUrl from API, fallback to constructed URL
  const productUrl =
    node.onlineStoreUrl ?? `https://${SHOPIFY_DOMAIN}/products/${node.handle}`;

  return {
    id: node.id,
    title: node.title,
    brand: node.vendor || null,
    price,
    currencyCode: node.priceRange.minVariantPrice.currencyCode,
    imageUrl,
    productUrl,
    available: node.availableForSale,
    category: node.productType || null,
  };
}

export function normalizeProducts(
  edges: Array<{ node: ShopifyProductNode }>
): NormalizedProduct[] {
  return edges
    .map((e) => normalizeProduct(e.node))
    .filter((p) => p.available && p.imageUrl);
}
