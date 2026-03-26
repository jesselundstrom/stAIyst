"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { RecommendationSlot } from "@/components/recommendation/RecommendationSlot";
import { Button } from "@/components/ui/Button";
import { useSessionStore } from "@/lib/session/store";
import type { NormalizedProduct, RecommendationResponse } from "@/types";

type SlotProducts = {
  products: NormalizedProduct[];
  loading: boolean;
  error: string | null;
};

export default function RecommendationsPage() {
  const router = useRouter();
  const { images, preferences, recommendations, setRecommendations, setSelectedProduct } =
    useSessionStore();

  const [recLoading, setRecLoading] = useState(!recommendations);
  const [recError, setRecError] = useState<string | null>(null);
  const [recs, setRecs] = useState<RecommendationResponse | null>(recommendations);

  const [slots, setSlots] = useState<SlotProducts[]>([]);

  // Guard
  useEffect(() => {
    if (!images.front || !preferences) {
      router.replace("/upload");
    }
  }, [images.front, preferences, router]);

  // Step 1: fetch recommendations
  useEffect(() => {
    if (recs) {
      return; // already loaded
    }

    async function fetchRecs() {
      setRecLoading(true);
      setRecError(null);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences,
            frontImageBase64: images.front,
          }),
        });
        if (!res.ok) throw new Error("Recommendation request failed.");
        const data = (await res.json()) as RecommendationResponse;
        setRecs(data);
        setRecommendations(data);
      } catch {
        setRecError("We couldn't generate recommendations right now. Please try again.");
      } finally {
        setRecLoading(false);
      }
    }

    fetchRecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        .then((r) => {
          if (!r.ok) throw new Error("Product fetch failed.");
          return r.json() as Promise<{ products: NormalizedProduct[] }>;
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

  function handleTryOn(product: NormalizedProduct) {
    setSelectedProduct(product);
    router.push("/try-on");
  }

  if (!preferences || !images.front) return null;

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
            Step 3 — Recommendations
          </p>
          {recLoading ? (
            <>
              <div className="h-6 w-64 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-48 animate-pulse rounded bg-neutral-100" />
            </>
          ) : recError ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-red-500">{recError}</p>
              <Button variant="outline" size="sm" onClick={() => { setRecs(null); setRecLoading(true); }}>
                Retry
              </Button>
            </div>
          ) : recs ? (
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
