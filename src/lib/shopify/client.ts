const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "";
const SHOPIFY_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";

const STOREFRONT_API_VERSION = "2024-01";
const endpoint = `https://${SHOPIFY_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`;

export async function shopifyFetch<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
    throw new Error("Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`);
  }

  return json.data as T;
}

export function isShopifyConfigured(): boolean {
  return Boolean(SHOPIFY_DOMAIN && SHOPIFY_TOKEN);
}
