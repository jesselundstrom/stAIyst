import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type { StylePreferences, RecommendationResponse } from "@/types";
import { RECOMMENDATION_SYSTEM_PROMPT, getMockRecommendations } from "./schemas";

const USE_MOCK =
  process.env.USE_MOCK_RECOMMENDATIONS === "true" || !process.env.ANTHROPIC_API_KEY;
const RECOMMENDATION_MODEL =
  process.env.ANTHROPIC_RECOMMENDATION_MODEL ?? "claude-sonnet-4-6";
const RECOMMENDATION_MAX_RETRIES = 4;

type AnthropicErrorPayload = {
  type?: string;
  request_id?: string;
  error?: {
    type?: string;
    message?: string;
  };
};

export class RecommendationServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable = false,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = "RecommendationServiceError";
  }
}

export function isRecommendationServiceError(
  error: unknown
): error is RecommendationServiceError {
  return error instanceof RecommendationServiceError;
}

function getImageMediaType(
  frontImageBase64: string
): "image/jpeg" | "image/png" | "image/webp" {
  const mediaType = frontImageBase64
    .match(/^data:(image\/[a-z0-9.+-]+);base64,/i)?.[1]
    ?.toLowerCase();

  if (mediaType === "image/png" || mediaType === "image/webp") {
    return mediaType;
  }

  return "image/jpeg";
}

function toRecommendationServiceError(
  error: APIError<number | undefined, Headers | undefined, object | undefined>
) {
  const payload = error.error as AnthropicErrorPayload | undefined;
  const providerErrorType = payload?.error?.type ?? payload?.type;
  const requestId = error.requestID ?? payload?.request_id ?? undefined;

  if (error.status === 529 || providerErrorType === "overloaded_error") {
    return new RecommendationServiceError(
      "Picture analysis is temporarily overloaded. Please try again in a moment.",
      503,
      true,
      requestId
    );
  }

  if (error.status === 429 || providerErrorType === "rate_limit_error") {
    return new RecommendationServiceError(
      "Picture analysis is rate limited right now. Please retry shortly.",
      429,
      true,
      requestId
    );
  }

  return new RecommendationServiceError(
    "Failed to analyze the uploaded picture.",
    502,
    false,
    requestId
  );
}

export async function generateRecommendations(
  preferences: StylePreferences,
  frontImageBase64?: string
): Promise<RecommendationResponse> {
  if (USE_MOCK) {
    // Simulate a small delay so the UI feels realistic
    await new Promise((r) => setTimeout(r, 800));
    return getMockRecommendations(preferences);
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxRetries: RECOMMENDATION_MAX_RETRIES,
  });

  const userPrompt = `
Style preferences:
- Direction: ${preferences.direction}
- Budget: ${preferences.budget}
- Fit: ${preferences.fit}
- Colors: ${preferences.colors}

Generate 3 clothing recommendations (overshirt/layer, trousers/bottoms, shoes).
Return JSON only - no commentary outside the JSON block.

Schema:
{
  "styleSummary": "string (1-2 sentences)",
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

    const mediaType = getImageMediaType(frontImageBase64);

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

  let response;

  try {
    response = await client.messages.create({
      model: RECOMMENDATION_MODEL,
      max_tokens: 1024,
      system: RECOMMENDATION_SYSTEM_PROMPT,
      messages,
    });
  } catch (error) {
    if (error instanceof APIError) {
      const serviceError = toRecommendationServiceError(error);
      console.warn("[recommend] Anthropic request failed", {
        status: error.status,
        requestId: serviceError.requestId,
        retryable: serviceError.retryable,
      });
      throw serviceError;
    }

    throw error;
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in recommendation response");

  return JSON.parse(jsonMatch[0]) as RecommendationResponse;
}
