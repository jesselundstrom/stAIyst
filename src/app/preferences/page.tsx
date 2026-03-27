"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useSessionStore } from "@/lib/session/store";
import type {
  Budget,
  ColorPreference,
  FitPreference,
  OccasionMode,
  StyleDirection,
  StylePreferences,
} from "@/types";

type Option<T> = { value: T; label: string; description: string };
type PreferencesMode = "occasion" | "manual";

const STYLE_OPTIONS: Option<StyleDirection>[] = [
  { value: "minimal", label: "Minimal", description: "Clean, understated, intentional" },
  { value: "smart-casual", label: "Smart casual", description: "Relaxed but put-together" },
  { value: "classic", label: "Classic", description: "Timeless, structured, refined" },
  { value: "streetwear", label: "Streetwear", description: "Bold, relaxed, contemporary" },
];

const BUDGET_OPTIONS: Option<Budget>[] = [
  { value: "low", label: "Low", description: "Everyday price point" },
  { value: "medium", label: "Medium", description: "Mid-range investment" },
  { value: "premium", label: "Premium", description: "High-end, considered pieces" },
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

const OCCASION_OPTIONS: Array<{
  value: OccasionMode;
  label: string;
  description: string;
}> = [
  { value: "work", label: "Work", description: "Sharp, polished, professional" },
  { value: "weekend", label: "Weekend", description: "Relaxed, effortless, easy" },
  {
    value: "going-out",
    label: "Going out",
    description: "Elevated, refined, occasion-ready",
  },
];

const OCCASION_PREFERENCES: Record<OccasionMode, StylePreferences> = {
  work: {
    direction: "classic",
    budget: "medium",
    fit: "regular",
    colors: "neutral",
  },
  weekend: {
    direction: "smart-casual",
    budget: "low",
    fit: "relaxed",
    colors: "earthy",
  },
  "going-out": {
    direction: "classic",
    budget: "premium",
    fit: "slim",
    colors: "monochrome",
  },
};

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

function formatPresetLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function OccasionCard({
  label,
  description,
  hint,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  hint: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group flex min-h-[172px] flex-col justify-between rounded-[1.75rem] border p-8 text-left transition-all duration-300",
        selected
          ? "border-neutral-900 bg-neutral-900 text-white shadow-[0_20px_40px_rgba(23,23,23,0.16)]"
          : "border-neutral-200 bg-white text-neutral-900 shadow-sm hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md",
        disabled && !selected ? "cursor-not-allowed opacity-80" : ""
      )}
    >
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-3xl font-medium tracking-tight">{label}</h2>
        <p
          className={cn(
            "max-w-sm text-sm leading-relaxed",
            selected ? "text-neutral-300" : "text-neutral-500"
          )}
        >
          {description}
        </p>
      </div>

      <span
        className={cn(
          "text-xs font-medium uppercase tracking-[0.24em]",
          selected ? "text-neutral-300" : "text-neutral-400"
        )}
      >
        {hint}
      </span>
    </button>
  );
}

