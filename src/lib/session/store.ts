"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSession, StylePreferences, NormalizedProduct, RecommendationResponse } from "@/types";
import type { TryOnResult } from "@/types";

interface SessionStore extends AppSession {
  hasHydrated: boolean;
  setFrontImage(dataUrl: string): void;
  setBackImage(dataUrl: string | null): void;
  setPreferences(prefs: StylePreferences): void;
  setRecommendations(recs: RecommendationResponse): void;
  setSelectedProduct(product: NormalizedProduct | null): void;
  setTryOnResult(result: TryOnResult | null): void;
  setHasHydrated(hasHydrated: boolean): void;
  reset(): void;
}

const INITIAL_STATE: AppSession = {
  images: { front: null, back: null },
  preferences: null,
  recommendations: null,
  selectedProduct: null,
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

        setRecommendations: (recs) => set({ recommendations: recs }),

        setSelectedProduct: (product) => set({ selectedProduct: product }),

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
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
