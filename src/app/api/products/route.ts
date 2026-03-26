import { NextRequest, NextResponse } from "next/server";
import { searchProductsForRecommendation } from "@/lib/shopify/search";
import type { Recommendation } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { recommendation: Recommendation };

    if (!body.recommendation) {
      return NextResponse.json({ error: "Missing recommendation" }, { status: 400 });
    }

    const products = await searchProductsForRecommendation(body.recommendation);

    return NextResponse.json({ products });
  } catch (err) {
    console.error("[products] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
