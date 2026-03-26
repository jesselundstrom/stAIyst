"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useSessionStore } from "@/lib/session/store";
import type {
  StyleDirection,
  Budget,
  FitPreference,
  ColorPreference,
  StylePreferences,
} from "@/types";

type Option<T> = { value: T; label: string; description: string };

const STYLE_OPTIONS: Option<StyleDirection>[] = [
  { value: "minimal", label: "Minimal", description: "Clean, understated, intentional" },
  { value: "smart-casual", label: "Smart casual", description: "Relaxed but put-together" },
  { value: "classic", label: "Classic", description: "Timeless, structured, refined" },
  { value: "streetwear", label: "Streetwear", description: "Bold, relaxed, contemporary" },
];

const BUDGET_OPTIONS: Option<Budget>[] = [
  { value: "low", label: "Low", description: "Under £60 per piece" },
  { value: "medium", label: "Medium", description: "£60–£200 per piece" },
  { value: "premium", label: "Premium", description: "£200+ per piece" },
];

const FIT_OPTIONS: Option<FitPreference>[] = [
  { value: "relaxed", label: "Relaxed", description: "Comfortable, easy fit" },
  { value: "regular", label: "Regular", description: "Standard, versatile fit" },
  { value: "slim", label: "Slim", description: "Close-fitting, tailored feel" },
];

const COLOR_OPTIONS: Option<ColorPreference>[] = [
  { value: "neutral", label: "Neutral", description: "White, grey, off-white" },
  { value: "earthy", label: "Earthy", description: "Camel, olive, terracotta" },
  { value: "monochrome", label: "Monochrome", description: "Black, white, charcoal" },
  { value: "mixed", label: "Mixed", description: "Open to colour" },
];

function OptionGrid<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-neutral-700">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-4 text-left transition",
              value === opt.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
            )}
          >
            <span className="text-sm font-medium">{opt.label}</span>
            <span
              className={cn(
                "text-xs leading-snug",
                value === opt.value ? "text-neutral-300" : "text-neutral-400"
              )}
            >
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  const router = useRouter();
  const { preferences, setPreferences, images } = useSessionStore();

  const [direction, setDirection] = useState<StyleDirection | null>(
    preferences?.direction ?? null
  );
  const [budget, setBudget] = useState<Budget | null>(preferences?.budget ?? null);
  const [fit, setFit] = useState<FitPreference | null>(preferences?.fit ?? null);
  const [colors, setColors] = useState<ColorPreference | null>(
    preferences?.colors ?? null
  );

  // Guard: redirect if no image uploaded
  if (!images.front && typeof window !== "undefined") {
    router.replace("/upload");
    return null;
  }

  const canContinue = direction && budget && fit && colors;

  function handleContinue() {
    if (!canContinue) return;
    setPreferences({
      direction: direction!,
      budget: budget!,
      fit: fit!,
      colors: colors!,
    } satisfies StylePreferences);
    router.push("/recommendations");
  }

  return (
    <PageShell narrow>
      <div className="mb-10">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">Step 2</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-neutral-900">
          Style preferences
        </h1>
        <p className="text-sm leading-relaxed text-neutral-500">
          A few quick choices to calibrate your recommendations.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <OptionGrid
          label="Style direction"
          options={STYLE_OPTIONS}
          value={direction}
          onChange={setDirection}
        />
        <OptionGrid
          label="Budget per item"
          options={BUDGET_OPTIONS}
          value={budget}
          onChange={setBudget}
        />
        <OptionGrid
          label="Fit preference"
          options={FIT_OPTIONS}
          value={fit}
          onChange={setFit}
        />
        <OptionGrid
          label="Colour preference"
          options={COLOR_OPTIONS}
          value={colors}
          onChange={setColors}
        />
      </div>

      <div className="mt-10 flex justify-end">
        <Button size="lg" disabled={!canContinue} onClick={handleContinue}>
          Get recommendations
        </Button>
      </div>
    </PageShell>
  );
}
