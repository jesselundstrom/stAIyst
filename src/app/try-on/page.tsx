"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useSessionStore } from "@/lib/session/store";
import type { TryOnResult } from "@/types";
import { cn } from "@/lib/utils/cn";
import { getRecommendationCategoryLabel } from "@/lib/recommendation/categoryLabel";

type Status = "idle" | "loading" | "done" | "error";

export default function TryOnPage() {
  const router = useRouter();
  const {
    images,
    selectedProduct,
    selectedRecommendation,
    recommendations,
    setTryOnResult,
    tryOnResult,
    hasHydrated,
  } = useSessionStore();

  const [status, setStatus] = useState<Status>(tryOnResult ? "done" : "idle");
  const [result, setResult] = useState<TryOnResult | null>(tryOnResult);
  const [error, setError] = useState<string | null>(null);

  // Guard
  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!images.front || !selectedProduct) {
      router.replace("/recommendations");
    }
  }, [hasHydrated, images.front, selectedProduct, router]);

  const generate = useCallback(async () => {
    if (!images.front || !selectedProduct) return;

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageUrl: images.front,
          garmentImageUrl: selectedProduct.imageUrl,
          garmentCategory: selectedProduct.category ?? undefined,
        }),
      });

      if (!res.ok) throw new Error("Try-on request failed.");
      const data = (await res.json()) as TryOnResult;
      setResult(data);
      setTryOnResult(data);
      setStatus("done");
    } catch {
      setError("Preview generation failed. Please try again.");
      setStatus("error");
    }
  }, [images.front, selectedProduct, setTryOnResult]);

  // Auto-generate on first load
  useEffect(() => {
    if (status === "idle") {
      generate();
    }
  }, [status, generate]);

  if (!hasHydrated || !selectedProduct || !images.front) return null;

  const categoryLabel = selectedRecommendation
    ? getRecommendationCategoryLabel(selectedRecommendation.category)
    : null;
  const currencySymbol =
    selectedProduct.currencyCode === "GBP" ? "£"
    : selectedProduct.currencyCode === "USD" ? "$"
    : selectedProduct.currencyCode + " ";

  return (
    <PageShell>
      <div className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">
          Step 4 — Try-on
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Preview how this could look on you.
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: images */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Your photo</p>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                <Image
                  src={images.front}
                  alt="Your photo"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </div>

            {/* Try-on result */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Preview</p>
              <div
                className={cn(
                  "relative aspect-[3/4] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100",
                  "flex items-center justify-center"
                )}
              >
                {status === "loading" && (
                  <div className="flex flex-col items-center gap-3 text-neutral-400">
                    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <p className="text-xs">Generating preview…</p>
                  </div>
                )}

                {status === "done" && result && (
                  <Image
                    src={result.outputImageUrl}
                    alt="Try-on preview"
                    fill
                    className="animate-fade-in object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                )}

                {status === "error" && (
                  <div className="flex flex-col items-center gap-3 p-4 text-center">
                    <p className="text-xs text-red-500">{error}</p>
                    <Button size="sm" variant="outline" onClick={generate}>
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {status === "done" && (
            <p className="mt-3 text-xs text-neutral-400">
              Preview is AI-generated and may not be perfectly accurate.
            </p>
          )}
        </div>

        {/* Right: product info + actions */}
        <div className="flex flex-col gap-4">
          <Card>
            <div className="p-5 flex flex-col gap-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              </div>

              <div>
                {selectedProduct.brand && (
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    {selectedProduct.brand}
                  </p>
                )}
                <p className="text-sm font-semibold text-neutral-900 leading-snug">
                  {selectedProduct.title}
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {currencySymbol}{selectedProduct.price}
                </p>
              </div>

              {selectedRecommendation ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                        Why this item
                      </p>
                      <p className="text-sm font-semibold text-neutral-900">
                        {categoryLabel}
                      </p>
                      <p className="text-sm leading-relaxed text-neutral-600">
                        {selectedRecommendation.reason}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecommendation.targetColors.map((color) => (
                        <Badge key={color} variant="muted">
                          {color}
                        </Badge>
                      ))}
                      <Badge variant="outline">{selectedRecommendation.targetFit}</Badge>
                    </div>

                    {selectedRecommendation.supportingQuote ? (
                      <blockquote className="border-l border-neutral-300 pl-3 text-sm leading-relaxed text-neutral-600">
                        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                          From the review
                        </p>
                        <p>&ldquo;{selectedRecommendation.supportingQuote}&rdquo;</p>
                      </blockquote>
                    ) : null}

                    {recommendations?.styleSummary ? (
                      <p className="text-sm leading-relaxed text-neutral-500">
                        {recommendations.styleSummary}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <a
                  href={selectedProduct.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex h-10 w-full items-center justify-center rounded-md",
                    "bg-neutral-900 px-4 text-sm font-medium text-white",
                    "transition hover:bg-neutral-800"
                  )}
                >
                  Open product ↗
                </a>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={generate}
                  loading={status === "loading"}
                >
                  Regenerate preview
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/recommendations")}
                >
                  ← Back to recommendations
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
