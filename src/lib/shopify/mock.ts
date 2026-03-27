import type { NormalizedProduct } from "@/types";

const MOCK_PRODUCTS: NormalizedProduct[] = [
  {
    id: "mock-1",
    title: "Relaxed Overshirt in Stone",
    brand: "Arket",
    price: "89.00",
    currencyCode: "GBP",
    imageUrl: "/mock-products/overshirt.svg",
    productUrl: "#",
    available: true,
    category: "Overshirts",
  },
  {
    id: "mock-2",
    title: "Washed Cotton Overshirt — Olive",
    brand: "COS",
    price: "110.00",
    currencyCode: "GBP",
    imageUrl: "/mock-products/overshirt.svg",
    productUrl: "#",
    available: true,
    category: "Overshirts",
  },
  {
    id: "mock-3",
    title: "Linen Overshirt — Natural",
    brand: "Uniqlo",
    price: "49.90",
    currencyCode: "GBP",
    imageUrl: "/mock-products/overshirt.svg",
    productUrl: "#",
    available: true,
    category: "Overshirts",
  },
  {
    id: "mock-4",
    title: "Tapered Trousers in Charcoal",
    brand: "Arket",
    price: "79.00",
    currencyCode: "GBP",
    imageUrl: "/mock-products/trousers.svg",
    productUrl: "#",
    available: true,
    category: "Trousers",
  },
  {
    id: "mock-5",
    title: "Straight Leg Trousers — Black",
    brand: "COS",
    price: "95.00",
    currencyCode: "GBP",
    imageUrl: "/mock-products/trousers.svg",
    productUrl: "#",
    available: true,
    category: "Trousers",
  },
  {
    id: "mock-6",
    title: "Relaxed Cotton Trousers — Stone",
    brand: "Toteme",
    price: "195.00",
    currencyCode: "GBP",
    imageUrl: "/mock-products/trousers.svg",
    productUrl: "#",
    available: true,
    category: "Trousers",
  },
  {
    id: "mock-7",
    title: "Clean Leather Sneaker — White",
    brand: "Common Projects",
    price: "395.00",
    currencyCode: "GBP",
    imageUrl: "/mock-products/shoes.svg",
    productUrl: "#",
    available: true,
    category: "Shoes",
  },
  {
    id: "mock-8",
    title: "Low Trainer — White/Taupe",
    brand: "Adidas",
    price: "90.00",
    currencyCode: "GBP",
    imageUrl: "/mock-products/shoes.svg",
    productUrl: "#",
    available: true,
    category: "Shoes",
  },
  {
    id: "mock-9",
    title: "Minimal Derby Shoe — Black",
    brand: "Clarks",
    price: "120.00",
    currencyCode: "GBP",
    imageUrl: "/mock-products/shoes.svg",
    productUrl: "#",
    available: true,
    category: "Shoes",
  },
];

export function getMockProducts(query: string): NormalizedProduct[] {
  const q = query.toLowerCase();

  // Rough matching based on search terms
  if (q.includes("overshirt") || q.includes("shirt jacket") || q.includes("layer")) {
    return MOCK_PRODUCTS.filter((p) => p.category === "Overshirts");
  }
  if (q.includes("trouser") || q.includes("pant") || q.includes("bottom")) {
    return MOCK_PRODUCTS.filter((p) => p.category === "Trousers");
  }
  if (q.includes("shoe") || q.includes("sneaker") || q.includes("trainer") || q.includes("boot")) {
    return MOCK_PRODUCTS.filter((p) => p.category === "Shoes");
  }

  // Fallback: return a mix
  return MOCK_PRODUCTS.slice(0, 3);
}
