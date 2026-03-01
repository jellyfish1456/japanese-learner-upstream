import { test, expect } from "@playwright/test";

test.describe("Setup Page - Vocabulary", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    // Navigate to the test vocab dataset setup page
    await page.getByRole("heading", { name: "Test 詞彙" }).click();
    await expect(page).toHaveURL(/\/study\/test-vocab$/);
  });

  test("should display dataset name and card count", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Test 詞彙" })).toBeVisible();
    await expect(page.getByText("3 張卡片")).toBeVisible();
  });

  test("should display vocab test mode chips", async ({ page }) => {
    await expect(page.getByTestId("mode-chip-all")).toBeVisible();
    await expect(page.getByTestId("mode-chip-kanji-to-chinese")).toBeVisible();
    await expect(page.getByTestId("mode-chip-hiragana-to-chinese")).toBeVisible();
    await expect(page.getByTestId("mode-chip-chinese-to-japanese")).toBeVisible();
    await expect(page.getByTestId("mode-chip-random")).toBeVisible();
  });

  test("should allow multi-select of mode chips", async ({ page }) => {
    // Click hiragana-to-chinese (already has kanji-to-chinese selected by default)
    await page.getByTestId("mode-chip-hiragana-to-chinese").click();

    // Both should be active (dark bg)
    await expect(page.getByTestId("mode-chip-kanji-to-chinese")).toHaveClass(/bg-gray-900|dark:bg-white/);
    await expect(page.getByTestId("mode-chip-hiragana-to-chinese")).toHaveClass(/bg-gray-900|dark:bg-white/);
  });

  test("should toggle all modes with all-mode chip", async ({ page }) => {
    await page.getByTestId("mode-chip-all").click();

    // All concrete mode chips should be active
    await expect(page.getByTestId("mode-chip-kanji-to-chinese")).toHaveClass(/bg-gray-900/);
    await expect(page.getByTestId("mode-chip-hiragana-to-chinese")).toHaveClass(/bg-gray-900/);
    await expect(page.getByTestId("mode-chip-chinese-to-japanese")).toHaveClass(/bg-gray-900/);

    // Multi-mode hint should be visible
    await expect(page.getByText(/3 種模式各測驗一次/)).toBeVisible();
  });

  test("should make random mutually exclusive with concrete modes", async ({ page }) => {
    await page.getByTestId("mode-chip-random").click();

    // Random should be active, concrete modes should not
    await expect(page.getByTestId("mode-chip-random")).toHaveClass(/bg-gray-900/);
    await expect(page.getByTestId("mode-chip-kanji-to-chinese")).not.toHaveClass(/bg-gray-900/);
  });

  test("should display session size options", async ({ page }) => {
    await expect(page.getByText("每次數量")).toBeVisible();
    await expect(page.getByRole("button", { name: "10" })).toBeVisible();
    await expect(page.getByRole("button", { name: "20" })).toBeVisible();
    await expect(page.getByRole("button", { name: "全部", exact: true })).toBeVisible();
  });

  test("should have learning mode button", async ({ page }) => {
    await expect(page.getByText("學習模式（瀏覽全部卡片）")).toBeVisible();
  });

  test("should have random review button", async ({ page }) => {
    await expect(page.getByText("隨機複習（全部卡片）")).toBeVisible();
  });

  test("should display statistics panel", async ({ page }) => {
    await expect(page.getByText("總卡片數")).toBeVisible();
    await expect(page.getByText("已學習")).toBeVisible();
  });

  test("should navigate to learn mode", async ({ page }) => {
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await expect(page).toHaveURL(/\/learn\/test-vocab$/);
  });

  test("should navigate to study session via random review", async ({
    page,
  }) => {
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page).toHaveURL(/\/study\/test-vocab\/session$/);
  });

  test("should show due card count", async ({ page }) => {
    // All 3 cards should be due (new cards = due)
    await expect(page.getByText("3 張待複習")).toBeVisible();
  });
});

test.describe("Setup Page - Grammar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 文法" }).click();
    await expect(page).toHaveURL(/\/study\/test-grammar$/);
  });

  test("should display grammar test mode chips", async ({ page }) => {
    await expect(page.getByTestId("mode-chip-all")).toBeVisible();
    await expect(page.getByTestId("mode-chip-grammar-to-chinese")).toBeVisible();
    await expect(page.getByTestId("mode-chip-example-to-chinese")).toBeVisible();
    await expect(page.getByTestId("mode-chip-chinese-to-grammar")).toBeVisible();
    await expect(page.getByTestId("mode-chip-fill-in-grammar")).toBeVisible();
    await expect(page.getByTestId("mode-chip-random")).toBeVisible();
  });
});
