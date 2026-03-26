import type { RecommendationResponse } from "@/types";

export const RECOMMENDATION_SYSTEM_PROMPT = `You are a precise, practical styling assistant.
Your role is to analyze a person's current look and suggest specific clothing improvements.

Rules:
- Be concise and practical, not generic lifestyle advice
- Focus on visible style improvements, not body commentary
- Output valid JSON matching the exact schema provided
- targetColors should be 2-4 specific color names
- searchTerms should be 1-3 specific, e-commerce-ready search phrases
- Never comment on body shape or size
- Keep reasons under 15 words`;

export const RECOMMENDATION_SCHEMA = {
  type: "object",
  properties: {
    styleSummary: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          reason: { type: "string" },
          targetColors: { type: "array", items: { type: "string" } },
          targetFit: { type: "string" },
          searchTerms: { type: "array", items: { type: "string" } },
        },
        required: ["category", "reason", "targetColors", "targetFit", "searchTerms"],
      },
    },
  },
  required: ["styleSummary", "recommendations"],
};

export function getMockRecommendations(preferences: {
  direction: string;
  budget: string;
  fit: string;
  colors: string;
}): RecommendationResponse {
  const colorMap: Record<string, string[]> = {
    neutral: ["white", "off-white", "light grey"],
    earthy: ["camel", "terracotta", "olive"],
    monochrome: ["black", "charcoal", "white"],
    mixed: ["navy", "rust", "sage"],
  };

  const colors = colorMap[preferences.colors] ?? ["beige", "stone", "white"];

  const summaryMap: Record<string, string> = {
    minimal: "A clean foundation — sharper layering and footwear would elevate this further.",
    "smart-casual": "Good casual base with room to add more structure through outerwear and trousers.",
    classic: "Classic direction — refining the fit and colour palette will sharpen the overall result.",
    streetwear: "Strong streetwear base — a considered mid-layer and footwear upgrade would complete the look.",
  };

  return {
    styleSummary: summaryMap[preferences.direction] ?? "A solid starting point with clear room for improvement.",
    recommendations: [
      {
        category: "overshirt",
        reason: "Adds structure and elevates the silhouette",
        targetColors: colors,
        targetFit: preferences.fit === "relaxed" ? "relaxed" : "regular",
        searchTerms: [
          `${colors[0]} overshirt ${preferences.fit} fit minimal`,
          `${colors[0]} shirt jacket`,
        ],
      },
      {
        category: "trousers",
        reason: "Creates cleaner visual balance and a sharper line",
        targetColors: ["charcoal", "black", "stone"],
        targetFit: preferences.fit === "relaxed" ? "wide-leg" : preferences.fit === "slim" ? "tapered" : "straight",
        searchTerms: [
          `charcoal ${preferences.fit} trousers minimal`,
          `black straight trousers`,
        ],
      },
      {
        category: "shoes",
        reason: "A refined finish reduces visual heaviness",
        targetColors: ["white", "taupe", "black"],
        targetFit: "sleek",
        searchTerms: [
          "minimal leather sneakers white",
          "clean white low sneakers",
        ],
      },
    ],
  };
}
