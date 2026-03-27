const CATEGORY_LABELS: Record<string, string> = {
  overshirt: "Overshirt / Layer",
  trousers: "Trousers / Bottoms",
  shoes: "Shoes / Footwear",
  jacket: "Jacket / Outerwear",
  shirt: "Shirt / Top",
  top: "Top",
};

export function getRecommendationCategoryLabel(category: string) {
  return CATEGORY_LABELS[category.toLowerCase()] ?? category;
}
