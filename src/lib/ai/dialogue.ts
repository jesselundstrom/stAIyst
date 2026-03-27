import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type {
  DialogueParticipant,
  DialogueResponse,
  DialogueTurn,
  StylePreferences,
} from "@/types";
import {
  buildDialogueUserPrompt,
  DIALOGUE_SYSTEM_PROMPT_CLAUDE,
  DIALOGUE_SYSTEM_PROMPT_GPT,
} from "./schemas";
import { generateRecommendations } from "./recommend";

type AvailableDialogueProvider = DialogueParticipant;
type AnthropicDialogueErrorPayload = {
  type?: string;
  request_id?: string;
  error?: {
    type?: string;
    message?: string;
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

const USE_MOCK = process.env.USE_MOCK_RECOMMENDATIONS === "true";
const ANTHROPIC_DIALOGUE_MODEL =
  process.env.ANTHROPIC_DIALOGUE_MODEL ??
  process.env.ANTHROPIC_RECOMMENDATION_MODEL ??
  "claude-sonnet-4-6";
const OPENAI_DIALOGUE_MODEL =
  process.env.OPENAI_DIALOGUE_MODEL ??
  process.env.OPENAI_RECOMMENDATION_MODEL ??
  "gpt-4.1-mini";
const OPENAI_API_BASE_URL =
  process.env.OPENAI_API_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";

export function hasAnthropicProvider() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function hasOpenAIProvider() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getAvailableDialogueProviders(): AvailableDialogueProvider[] {
  const providers: AvailableDialogueProvider[] = [];

  if (hasAnthropicProvider()) {
    providers.push("claude");
  }

  if (hasOpenAIProvider()) {
    providers.push("gpt");
  }

  return providers;
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

function cleanDialogueText(text: string) {
  return text.replace(/\s+/g, " ").trim();
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

function getMockDialogueTurns(preferences: StylePreferences): DialogueTurn[] {
  const mockTurnsByDirection: Record<StylePreferences["direction"], DialogueTurn[]> = {
    minimal: [
      {
        participant: "claude",
        text: "The clean base is there, but the palette wants a crisper contrast so the look reads more intentional than default.",
      },
      {
        participant: "gpt",
        text: "Agreed, and I would sharpen it further with smoother textures and quieter proportions so the outfit feels premium instead of flat.",
      },
    ],
    "smart-casual": [
      {
        participant: "claude",
        text: "There is a solid casual foundation here, though the mix would benefit from one more structured piece to pull the look together.",
      },
      {
        participant: "gpt",
        text: "Yes, and a cleaner trouser line would make that structure feel deliberate rather than overly dressed for the rest of the palette.",
      },
    ],
    classic: [
      {
        participant: "claude",
        text: "The direction already leans classic, but the proportions could look more refined with slightly cleaner separation between layers.",
      },
      {
        participant: "gpt",
        text: "I agree, and keeping the colors restrained will help that classic structure feel confident instead of a bit heavy.",
      },
    ],
    streetwear: [
      {
        participant: "claude",
        text: "The casual energy works, though the look needs a stronger textural anchor so it feels styled rather than just relaxed.",
      },
      {
        participant: "gpt",
        text: "Right, and I would keep the proportions easy but tighten the palette so the streetwear influence lands cleaner and more premium.",
      },
    ],
  };

  return mockTurnsByDirection[preferences.direction];
}

export async function generateClaudeDialogueTurn(
  preferences: StylePreferences,
  frontImageBase64?: string
): Promise<DialogueTurn> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxRetries: 2,
  });

  const userPrompt = buildDialogueUserPrompt(preferences);
  const messages: Anthropic.MessageParam[] = [];

  if (frontImageBase64) {
    const base64Data = frontImageBase64.includes(",")
      ? frontImageBase64.split(",")[1]
      : frontImageBase64;

    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: getImageMediaType(frontImageBase64),
            data: base64Data,
          },
        },
        { type: "text", text: userPrompt },
      ],
    });
  } else {
    messages.push({ role: "user", content: userPrompt });
  }

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_DIALOGUE_MODEL,
      max_tokens: 200,
      system: DIALOGUE_SYSTEM_PROMPT_CLAUDE,
      messages,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    return {
      participant: "claude",
      text: cleanDialogueText(text),
    };
  } catch (error) {
    if (error instanceof APIError) {
      const payload = error.error as AnthropicDialogueErrorPayload | undefined;
      console.warn("[dialogue] Claude turn failed", {
        status: error.status,
        requestId: error.requestID ?? payload?.request_id,
        type: payload?.error?.type ?? payload?.type,
      });
    } else {
      console.warn("[dialogue] Claude turn failed", error);
    }

    throw error;
  }
}

