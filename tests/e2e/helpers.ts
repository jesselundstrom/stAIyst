import { expect, type Page } from "@playwright/test";

type SeededSessionState = {
  images?: {
    front: string | null;
    back: string | null;
  };
  preferences?: {
    direction: string;
    budget: string;
    fit: string;
    colors: string;
  } | null;
  occasion?: "work" | "weekend" | "going-out" | null;
};

const DEFAULT_FRONT_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7Z4kAAAAASUVORK5CYII=";

async function seedSession(page: Page, state: SeededSessionState) {
  await page.addInitScript((seededState) => {
    localStorage.setItem(
      "staiyst-session",
      JSON.stringify({
        state: seededState,
        version: 0,
      })
    );
  }, seededStateWithDefaults(state));
}

function seededStateWithDefaults(state: SeededSessionState) {
  return {
    images: state.images ?? {
      front: DEFAULT_FRONT_IMAGE,
      back: null,
    },
    preferences: state.preferences ?? null,
    occasion: state.occasion ?? null,
  };
}

export async function seedRecommendationPrerequisites(page: Page) {
  await seedSession(page, {
    preferences: {
      direction: "minimal",
      budget: "medium",
      fit: "regular",
      colors: "neutral",
    },
    occasion: null,
  });
}

export async function seedOccasionPrerequisites(
  page: Page,
  occasion: "work" | "weekend" | "going-out"
) {
  const preferencesByOccasion = {
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
  } as const;

  await seedSession(page, {
    preferences: preferencesByOccasion[occasion],
    occasion,
  });
}

export async function seedManualPrerequisites(page: Page) {
  await seedSession(page, {
    preferences: {
      direction: "minimal",
      budget: "medium",
      fit: "regular",
      colors: "neutral",
    },
    occasion: null,
  });
}

export async function uploadValidFrontPhoto(page: Page) {
  const frontInput = page.locator('input[type="file"]').first();
  await frontInput.waitFor({ state: "attached" });

  await frontInput.evaluate(async (input) => {
    const fileInput = input as HTMLInputElement;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context unavailable.");
    }

    context.fillStyle = "#d6d3d1";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#44403c";
    context.fillRect(48, 48, 160, 160);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      throw new Error("Failed to create image blob.");
    }

    const file = new File([blob], "front-photo.png", { type: "image/png" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
}

async function goToPreferencesFromUpload(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /begin/i }).click();
  await expect(page).toHaveURL(/\/upload$/);
  await expect(
    page.getByRole("heading", { name: "Upload your photo" })
  ).toBeVisible();

  await uploadValidFrontPhoto(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/preferences$/);
}

export async function completeRecommendationSetup(page: Page) {
  await goToPreferencesFromUpload(page);
  await page.getByRole("button", { name: /work/i }).click();

  await expect(page).toHaveURL(/\/stylist-review$/);
  await expect(
    page.getByRole("heading", { name: "Two stylists are reviewing your look." })
  ).toBeVisible();
}

export async function completeManualRecommendationSetup(page: Page) {
  await goToPreferencesFromUpload(page);
  await page.getByRole("button", { name: /Or set your own preferences/i }).click();
  await page.getByRole("button", { name: "Minimal" }).click();
  await page.getByRole("button", { name: "Medium" }).click();
  await page.getByRole("button", { name: "Regular" }).click();
  await page.getByRole("button", { name: "Neutral" }).click();
  await page.getByRole("button", { name: "Get recommendations" }).click();

  await expect(page).toHaveURL(/\/stylist-review$/);
  await expect(
    page.getByRole("heading", { name: "Two stylists are reviewing your look." })
  ).toBeVisible();
}
