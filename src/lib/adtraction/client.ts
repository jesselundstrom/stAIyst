const ADTRACTION_API_TOKEN = process.env.ADTRACTION_API_TOKEN ?? "";
const BASE_URL = "https://api.adtraction.com/v3/partner/products";

export interface AdtractionProduct {
  SKU: string;
  name: string;
  price: number;
  currency: string;
  trackingUrl: string;
  imageUrl: string;
  category: string | null;
  brand: string | null;
  inStock: boolean;
}

interface AdtractionResponse {
  products: AdtractionProduct[];
  count: number;
}

export async function adtractionFetch(
  keyword: string,
  pageSize = 8,
  market = "FI"
): Promise<AdtractionProduct[]> {
  if (!ADTRACTION_API_TOKEN) {
    throw new Error("Adtraction is not configured. Set ADTRACTION_API_TOKEN.");
  }

  const params = new URLSearchParams({
    token: ADTRACTION_API_TOKEN,
    keyword,
    page: "0",
    pageSize: String(pageSize),
    market,
    inStock: "true",
  });

  const res = await fetch(`${BASE_URL}/?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (res.status === 429) {
    throw new Error("Adtraction rate limit exceeded.");
  }

  if (!res.ok) {
    throw new Error(`Adtraction API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as AdtractionResponse;
  return json.products ?? [];
}

export function isAdtractionConfigured(): boolean {
  return Boolean(ADTRACTION_API_TOKEN);
}