export default function PreferencesPage() {
  const router = useRouter();
  const {
    preferences,
    occasion,
    setPreferences,
    setOccasion,
    clearGeneratedState,
    images,
    hasHydrated,
  } = useSessionStore();

  const [modeOverride, setModeOverride] = useState<PreferencesMode | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [direction, setDirection] = useState<StyleDirection | null | undefined>(undefined);
  const [budget, setBudget] = useState<Budget | null | undefined>(undefined);
  const [fit, setFit] = useState<FitPreference | null | undefined>(undefined);
  const [colors, setColors] = useState<ColorPreference | null | undefined>(undefined);
  const [selectedOccasion, setSelectedOccasion] = useState<
    OccasionMode | null | undefined
  >(undefined);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!images.front) {
      router.replace("/upload");
    }
  }, [hasHydrated, images.front, router]);

  if (!hasHydrated || !images.front) {
    return null;
  }

  const mode = modeOverride ?? "occasion";
  const selectedDirection = direction ?? preferences?.direction ?? null;
  const selectedBudget = budget ?? preferences?.budget ?? null;
  const selectedFit = fit ?? preferences?.fit ?? null;
  const selectedColors = colors ?? preferences?.colors ?? null;
  const activeOccasion = selectedOccasion ?? occasion ?? null;
  const canContinue = Boolean(
    selectedDirection && selectedBudget && selectedFit && selectedColors
  );

  function handleOccasionSelect(nextOccasion: OccasionMode) {
    if (isNavigating) {
      return;
    }

    const mappedPreferences = OCCASION_PREFERENCES[nextOccasion];

    clearGeneratedState();
    setSelectedOccasion(nextOccasion);
    setDirection(mappedPreferences.direction);
    setBudget(mappedPreferences.budget);
    setFit(mappedPreferences.fit);
    setColors(mappedPreferences.colors);
    setPreferences(mappedPreferences);
    setOccasion(nextOccasion);
    setModeOverride("occasion");
    setIsNavigating(true);
    router.push("/stylist-review");
  }

  function handleManualContinue() {
    if (!canContinue || isNavigating) {
      return;
    }

    clearGeneratedState();
    setSelectedOccasion(null);
    setPreferences({
      direction: selectedDirection!,
      budget: selectedBudget!,
      fit: selectedFit!,
      colors: selectedColors!,
    });
    setOccasion(null);
    setModeOverride("manual");
    setIsNavigating(true);
    router.push("/stylist-review");
  }

  return (
    <PageShell narrow>
      <div className="transition-opacity duration-300">
        {mode === "occasion" ? (
          <>
            <div className="mb-10">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">
                Step 2
              </p>
              <h1 className="font-display mb-3 text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl">
                What are you dressing for?
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-neutral-500">
                Pick the occasion and we&apos;ll handle the rest.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {OCCASION_OPTIONS.map((option) => (
                <OccasionCard
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  hint={`${formatPresetLabel(OCCASION_PREFERENCES[option.value].direction)} / ${formatPresetLabel(OCCASION_PREFERENCES[option.value].budget)} / ${formatPresetLabel(OCCASION_PREFERENCES[option.value].fit)}`}
                  selected={activeOccasion === option.value}
                  disabled={isNavigating}
                  onClick={() => handleOccasionSelect(option.value)}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setModeOverride("manual")}
                disabled={isNavigating}
                className="text-sm text-neutral-500 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Or set your own preferences -&gt;
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-10">
              <button
                type="button"
                onClick={() => setModeOverride("occasion")}
                disabled={isNavigating}
                className="mb-4 text-sm text-neutral-500 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                &lt;- Back
              </button>
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">
                Step 2
              </p>
              <h1 className="mb-3 text-2xl font-semibold tracking-tight text-neutral-900">
                Style preferences
              </h1>
              <p className="text-sm leading-relaxed text-neutral-500">
                A few quick choices to calibrate your recommendations.
              </p>
            </div>

            <div className="flex flex-col gap-8 transition-opacity duration-300">
              <OptionGrid
                label="Style direction"
                options={STYLE_OPTIONS}
                value={selectedDirection}
                onChange={setDirection}
              />
              <OptionGrid
                label="Budget per item"
                options={BUDGET_OPTIONS}
                value={selectedBudget}
                onChange={setBudget}
              />
              <OptionGrid
                label="Fit preference"
                options={FIT_OPTIONS}
                value={selectedFit}
                onChange={setFit}
              />
              <OptionGrid
                label="Colour preference"
                options={COLOR_OPTIONS}
                value={selectedColors}
                onChange={setColors}
              />
            </div>

            <div className="mt-10 flex justify-end">
              <Button
                size="lg"
                disabled={!canContinue || isNavigating}
                onClick={handleManualContinue}
              >
                Get recommendations
              </Button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
