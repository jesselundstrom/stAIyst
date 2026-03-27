import Anthropic from "@anthropic-ai/sdk";
import type { StylePreferences, RecommendationResponse } from "@/types";
import { RECOMMENDATION_SYSTEM_PROMPT, getMockRecommendations } from "./schemas";

const USE_MOCK = process.env.USE_MOCK_RECOMMENDATIONS === "true" || !process.env.ANTHROPIC_API_KEY;

export async function generateRecommendations(
  preferences: StylePreferences,
  frontImageBase64?: string
): Promise<RecommendationResponse> {
  if (USE_MOCK) {
    // Simulate a small delay so the UI feels realistic
    await new Promise((r) => setTimeout(r, 800));
    return getMockRecommendations(preferences);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userPrompt = `
Style preferences:
- Direction: ${preferences.direction}
- Budget: ${preferences.budget}
- Fit: ${preferences.fit}
- Colors: ${preferences.colors}

Generate 3 clothing recommendations (overshirt/layer, trousers/bottoms, shoes).
Return JSON only — no commentary outside the JSON block.

Schema:
{
  "styleSummary": "string (1–2 sentences)",
  "recommendations": [
    {
      "category": "string",
      "reason": "string (max 15 words)",
      "targetColors": ["string"],
      "targetFit": "string",
      "searchTerms": ["string"]
    }
  ]
}`;

  const messages: Anthropic.MessageParam[] = [];

  if (frontImageBase64) {
    // Strip the data URL prefix if present
    const base64Data = frontImageBase64.includes(",")
      ? frontImageBase64.split(",")[1]
      : frontImageBase64;

    const mediaType = frontImageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64Data },
        },
        { type: "text", text: userPrompt },
      ],
    });
  } else {
    messages.push({ role: "user", content: userPrompt });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: RECOMMENDATION_SYSTEM_PROMPT,
    messages,
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in recommendation response");

  return JSON.parse(jsonMatch[0]) as RecommendationResponse;
}
