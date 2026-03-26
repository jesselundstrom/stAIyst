import type { VirtualTryOnProvider, TryOnInput, TryOnOutput } from "./types";

/**
 * Mock provider — returns the garment image as the "result".
 * Used when no real provider is configured or USE_MOCK_TRYON=true.
 */
export const mockTryOnProvider: VirtualTryOnProvider = {
  name: "mock",

  async generateTryOn(input: TryOnInput): Promise<TryOnOutput> {
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1500));

    return {
      outputImageUrl: input.garmentImageUrl,
      provider: "mock",
      raw: { note: "Mock try-on — configure a real provider for actual results." },
    };
  },
};
