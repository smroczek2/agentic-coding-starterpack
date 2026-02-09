import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders the hero section with correct title", async ({ page }) => {
    await page.goto("/");

    // The real landing page should render the hero title
    await expect(
      page.getByRole("heading", { name: /Agentic Coding/i })
    ).toBeVisible();

    await expect(page.getByText(/Starter Kit/i).first()).toBeVisible();
  });

  test("displays all four feature cards", async ({ page }) => {
    await page.goto("/");

    // The real landing page shows these four feature cards
    await expect(
      page.getByRole("heading", { name: "Authentication" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Database" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "AI Ready" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "UI Components" })
    ).toBeVisible();
  });

  test("displays the Next Steps section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Next Steps" })
    ).toBeVisible();
  });

  test("has working navigation links", async ({ page }) => {
    await page.goto("/");

    // The page should have dashboard and chat links (may be disabled if not configured)
    await expect(page.getByText("View Dashboard")).toBeVisible();
    await expect(page.getByText("Try AI Chat")).toBeVisible();
  });
});