export async function generateGPTDialogueTurn(
  preferences: StylePreferences,
  frontImageBase64?: string,
  priorTurn?: string
): Promise<DialogueTurn> {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    throw new Error("OpenAI dialogue is not configured.");
  }

  const userContent: Array<Record<string, string>> = [
    {
      type: "input_text",
      text: buildDialogueUserPrompt(preferences, priorTurn),
    },
  ];

  if (frontImageBase64) {
    userContent.unshift({
      type: "input_image",
      image_url: frontImageBase64,
      detail: "high",
    });
  }

  const response = await fetch(`${OPENAI_API_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_DIALOGUE_MODEL,
      instructions: DIALOGUE_SYSTEM_PROMPT_GPT,
      input: [
        {
          role: "user",
          content: userContent,
        },
      ],
      max_output_tokens: 200,
      store: false,
    }),
  });

  if (!response.ok) {
    const requestId = response.headers.get("x-request-id") ?? undefined;
    console.warn("[dialogue] GPT turn failed", {
      status: response.status,
      requestId,
    });
    throw new Error("OpenAI dialogue request failed.");
  }

  const payload = (await response.json()) as OpenAIResponsePayload;
  const text = cleanDialogueText(extractOpenAIText(payload));

  if (!text) {
    throw new Error("OpenAI returned no dialogue text.");
  }

  return {
    participant: "gpt",
    text,
  };
}

async function generateSingleDialogueTurn(
  provider: AvailableDialogueProvider,
  preferences: StylePreferences,
  frontImageBase64?: string,
  priorTurn?: string
) {
  if (provider === "claude") {
    return generateClaudeDialogueTurn(preferences, frontImageBase64);
  }

  return generateGPTDialogueTurn(preferences, frontImageBase64, priorTurn);
}

export async function generateDialogue(
  preferences: StylePreferences,
  frontImageBase64?: string
): Promise<DialogueResponse> {
  if (USE_MOCK) {
    return {
      turns: getMockDialogueTurns(preferences),
      recommendation: await generateRecommendations(preferences, frontImageBase64),
    };
  }

  const availableProviders = getAvailableDialogueProviders();
  const turns: DialogueTurn[] = [];

  if (availableProviders.length >= 2 && availableProviders.includes("claude")) {
    try {
      const claudeTurn = await generateClaudeDialogueTurn(preferences, frontImageBase64);
      turns.push(claudeTurn);

      try {
        const gptTurn = await generateGPTDialogueTurn(
          preferences,
          frontImageBase64,
          claudeTurn.text
        );
        turns.push(gptTurn);
      } catch (error) {
        console.warn("[dialogue] Falling back to a single dialogue turn", error);
      }
    } catch (error) {
      console.warn("[dialogue] Claude opening turn unavailable, trying GPT solo", error);

      if (availableProviders.includes("gpt")) {
        try {
          turns.push(await generateGPTDialogueTurn(preferences, frontImageBase64));
        } catch (gptError) {
          console.warn("[dialogue] GPT solo turn also failed", gptError);
        }
      }
    }
  } else if (availableProviders.length === 1) {
    try {
      turns.push(
        await generateSingleDialogueTurn(
          availableProviders[0],
          preferences,
          frontImageBase64
        )
      );
    } catch (error) {
      console.warn("[dialogue] Single-provider dialogue turn failed", error);
    }
  }

  const recommendation = await generateRecommendations(preferences, frontImageBase64);

  return {
    turns: turns.length > 0 ? turns : null,
    recommendation,
  };
}
