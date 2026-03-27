"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSession,
  StylePreferences,
  NormalizedProduct,
  RecommendationResponse,
  Recommendation,
  OccasionMode,
} from "@/types";
import type { TryOnResult } from "@/types";

interface SessionStore extends AppSession {
  hasHydrated: boolean;
  setFrontImage(dataUrl: string): void;
  setBackImage(dataUrl: string | null): void;
  setPreferences(prefs: StylePreferences): void;
  setOccasion(occasion: OccasionMode | null): void;
  setRecommendations(recs: RecommendationResponse): void;
  clearGeneratedState(): void;
  setSelectedProduct(product: NormalizedProduct | null): void;
  setSelectedRecommendation(recommendation: Recommendation | null): void;
  setTryOnResult(result: TryOnResult | null): void;
  setHasHydrated(hasHydrated: boolean): void;
  reset(): void;
}

const INITIAL_STATE: AppSession = {
  images: { front: null, back: null },
  preferences: null,
  occasion: null,
  recommendations: null,
  selectedProduct: null,
  selectedRecommendation: null,
  tryOnResult: null,
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => {
      if (typeof window !== "undefined") {
        queueMicrotask(() => {
          set({ hasHydrated: true });
        });
      }

      return {
        ...INITIAL_STATE,
        hasHydrated: false,

        setFrontImage: (dataUrl) =>
          set((s) => ({ images: { ...s.images, front: dataUrl } })),

        setBackImage: (dataUrl) =>
          set((s) => ({ images: { ...s.images, back: dataUrl } })),

        setPreferences: (prefs) => set({ preferences: prefs }),

        setOccasion: (occasion) => set({ occasion }),

        setRecommendations: (recs) =>
          set({
            recommendations: recs,
            selectedProduct: null,
            selectedRecommendation: null,
            tryOnResult: null,
          }),

        clearGeneratedState: () =>
          set({
            recommendations: null,
            selectedProduct: null,
            selectedRecommendation: null,
            tryOnResult: null,
          }),

        setSelectedProduct: (product) => set({ selectedProduct: product }),

        setSelectedRecommendation: (recommendation) =>
          set({ selectedRecommendation: recommendation }),

        setTryOnResult: (result) => set({ tryOnResult: result }),

        setHasHydrated: (hasHydrated) => set({ hasHydrated }),

        reset: () => set(INITIAL_STATE),
      };
    },
    {
      name: "staiyst-session",
      // Only persist images and preferences — skip large base64 blobs from recommendations
      partialize: (s) => ({
        images: s.images,
        preferences: s.preferences,
        occasion: s.occasion,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
