import { NextRequest, NextResponse } from "next/server";
import {
  generateRecommendations,
  isRecommendationServiceError,
} from "@/lib/ai/recommend";
import type { StylePreferences } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      preferences: StylePreferences;
      frontImageBase64?: string;
    };

    if (!body.preferences) {
      return NextResponse.json({ error: "Missing preferences" }, { status: 400 });
    }

    const result = await generateRecommendations(
      body.preferences,
      body.frontImageBase64
    );

    return NextResponse.json(result);
  } catch (err) {
    if (isRecommendationServiceError(err)) {
      console.warn("[recommend] Service error", {
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

    console.error("[recommend] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}
