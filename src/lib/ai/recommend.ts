import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type { RecommendationResponse, StylePreferences } from "@/types";
import {
  buildRecommendationUserPrompt,
  getMockRecommendations,
  RECOMMENDATION_SCHEMA,
  RECOMMENDATION_SYSTEM_PROMPT,
} from "./schemas";
import { normalizeRecommendationResponse } from "@/lib/text/normalizeVisibleText";

type RecommendationProvider = "anthropic" | "openai";
type AnthropicErrorPayload = {
  type?: string;
  request_id?: string;
  error?: {
    type?: string;
    message?: string;
  };
};

type OpenAIErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const RECOMMENDATION_PROVIDER = getRecommendationProvider();
const USE_MOCK =
  process.env.USE_MOCK_RECOMMENDATIONS === "true" ||
  !hasProviderCredentials(RECOMMENDATION_PROVIDER);

const ANTHROPIC_RECOMMENDATION_MODEL =
  process.env.ANTHROPIC_RECOMMENDATION_MODEL ?? "claude-sonnet-4-6";
const ANTHROPIC_MAX_RETRIES = 4;

const OPENAI_RECOMMENDATION_MODEL =
  process.env.OPENAI_RECOMMENDATION_MODEL ?? "gpt-4.1-mini";
const OPENAI_API_BASE_URL =
  process.env.OPENAI_API_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
const OPENAI_MAX_RETRIES = 3;

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

function getRecommendationProvider(): RecommendationProvider {
  const provider = process.env.RECOMMENDATION_AI_PROVIDER?.toLowerCase();
  return provider === "openai" ? "openai" : "anthropic";
}

function hasProviderCredentials(provider: RecommendationProvider) {
  if (provider === "openai") {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  return Boolean(process.env.ANTHROPIC_API_KEY);
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

function parseRecommendationJson(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON in recommendation response");
  }

  return JSON.parse(jsonMatch[0]) as RecommendationResponse;
}

function toAnthropicServiceError(
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

function toOpenAIServiceError(
  status: number,
  payload?: OpenAIErrorPayload,
  requestId?: string
) {
  const providerMessage = payload?.error?.message;

  if (status === 429) {
    return new RecommendationServiceError(
      providerMessage ?? "Picture analysis is rate limited right now. Please retry shortly.",
      429,
      true,
      requestId
    );
  }

  if (status >= 500) {
    return new RecommendationServiceError(
      "Picture analysis is temporarily unavailable. Please try again in a moment.",
      503,
      true,
      requestId
    );
  }

  return new RecommendationServiceError(
    providerMessage ?? "Failed to analyze the uploaded picture.",
    502,
    false,
    requestId
  );
}

function shouldRetryOpenAIRequest(status: number) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function getRetryDelayMs(attempt: number, retryAfter: string | null) {
  if (retryAfter) {
    const retryAfterSeconds = Number(retryAfter);
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return retryAfterSeconds * 1000;
    }
  }

  return Math.min(1000 * 2 ** attempt, 8000);
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateAnthropicRecommendations(
  preferences: StylePreferences,
  frontImageBase64?: string
) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxRetries: ANTHROPIC_MAX_RETRIES,
  });

  const messages: Anthropic.MessageParam[] = [];
  const userPrompt = buildRecommendationUserPrompt(preferences);

  if (frontImageBase64) {
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

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_RECOMMENDATION_MODEL,
      max_tokens: 1024,
      system: RECOMMENDATION_SYSTEM_PROMPT,
      messages,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    return normalizeRecommendationResponse(parseRecommendationJson(text));
  } catch (error) {
    if (error instanceof APIError) {
      const serviceError = toAnthropicServiceError(error);
      console.warn("[recommend] Anthropic request failed", {
        status: error.status,
        requestId: serviceError.requestId,
        retryable: serviceError.retryable,
      });
      throw serviceError;
    }

    throw error;
  }
}

function extractOpenAIText(payload: OpenAIResponsePayload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text ?? "")
    .join("");
}

async function generateOpenAIRecommendations(
  preferences: StylePreferences,
  frontImageBase64?: string
) {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    throw new RecommendationServiceError(
      "OpenAI recommendations are not configured.",
      500,
      false
    );
  }

  const userContent: Array<Record<string, string>> = [
    {
      type: "input_text",
      text: buildRecommendationUserPrompt(preferences),
    },
  ];

  if (frontImageBase64) {
    userContent.unshift({
      type: "input_image",
      image_url: frontImageBase64,
      detail: "high",
    });
  }

  const body = {
    model: OPENAI_RECOMMENDATION_MODEL,
    instructions: RECOMMENDATION_SYSTEM_PROMPT,
    input: [
      {
        role: "user",
        content: userContent,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "recommendation_response",
        strict: true,
        schema: RECOMMENDATION_SCHEMA,
      },
    },
    max_output_tokens: 1024,
    store: false,
  };

  for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(`${OPENAI_API_BASE_URL}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      if (attempt < OPENAI_MAX_RETRIES) {
        await delay(getRetryDelayMs(attempt, null));
        continue;
      }

      throw new RecommendationServiceError(
        "Picture analysis is temporarily unavailable. Please try again in a moment.",
        503,
        true
      );
    }

    const requestId = response.headers.get("x-request-id") ?? undefined;

    if (!response.ok) {
      const payload = (await response.json().catch(() => undefined)) as
        | OpenAIErrorPayload
        | undefined;

      if (attempt < OPENAI_MAX_RETRIES && shouldRetryOpenAIRequest(response.status)) {
        await delay(getRetryDelayMs(attempt, response.headers.get("retry-after")));
        continue;
      }

      const serviceError = toOpenAIServiceError(response.status, payload, requestId);
      console.warn("[recommend] OpenAI request failed", {
        status: response.status,
        requestId,
        retryable: serviceError.retryable,
      });
      throw serviceError;
    }

    const payload = (await response.json()) as OpenAIResponsePayload;
    const text = extractOpenAIText(payload);

    if (!text) {
      throw new RecommendationServiceError(
        "OpenAI returned no structured recommendation text.",
        502,
        false,
        requestId
      );
    }

    return normalizeRecommendationResponse(parseRecommendationJson(text));
  }

  throw new RecommendationServiceError(
    "Picture analysis is temporarily unavailable. Please try again in a moment.",
    503,
    true
  );
}

export async function generateRecommendations(
  preferences: StylePreferences,
  frontImageBase64?: string
): Promise<RecommendationResponse> {
  if (USE_MOCK) {
    await delay(800);
    return normalizeRecommendationResponse(getMockRecommendations(preferences));
  }

  if (RECOMMENDATION_PROVIDER === "openai") {
    return generateOpenAIRecommendations(preferences, frontImageBase64);
  }

  return generateAnthropicRecommendations(preferences, frontImageBase64);
}
