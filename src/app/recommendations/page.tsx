"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StyleDialogue } from "@/components/dialogue/StyleDialogue";
import { PageShell } from "@/components/layout/PageShell";
import { RecommendationSlot } from "@/components/recommendation/RecommendationSlot";
import { Button } from "@/components/ui/Button";
import { useSessionStore } from "@/lib/session/store";
import { cn } from "@/lib/utils/cn";
import type {
  DialogueResponse,
  DialogueTurn,
  NormalizedProduct,
  RecommendationResponse,
} from "@/types";

type SlotProducts = {
  products: NormalizedProduct[];
  loading: boolean;
  error: string | null;
};

type RecommendationErrorResponse = {
  error?: string;
};

export default function RecommendationsPage() {
  const router = useRouter();
  const {
    images,
    preferences,
    recommendations,
    setRecommendations,
    setSelectedProduct,
    hasHydrated,
  } = useSessionStore();

  const [recLoading, setRecLoading] = useState(!recommendations);
  const [recError, setRecError] = useState<string | null>(null);
  const [recs, setRecs] = useState<RecommendationResponse | null>(recommendations);
  const [dialogue, setDialogue] = useState<DialogueTurn[] | null>(null);
  const [dialogueComplete, setDialogueComplete] = useState(Boolean(recommendations));
  const [slots, setSlots] = useState<SlotProducts[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  // Guard
  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!images.front || !preferences) {
      router.replace("/upload");
    }
  }, [hasHydrated, images.front, preferences, router]);

  // Step 1: fetch recommendations
  useEffect(() => {
    if (!hasHydrated || recs || !preferences || !images.front) {
      return;
    }

    let cancelled = false;

    async function fetchRecs() {
      setRecLoading(true);
      setRecError(null);
      setDialogue(null);
      setDialogueComplete(false);

      try {
        const res = await fetch("/api/recommend-dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences,
            frontImageBase64: images.front,
          }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as
            | RecommendationErrorResponse
            | null;
          throw new Error(
            payload?.error ??
              "We couldn't generate recommendations right now. Please try again."
          );
        }

        const data = (await res.json()) as DialogueResponse;
        if (cancelled) return;

        setDialogue(data.turns);
        setDialogueComplete(data.turns === null);
        setRecs(data.recommendation);
        setRecommendations(data.recommendation);
      } catch (error) {
        if (cancelled) return;

        setDialogue(null);
        setDialogueComplete(false);
        setRecError(
          error instanceof Error
            ? error.message
            : "We couldn't generate recommendations right now. Please try again."
        );
      } finally {
        if (cancelled) return;
        setRecLoading(false);
      }
    }

    void fetchRecs();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, recs, preferences, images.front, setRecommendations, retryCount]);

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

  function handleTryOn(product: NormalizedProduct) {
    setSelectedProduct(product);
    router.push("/try-on");
  }

  function handleRetry() {
    setRecs(null);
    setDialogue(null);
    setDialogueComplete(false);
    setRecError(null);
    setRecLoading(true);
    setRetryCount((count) => count + 1);
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
            Step 3 - Recommendations
          </p>
          {recLoading ? (
            <>
              <div className="h-6 w-64 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-48 animate-pulse rounded bg-neutral-100" />
            </>
          ) : recError ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-red-500">{recError}</p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
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

      {dialogue && !recError ? (
        <div className="mb-8">
          {dialogueComplete ? (
            <p className="text-xs italic text-neutral-400">
              {dialogue.length > 1
                ? "Two perspectives considered."
                : "One stylist perspective was available."}
            </p>
          ) : (
            <StyleDialogue
              turns={dialogue}
              onComplete={() => setDialogueComplete(true)}
            />
          )}
        </div>
      ) : null}

      {/* Recommendation slots */}
      {recs && (
        <div
          className={cn(
            "flex flex-col gap-12 transition-all duration-500",
            dialogue && !dialogueComplete
              ? "pointer-events-none translate-y-2 opacity-0"
              : "translate-y-0 opacity-100"
          )}
        >
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
