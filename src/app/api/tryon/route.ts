import { NextRequest, NextResponse } from "next/server";
import { generateTryOn } from "@/lib/tryon";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      personImageUrl: string;
      garmentImageUrl: string;
      garmentCategory?: string;
    };

    if (!body.personImageUrl || !body.garmentImageUrl) {
      return NextResponse.json(
        { error: "Missing personImageUrl or garmentImageUrl" },
        { status: 400 }
      );
    }

    const result = await generateTryOn({
      personImageUrl: body.personImageUrl,
      garmentImageUrl: body.garmentImageUrl,
      garmentCategory: body.garmentCategory,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[tryon] Error:", err);
    return NextResponse.json(
      { error: "Virtual try-on failed. Please try again." },
      { status: 500 }
    );
  }
}
