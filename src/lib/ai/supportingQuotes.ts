import type { DialogueTurn, Recommendation, RecommendationResponse } from "@/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "here",
  "in",
  "into",
  "is",
  "it",
  "its",
  "more",
  "of",
  "on",
  "or",
  "so",
  "that",
  "the",
  "their",
  "there",
  "this",
  "to",
  "will",
  "with",
]);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  overshirt: ["overshirt", "layer", "layers", "shirt", "jacket", "outerwear"],
  trousers: ["trouser", "trousers", "bottom", "bottoms", "pant", "pants", "line"],
  shoes: ["shoe", "shoes", "sneaker", "sneakers", "trainer", "trainers", "footwear", "finish"],
  jacket: ["jacket", "outerwear", "coat", "layer"],
  shirt: ["shirt", "top", "layer"],
  top: ["top", "shirt", "tee", "layer"],
};

const CLEAR_MATCH_THRESHOLD = 3;

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function normalizeToken(token: string) {
  const stripped = token.replace(/[^a-z0-9]/g, "");
  if (stripped.length <= 2) {
    return "";
  }

  if (stripped.endsWith("ies") && stripped.length > 4) {
    return `${stripped.slice(0, -3)}y`;
  }

  if (stripped.endsWith("s") && !stripped.endsWith("ss") && stripped.length > 3) {
    return stripped.slice(0, -1);
  }

  return stripped;
}

function tokenize(text: string) {
  return new Set(
    normalizeText(text)
      .split(/\s+/)
      .map(normalizeToken)
      .filter((token) => token && !STOP_WORDS.has(token))
  );
}

function countMatches(source: Set<string>, target: Iterable<string>) {
  let score = 0;

  for (const token of target) {
    if (source.has(token)) {
      score += 1;
    }
  }

  return score;
}

function getCategoryKeywords(category: string) {
  return CATEGORY_KEYWORDS[category.toLowerCase()] ?? [category.toLowerCase()];
}

function scoreTurnForRecommendation(turnText: string, recommendation: Recommendation) {
  const turnTokens = tokenize(turnText);
  const reasonTokens = tokenize(recommendation.reason);
  const fitTokens = tokenize(recommendation.targetFit);
  const colorTokens = new Set(
    recommendation.targetColors.flatMap((color) => Array.from(tokenize(color)))
  );
  const categoryTokens = new Set(
    getCategoryKeywords(recommendation.category).flatMap((keyword) =>
      Array.from(tokenize(keyword))
    )
  );

  return (
    countMatches(turnTokens, categoryTokens) * 3 +
    countMatches(turnTokens, reasonTokens) * 2 +
    countMatches(turnTokens, fitTokens) * 2 +
    countMatches(turnTokens, colorTokens) * 2
  );
}

export function findSupportingQuote(
  turns: DialogueTurn[],
  recommendation: Recommendation
) {
  let bestQuote: string | undefined;
  let bestScore = 0;

  turns.forEach((turn) => {
    const score = scoreTurnForRecommendation(turn.text, recommendation);

    if (score > bestScore) {
      bestScore = score;
      bestQuote = turn.text;
    }
  });

  return bestScore >= CLEAR_MATCH_THRESHOLD ? bestQuote : undefined;
}

export function attachSupportingQuotes(
  recommendation: RecommendationResponse,
  turns: DialogueTurn[] | null
): RecommendationResponse {
  if (!turns || turns.length === 0) {
    return recommendation;
  }

  return {
    ...recommendation,
    recommendations: recommendation.recommendations.map((item) => ({
      ...item,
      supportingQuote: findSupportingQuote(turns, item),
    })),
  };
}
