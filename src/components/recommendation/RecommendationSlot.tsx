"use client";

import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/product/ProductCard";
import type { Recommendation, NormalizedProduct } from "@/types";
import { getRecommendationCategoryLabel } from "@/lib/recommendation/categoryLabel";

interface RecommendationSlotProps {
  recommendation: Recommendation;
  products: NormalizedProduct[];
  loading: boolean;
  error: string | null;
  onTryOn: (product: NormalizedProduct, recommendation: Recommendation) => void;
}

export function RecommendationSlot({
  recommendation,
  products,
  loading,
  error,
  onTryOn,
}: RecommendationSlotProps) {
  const categoryLabel = getRecommendationCategoryLabel(recommendation.category);

  return (
    <div className="flex flex-col gap-5">
      {/* Slot header */}
      <div className="flex flex-col gap-2 border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-neutral-900">{categoryLabel}</h3>
        </div>
        <p className="text-sm text-neutral-500">{recommendation.reason}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {recommendation.targetColors.map((color) => (
            <Badge key={color} variant="muted">
              {color}
            </Badge>
          ))}
          <Badge variant="outline">{recommendation.targetFit}</Badge>
        </div>
        {recommendation.supportingQuote ? (
          <blockquote className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              From the review
            </p>
            <p>&ldquo;{recommendation.supportingQuote}&rdquo;</p>
          </blockquote>
        ) : null}
      </div>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-400">No matching products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="animate-fade-up"
              style={{ "--animation-delay": `${i * 60}ms` } as CSSProperties}
            >
              <ProductCard
                product={product}
                onTryOn={(selectedProduct) => onTryOn(selectedProduct, recommendation)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="aspect-[3/4] w-full animate-pulse bg-neutral-100" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
        <div className="mt-1 h-7 w-full animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
