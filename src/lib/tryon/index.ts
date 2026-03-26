import type { VirtualTryOnProvider, TryOnInput, TryOnOutput } from "./types";
import { mockTryOnProvider } from "./mock";
import { vertexTryOnProvider } from "./vertex";

const USE_MOCK =
  process.env.USE_MOCK_TRYON === "true" ||
  (!process.env.GOOGLE_CLOUD_PROJECT && !process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

function getProvider(): VirtualTryOnProvider {
  if (USE_MOCK) return mockTryOnProvider;

  // Future: add more providers here, e.g. based on an env var
  return vertexTryOnProvider;
}

export async function generateTryOn(input: TryOnInput): Promise<TryOnOutput> {
  const provider = getProvider();
  return provider.generateTryOn(input);
}

export type { TryOnInput, TryOnOutput, VirtualTryOnProvider };
