import type { DialogueTurn, RecommendationResponse } from "@/types";

export function normalizeVisibleText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+-\s+/g, ". ")
    .replace(/([A-Za-z0-9])\-([A-Za-z0-9])/g, "$1 $2")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])([^\s])/g, "$1 $2")
    .replace(/\.\s*\./g, ".")
    .trim();
}

export function normalizeDialogueTurn(turn: DialogueTurn): DialogueTurn {
  return {
    ...turn,
    text: normalizeVisibleText(turn.text),
  };
}

export function normalizeRecommendationResponse(
  recommendation: RecommendationResponse
): RecommendationResponse {
  return {
    ...recommendation,
    styleSummary: normalizeVisibleText(recommendation.styleSummary),
    recommendations: recommendation.recommendations.map((item) => ({
      ...item,
      reason: normalizeVisibleText(item.reason),
      targetFit: normalizeVisibleText(item.targetFit),
      targetColors: item.targetColors.map((color) => normalizeVisibleText(color)),
    })),
  };
}
