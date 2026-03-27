import test from "node:test";
import assert from "node:assert/strict";
import { attachSupportingQuotes, findSupportingQuote } from "../../src/lib/ai/supportingQuotes.ts";
import type { DialogueTurn, Recommendation, RecommendationResponse } from "../../src/types/index.ts";

function createRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    category: "overshirt",
    reason: "Adds structure and elevates the silhouette",
    targetColors: ["stone", "olive"],
    targetFit: "regular",
    searchTerms: ["stone overshirt"],
    ...overrides,
  };
}

test("findSupportingQuote returns the clearest matching stylist line", () => {
  const turns: DialogueTurn[] = [
    {
      participant: "claude",
      text: "Cleaner separation between layers would give this look more structure.",
    },
    {
      participant: "gpt",
      text: "Keeping the palette restrained would make it feel calmer.",
    },
  ];

  assert.equal(
    findSupportingQuote(turns, createRecommendation()),
    "Cleaner separation between layers would give this look more structure."
  );
});

test("findSupportingQuote keeps the first matching line on a score tie", () => {
  const turns: DialogueTurn[] = [
    {
      participant: "claude",
      text: "Outerwear layer adds structure to the look.",
    },
    {
      participant: "gpt",
      text: "Layer outerwear adds structure to the look.",
    },
  ];

  assert.equal(
    findSupportingQuote(turns, createRecommendation()),
    "Outerwear layer adds structure to the look."
  );
});

test("findSupportingQuote returns undefined when no clear match exists", () => {
  const turns: DialogueTurn[] = [
    {
      participant: "claude",
      text: "The styling would benefit from a warmer evening mood.",
    },
    {
      participant: "gpt",
      text: "This should feel more expressive and dressed up overall.",
    },
  ];

  assert.equal(findSupportingQuote(turns, createRecommendation()), undefined);
});

test("attachSupportingQuotes leaves unrelated recommendations without a quote", () => {
  const recommendation: RecommendationResponse = {
    styleSummary: "A cleaner direction with more structure.",
    recommendations: [
      createRecommendation(),
      createRecommendation({
        category: "shoes",
        reason: "A refined finish reduces visual heaviness",
        targetColors: ["white", "taupe"],
        targetFit: "sleek",
        searchTerms: ["white sneakers"],
      }),
    ],
  };
  const turns: DialogueTurn[] = [
    {
      participant: "claude",
      text: "Cleaner separation between layers would give this look more structure.",
    },
  ];

  const enriched = attachSupportingQuotes(recommendation, turns);

  assert.equal(
    enriched.recommendations[0].supportingQuote,
    "Cleaner separation between layers would give this look more structure."
  );
  assert.equal(enriched.recommendations[1].supportingQuote, undefined);
});
