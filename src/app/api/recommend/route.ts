import { NextRequest, NextResponse } from "next/server";
import { generateRecommendations } from "@/lib/ai/recommend";
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
    console.error("[recommend] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}
