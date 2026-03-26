export interface TryOnInput {
  personImageUrl: string;   // URL or base64 data URL
  garmentImageUrl: string;  // URL or base64 data URL
  garmentCategory?: string; // e.g. "tops", "bottoms", "outerwear"
}

export interface TryOnOutput {
  outputImageUrl: string;
  provider: string;
  raw?: unknown;
}

export interface VirtualTryOnProvider {
  name: string;
  generateTryOn(input: TryOnInput): Promise<TryOnOutput>;
}
