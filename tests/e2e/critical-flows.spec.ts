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
    await expect(
      page.getByText(/For work, the direction already leans classic/i)
    ).toBeVisible();
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

  test("defaults to the occasion view and restores manual selections on demand", async ({
    page,
  }) => {
    await seedManualPrerequisites(page);
    await page.goto("/preferences");

    await expect(
      page.getByRole("heading", { name: "What are you dressing for?" })
    ).toBeVisible();
    await page.getByRole("button", { name: /Or set your own preferences/i }).click();
    await expect(
      page.getByRole("heading", { name: "Style preferences" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Minimal/i })).toHaveClass(/bg-neutral-900/);
    await expect(page.getByRole("button", { name: /Medium/i })).toHaveClass(/bg-neutral-900/);
    await expect(page.getByRole("button", { name: /Regular/i })).toHaveClass(/bg-neutral-900/);
    await expect(page.getByRole("button", { name: /Neutral/i })).toHaveClass(/bg-neutral-900/);
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
    await expect(page.getByText("Why this item")).toBeVisible();
    await expect(
      page.getByText(/For work, the direction already leans classic/i)
    ).toBeVisible();
    await expect(
      page.getByText("Preview is AI-generated and may not be perfectly accurate.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("keeps the source recommendation context even when product categories do not match", async ({
    page,
  }) => {
    await page.route("**/api/products", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [
            {
              id: "custom-overshirt",
              title: "Structured Layer Jacket",
              brand: "Studio Form",
              price: "129.00",
              currencyCode: "GBP",
              imageUrl: "/mock-products/overshirt.svg",
              productUrl: "#",
              available: true,
              category: "Outerwear",
            },
          ],
        }),
      });
    });

    await completeRecommendationSetup(page);
    await page.getByRole("button", { name: "See recommended products" }).click();

    await expect(page).toHaveURL(/\/recommendations$/);
    await expect(page.getByText("Structured Layer Jacket").first()).toBeVisible();

    await page.getByRole("button", { name: "Try on" }).first().click();

    await expect(page).toHaveURL(/\/try-on$/);
    await expect(page.getByText("Why this item")).toBeVisible();
    await expect(page.getByText("Overshirt / Layer")).toBeVisible();
    await expect(page.getByText("Structured Layer Jacket")).toBeVisible();
  });

  test("renders cleanly without a supporting quote when none is attached", async ({
    page,
  }) => {
    await page.route("**/api/recommend-dialogue", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          turns: null,
          recommendation: {
            styleSummary: "A cleaner, quieter direction with more structure.",
            recommendations: [
              {
                category: "overshirt",
                reason: "Adds structure and elevates the silhouette",
                targetColors: ["stone", "olive"],
                targetFit: "regular",
                searchTerms: ["stone overshirt", "olive overshirt"],
              },
              {
                category: "trousers",
                reason: "Creates cleaner visual balance and a sharper line",
                targetColors: ["charcoal", "black"],
                targetFit: "straight",
                searchTerms: ["charcoal trousers", "black trousers"],
              },
              {
                category: "shoes",
                reason: "A refined finish reduces visual heaviness",
                targetColors: ["white", "taupe"],
                targetFit: "sleek",
                searchTerms: ["white sneakers", "taupe sneakers"],
              },
            ],
          },
        }),
      });
    });

    await completeRecommendationSetup(page);
    await page.getByRole("button", { name: "See recommended products" }).click();

    await expect(page).toHaveURL(/\/recommendations$/);
    await expect(page.getByText("From the review")).toHaveCount(0);
    await expect(
      page.getByText("Adds structure and elevates the silhouette")
    ).toBeVisible();

    await page.getByRole("button", { name: "Try on" }).first().click();

    await expect(page).toHaveURL(/\/try-on$/);
    await expect(page.getByText("Why this item")).toBeVisible();
    await expect(page.getByText("From the review")).toHaveCount(0);
    await expect(
      page.getByText("Adds structure and elevates the silhouette")
    ).toBeVisible();
  });
});
