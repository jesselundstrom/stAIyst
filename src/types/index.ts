// ─── Style Preferences ─────────────────────────────────────────────────────

export type StyleDirection = "minimal" | "smart-casual" | "classic" | "streetwear";
export type Budget = "low" | "medium" | "premium";
export type FitPreference = "relaxed" | "regular" | "slim";
export type ColorPreference = "neutral" | "earthy" | "monochrome" | "mixed";
export type OccasionMode = "work" | "weekend" | "going-out";

export interface StylePreferences {
  direction: StyleDirection;
  budget: Budget;
  fit: FitPreference;
  colors: ColorPreference;
}

// ─── Session / Upload State ────────────────────────────────────────────────

export interface UploadedImages {
  front: string | null;   // base64 data URL or object URL
  back: string | null;
}

// ─── Recommendation Engine ──────────────────────────────────────────────────

export interface Recommendation {
  category: string;
  reason: string;
  targetColors: string[];
  targetFit: string;
  searchTerms: string[];
}

export interface RecommendationResponse {
  styleSummary: string;
  recommendations: Recommendation[];
}

export type DialogueParticipant = "claude" | "gpt";

export interface DialogueTurn {
  participant: DialogueParticipant;
  text: string;
}

export interface DialogueResponse {
  turns: DialogueTurn[] | null;
  recommendation: RecommendationResponse;
}

// ─── Products ──────────────────────────────────────────────────────────────

export interface NormalizedProduct {
  id: string;
  title: string;
  brand: string | null;
  price: string;
  currencyCode: string;
  imageUrl: string;
  productUrl: string;
  available: boolean;
  category: string | null;
}

export interface ProductSlot {
  recommendation: Recommendation;
  products: NormalizedProduct[];
  loading: boolean;
  error: string | null;
}

// ─── Try-On ────────────────────────────────────────────────────────────────

export interface TryOnInput {
  personImageUrl: string;
  garmentImageUrl: string;
  garmentCategory?: string;
}

export interface TryOnResult {
  outputImageUrl: string;
  provider: string;
  raw?: unknown;
}

// ─── App Session State ─────────────────────────────────────────────────────

export interface AppSession {
  images: UploadedImages;
  preferences: StylePreferences | null;
  occasion: OccasionMode | null;
  recommendations: RecommendationResponse | null;
  selectedProduct: NormalizedProduct | null;
  tryOnResult: TryOnResult | null;
}
