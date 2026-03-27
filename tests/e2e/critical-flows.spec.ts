import { expect, test } from "@playwright/test";
import { completeRecommendationSetup, seedRecommendationPrerequisites } from "./helpers";

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

  test("completes the upload to recommendations flow with mock dialogue", async ({
    page,
  }) => {
    await completeRecommendationSetup(page);

    await expect(page.getByText("Reviewing your look", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/recommendations$/);
    await expect(
      page.getByRole("heading", {
        name: "We found a cleaner direction for this look.",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Overshirt / Layer" })
    ).toBeVisible();
    await expect(page.getByText("Relaxed Overshirt in Stone")).toBeVisible();
  });

  test("lets the user move from recommendations into try-on", async ({ page }) => {
    await completeRecommendationSetup(page);

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
