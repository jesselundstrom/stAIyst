import { expect, test } from "@playwright/test";
import {
  completeManualRecommendationSetup,
  completeRecommendationSetup,
  seedManualPrerequisites,
  seedOccasionPrerequisites,
  seedRecommendationPrerequisites,
} from "./helpers";

test.describe("critical user flows", () => {
  test("redirects direct review access back to upload without session state", async ({
    page,
  }) => {
    await page.goto("/stylist-review");

    await expect(page).toHaveURL(/\/upload$/);
    await expect(
      page.getByRole("heading", { name: "Upload your photo" })
    ).toBeVisible();
  });

  test("redirects direct recommendation access into stylist review when prerequisites exist", async ({
    page,
  }) => {
    await seedRecommendationPrerequisites(page);
    await page.goto("/recommendations");

    await expect(page).toHaveURL(/\/stylist-review$/);
    await expect(
      page.getByRole("heading", { name: "Two stylists are reviewing your look." })
    ).toBeVisible();
  });

  test("completes the upload to recommendations flow with the occasion-first path", async ({
    page,
  }) => {
    await completeRecommendationSetup(page);

    await expect(
      page.getByText(/For work, the direction already leans classic/i)
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your direction is clearer now." })
    ).toBeVisible();
    await expect(page.getByText(/For work, Classic direction/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "See recommended products" })
    ).toBeVisible();

    await page.getByRole("button", { name: "See recommended products" }).click();

    await expect(page).toHaveURL(/\/recommendations$/);
    await expect(
      page.getByRole("heading", {
        name: "We found a cleaner direction for this look.",
      })
    ).toBeVisible();
    await expect(page.getByText(/For work, Classic direction/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Overshirt / Layer" })
    ).toBeVisible();
    await expect(page.getByText("Relaxed Overshirt in Stone")).toBeVisible();
  });

  test("keeps the manual preferences path working end to end", async ({ page }) => {
    await completeManualRecommendationSetup(page);

    await expect(
      page.getByRole("heading", { name: "Your direction is clearer now." })
    ).toBeVisible();
    await expect(page.getByText(/A clean foundation/i)).toBeVisible();
    await expect(
      page.getByText(/For work, the direction already leans classic/i)
    ).toHaveCount(0);

    await page.getByRole("button", { name: "See recommended products" }).click();

    await expect(page).toHaveURL(/\/recommendations$/);
    await expect(page.getByText(/A clean foundation/i)).toBeVisible();
  });

  test("reopens the occasion view with the saved occasion selected", async ({ page }) => {
    await seedOccasionPrerequisites(page, "work");
    await page.goto("/preferences");

    await expect(
      page.getByRole("heading", { name: "What are you dressing for?" })
    ).toBeVisible();

    const workCard = page.getByRole("button", { name: /Work/i }).first();
    await expect(workCard).toHaveAttribute("aria-pressed", "true");
  });

  test("reopens the manual view when saved preferences were set manually", async ({
    page,
  }) => {
    await seedManualPrerequisites(page);
    await page.goto("/preferences");

    await expect(
      page.getByRole("heading", { name: "Style preferences" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Get recommendations" })
    ).toBeEnabled();
  });

  test("lets the user move from recommendations into try-on", async ({ page }) => {
    await completeRecommendationSetup(page);

    await page.getByRole("button", { name: "See recommended products" }).click();

    await expect(page).toHaveURL(/\/recommendations$/);

    await page.getByRole("button", { name: "Try on" }).first().click();

    await expect(page).toHaveURL(/\/try-on$/);
    await expect(
      page.getByRole("heading", { name: "Preview how this could look on you." })
    ).toBeVisible();
    await expect(
      page.getByText("Preview is AI-generated and may not be perfectly accurate.")
    ).toBeVisible({ timeout: 5000 });
  });
});
