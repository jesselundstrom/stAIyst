import { expect, type Page } from "@playwright/test";

export async function seedRecommendationPrerequisites(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "staiyst-session",
      JSON.stringify({
        state: {
          images: {
            front:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7Z4kAAAAASUVORK5CYII=",
            back: null,
          },
          preferences: {
            direction: "minimal",
            budget: "medium",
            fit: "regular",
            colors: "neutral",
          },
        },
        version: 0,
      })
    );
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

export async function completeRecommendationSetup(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /begin/i }).click();
  await expect(page).toHaveURL(/\/upload$/);
  await expect(
    page.getByRole("heading", { name: "Upload your photo" })
  ).toBeVisible();

  await uploadValidFrontPhoto(page);
  await page.getByRole("button", { name: "Continue" }).click();

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
