"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StyleDialogue } from "@/components/dialogue/StyleDialogue";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { useSessionStore } from "@/lib/session/store";
import type {
  DialogueResponse,
  DialogueTurn,
  RecommendationResponse,
} from "@/types";

type RecommendationErrorResponse = {
  error?: string;
};

const FALLBACK_REVIEW_DELAY_MS = 1400;

export default function StylistReviewPage() {
  const router = useRouter();
  const {
    images,
    preferences,
    recommendations,
    hasHydrated,
    setRecommendations,
  } = useSessionStore();

  const [dialogue, setDialogue] = useState<DialogueTurn[] | null>(null);
  const [pendingRecommendation, setPendingRecommendation] =
    useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const requestStartedAtRef = useRef(0);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!images.front || !preferences) {
      router.replace("/upload");
      return;
    }

    if (recommendations) {
      router.replace("/recommendations");
    }
  }, [hasHydrated, images.front, preferences, recommendations, router]);

  useEffect(() => {
    if (!hasHydrated || !images.front || !preferences || recommendations) {
      return;
    }

    let cancelled = false;
    requestStartedAtRef.current = Date.now();

    async function fetchReview() {
      setLoading(true);
      setError(null);
      setDialogue(null);
      setPendingRecommendation(null);

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

        if (cancelled) {
          return;
        }

        setPendingRecommendation(data.recommendation);

        if (data.turns === null) {
          const elapsed = Date.now() - requestStartedAtRef.current;
          const remainingDelay = Math.max(FALLBACK_REVIEW_DELAY_MS - elapsed, 0);

          if (remainingDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingDelay));
          }

          if (cancelled) {
            return;
          }

          setRecommendations(data.recommendation);
          router.replace("/recommendations");
          return;
        }

        setDialogue(data.turns);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "We couldn't generate recommendations right now. Please try again."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchReview();

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    images.front,
    preferences,
    recommendations,
    retryCount,
    router,
    setRecommendations,
  ]);

  function handleRetry() {
    setDialogue(null);
    setPendingRecommendation(null);
    setError(null);
    setLoading(true);
    setRetryCount((count) => count + 1);
  }

  function handleDialogueComplete() {
    if (pendingRecommendation) {
      setRecommendations(pendingRecommendation);
    }
    router.replace("/recommendations");
  }

  if (!hasHydrated || !images.front || !preferences) {
    return null;
  }

  return (
    <PageShell narrow>
      <div className="mb-10 flex items-start gap-5">
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200">
          <Image
            src={images.front}
            alt="Your uploaded photo"
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Step 3 - Stylist review
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Two stylists are reviewing your look.
          </h1>
          <p className="text-sm leading-relaxed text-neutral-500">
            We&apos;re comparing perspective, palette, and proportion before landing on
            your final recommendations.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-red-500">{error}</p>
            <div>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : dialogue ? (
        <StyleDialogue turns={dialogue} onComplete={handleDialogueComplete} />
      ) : (
        <div className="rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-neutral-900" />
              <p className="text-sm font-medium text-neutral-700">Reviewing your look</p>
            </div>

            <div className="space-y-3">
              <div className="h-4 w-10/12 animate-pulse rounded bg-neutral-100" />
              <div className="h-4 w-8/12 animate-pulse rounded bg-neutral-100" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-neutral-100" />
            </div>

            <p className="text-sm leading-relaxed text-neutral-500">
              Pulling together a refined direction before we show the final edit.
            </p>

            {!loading ? (
              <p className="text-xs italic text-neutral-400">
                Finalizing your recommendations.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </PageShell>
  );
}
