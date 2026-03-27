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
    occasion,
    recommendations,
    hasHydrated,
    setRecommendations,
  } = useSessionStore();

  const [dialogue, setDialogue] = useState<DialogueTurn[] | null>(null);
  const [pendingRecommendation, setPendingRecommendation] =
    useState<RecommendationResponse | null>(null);
  const [reviewComplete, setReviewComplete] = useState(false);
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

    if (recommendations && !pendingRecommendation) {
      router.replace("/recommendations");
    }
  }, [hasHydrated, images.front, preferences, recommendations, pendingRecommendation, router]);

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
      setReviewComplete(false);

      try {
        const res = await fetch("/api/recommend-dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences,
            frontImageBase64: images.front,
            occasion,
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
          setReviewComplete(true);
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
    occasion,
    preferences,
    recommendations,
    retryCount,
    router,
    setRecommendations,
  ]);

  function handleRetry() {
    setDialogue(null);
    setPendingRecommendation(null);
    setReviewComplete(false);
    setError(null);
    setLoading(true);
    setRetryCount((count) => count + 1);
  }

  function handleDialogueComplete() {
    if (pendingRecommendation) {
      setRecommendations(pendingRecommendation);
    }
    setReviewComplete(true);
  }

  function handleSeeProducts() {
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
            Step 3 of 4
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Two stylists are reviewing your look.
          </h1>
          <div className="space-y-2 text-sm leading-relaxed text-neutral-500">
            <p>They&apos;re comparing palette, texture, and proportion.</p>
            <p>Once they align on the direction, we&apos;ll show your final recommendations.</p>
          </div>
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
      ) : (
        <div className="flex flex-col gap-6">
          {dialogue ? (
            <StyleDialogue turns={dialogue} onComplete={handleDialogueComplete} />
          ) : (
            <div className="rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-neutral-900" />
                  <p className="text-sm font-medium text-neutral-700">
                    Reviewing your look
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="h-4 w-10/12 animate-pulse rounded bg-neutral-100" />
                  <div className="h-4 w-8/12 animate-pulse rounded bg-neutral-100" />
                  <div className="h-4 w-9/12 animate-pulse rounded bg-neutral-100" />
                </div>

                <div className="space-y-2 text-sm leading-relaxed text-neutral-500">
                  <p>They&apos;re pulling together a refined direction now.</p>
                  <p>The final edit will appear here before you move into the product view.</p>
                </div>

                {!loading ? (
                  <p className="text-xs italic text-neutral-400">
                    Finalizing your recommendations.
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {reviewComplete && pendingRecommendation ? (
            <div className="animate-fade-up rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                    Final direction
                  </p>
                  <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                    Your direction is clearer now.
                  </h2>
                  <div className="space-y-2 text-sm leading-relaxed text-neutral-500">
                    <p>Here&apos;s the overall direction the stylists aligned on.</p>
                    <p>{pendingRecommendation.styleSummary}</p>
                  </div>
                </div>

                <div>
                  <Button size="lg" onClick={handleSeeProducts}>
                    See recommended products
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
