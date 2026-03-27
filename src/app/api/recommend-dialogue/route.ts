import { NextRequest, NextResponse } from "next/server";
import { generateDialogue } from "@/lib/ai/dialogue";
import {
  isRecommendationServiceError,
} from "@/lib/ai/recommend";
import type { OccasionMode, StylePreferences } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      preferences: StylePreferences;
      frontImageBase64?: string;
      occasion?: OccasionMode;
    };

    if (!body.preferences) {
      return NextResponse.json({ error: "Missing preferences" }, { status: 400 });
    }

    const result = await generateDialogue(
      body.preferences,
      body.frontImageBase64,
      body.occasion
    );

    return NextResponse.json(result);
  } catch (err) {
    if (isRecommendationServiceError(err)) {
      console.warn("[recommend-dialogue] Service error", {
        status: err.status,
        requestId: err.requestId,
        retryable: err.retryable,
      });

      return NextResponse.json(
        { error: err.message, retryable: err.retryable },
        {
          status: err.status,
          headers: err.retryable ? { "Retry-After": "5" } : undefined,
        }
      );
    }

    console.error("[recommend-dialogue] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}
