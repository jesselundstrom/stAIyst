"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { RecommendationSlot } from "@/components/recommendation/RecommendationSlot";
import { useSessionStore } from "@/lib/session/store";
import type {
  NormalizedProduct,
  Recommendation,
  RecommendationResponse,
} from "@/types";

type SlotProducts = {
  products: NormalizedProduct[];
  loading: boolean;
  error: string | null;
};

export default function RecommendationsPage() {
  const router = useRouter();
  const {
    images,
    preferences,
    recommendations,
    setSelectedProduct,
    setSelectedRecommendation,
    hasHydrated,
  } = useSessionStore();

  const [recs, setRecs] = useState<RecommendationResponse | null>(recommendations);
  const [slots, setSlots] = useState<SlotProducts[]>([]);

  // Guard
  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!images.front || !preferences) {
      router.replace("/upload");
      return;
    }

    if (!recommendations) {
      router.replace("/stylist-review");
    }
  }, [hasHydrated, images.front, preferences, recommendations, router]);

  useEffect(() => {
    setRecs(recommendations);
  }, [recommendations]);

  // Step 2: fetch products for each slot once recs arrive
  useEffect(() => {
    if (!recs) return;

    setSlots(
      recs.recommendations.map(() => ({ products: [], loading: true, error: null }))
    );

    recs.recommendations.forEach((rec, i) => {
      fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation: rec }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Product fetch failed.");
          return response.json() as Promise<{ products: NormalizedProduct[] }>;
        })
        .then(({ products }) => {
          setSlots((prev) => {
            const next = [...prev];
            next[i] = { products, loading: false, error: null };
            return next;
          });
        })
        .catch(() => {
          setSlots((prev) => {
            const next = [...prev];
            next[i] = {
              products: [],
              loading: false,
              error: "Couldn't load products for this category.",
            };
            return next;
          });
        });
    });
  }, [recs]);

  function handleTryOn(product: NormalizedProduct, recommendation: Recommendation) {
    setSelectedProduct(product);
    setSelectedRecommendation(recommendation);
    router.push("/try-on");
  }

  if (!hasHydrated || !preferences || !images.front) return null;

  return (
    <PageShell>
      {/* Header row */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Uploaded photo thumbnail */}
        <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200">
          <Image
            src={images.front}
            alt="Your photo"
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Step 4 of 4
          </p>
          {recs ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
                We found a cleaner direction for this look.
              </h1>
              <p className="text-sm leading-relaxed text-neutral-500">
                {recs.styleSummary}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* Recommendation slots */}
      {recs && (
        <div className="flex flex-col gap-12">
          {recs.recommendations.map((rec, i) => (
            <RecommendationSlot
              key={rec.category + i}
              recommendation={rec}
              products={slots[i]?.products ?? []}
              loading={slots[i]?.loading ?? true}
              error={slots[i]?.error ?? null}
              onTryOn={handleTryOn}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
