import { test, expect } from "@playwright/test";

test.describe("Mix Dataset - Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
  });

  test("should display mix dataset with 綜合 badge", async ({ page }) => {
    await expect(page.getByText("Test 綜合")).toBeVisible();
    await expect(page.getByText("綜合").first()).toBeVisible();
  });

  test("should filter by 綜合 category", async ({ page }) => {
    // Click the 綜合 filter button (the small filter chip, not the dataset card)
    await page.getByRole("button", { name: "綜合", exact: true }).click();
    await expect(page.getByText("Test 綜合")).toBeVisible();
    // Other datasets should be hidden
    await expect(page.getByText("Test 詞彙")).not.toBeVisible();
    await expect(page.getByText("Test 文法")).not.toBeVisible();
  });
});

test.describe("Mix Dataset - Create", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
  });

  test("should create a mix dataset", async ({ page }) => {
    await page.getByText("+ 新增學習集").click();

    await page.getByPlaceholder("例：N5 動詞").fill("My Mix Set");
    await page.getByRole("button", { name: "綜合" }).click();
    await page.getByPlaceholder("例：N5", { exact: true }).fill("N3");
    await page.getByRole("button", { name: "建立" }).click();

    await expect(page).toHaveURL(/\/manage\/custom-mix-/);
    await expect(page.getByText("My Mix Set")).toBeVisible();
    await expect(page.getByText("綜合")).toBeVisible();
  });

  test("should add vocab item to mix dataset with type selector", async ({ page }) => {
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("Mix Items");
    await page.getByRole("button", { name: "綜合" }).click();
    await page.getByPlaceholder("例：N5", { exact: true }).fill("N3");
    await page.getByRole("button", { name: "建立" }).click();

    // Add vocab item
    await page.getByRole("button", { name: "+ 新增項目" }).click();
    // Should see type selector
    await expect(page.getByText("項目類型")).toBeVisible();
    // Default is 詞彙
    await page.getByPlaceholder("例：食べる").fill("猫");
    await page.getByPlaceholder("例：たべる").fill("ねこ");
    await page.getByPlaceholder("例：吃").fill("貓");
    await page.getByRole("button", { name: "儲存" }).click();

    await expect(page.getByText("1 個項目")).toBeVisible();
    await expect(page.getByText("猫")).toBeVisible();
    // Should show 詞 badge
    await expect(page.getByText("詞")).toBeVisible();
  });

  test("should add grammar item to mix dataset", async ({ page }) => {
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("Mix Grammar");
    await page.getByRole("button", { name: "綜合" }).click();
    await page.getByPlaceholder("例：N5", { exact: true }).fill("N3");
    await page.getByRole("button", { name: "建立" }).click();

    await page.getByRole("button", { name: "+ 新增項目" }).click();

    // Switch to grammar type
    await page.getByRole("button", { name: "文法" }).click();

    // Hiragana field should not be visible now
    await expect(page.getByPlaceholder("例：たべる")).not.toBeVisible();
    // Example fields should be visible
    await expect(page.getByPlaceholder("日文例句（用【】標記文法）")).toBeVisible();

    await page.getByPlaceholder("例：食べる").fill("ている");
    await page.getByPlaceholder("例：吃").fill("正在～");
    await page.getByPlaceholder("日文例句（用【】標記文法）").fill("勉強【している】");
    await page.getByPlaceholder("中文翻譯").fill("正在學習");
    await page.getByRole("button", { name: "儲存" }).click();

    await expect(page.getByText("1 個項目")).toBeVisible();
    // Should show 文 badge
    await expect(page.getByText("文")).toBeVisible();
  });
});

test.describe("Mix Dataset - Setup Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("heading", { name: "Test 綜合" }).click();
    await expect(page).toHaveURL(/\/study\/test-mix$/);
  });

  test("should display mix dataset info", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Test 綜合" })).toBeVisible();
    await expect(page.getByText("3 張卡片")).toBeVisible();
  });

  test("should show compact mode pills with 進階設定 link", async ({ page }) => {
    // Default: compact pills showing MIX_DEFAULT_MODES
    await expect(page.getByText("漢字 → 中文")).toBeVisible();
    await expect(page.getByText("文法 → 中文")).toBeVisible();
    await expect(page.getByText("進階設定")).toBeVisible();
  });

  test("should expand advanced settings with grouped modes", async ({ page }) => {
    await page.getByText("進階設定").click();

    // Should see mode selector with grouping (group labels)
    await expect(page.getByText("詞彙", { exact: true })).toBeVisible();
    await expect(page.getByText("文法", { exact: true })).toBeVisible();
    await expect(page.getByTestId("mode-chip-all")).toBeVisible();
    await expect(page.getByTestId("mode-chip-kanji-to-chinese")).toBeVisible();
    await expect(page.getByTestId("mode-chip-grammar-to-chinese")).toBeVisible();

    // Should have 收起 button
    await expect(page.getByText("收起")).toBeVisible();
  });

  test("should collapse advanced settings", async ({ page }) => {
    await page.getByText("進階設定").click();
    await page.getByText("收起").click();

    // Should be back to compact pills
    await expect(page.getByText("進階設定")).toBeVisible();
    await expect(page.getByTestId("mode-chip-all")).not.toBeVisible();
  });

  test("should select all modes and deselect back to defaults", async ({ page }) => {
    await page.getByText("進階設定").click();

    // Click 全部模式 to select all
    await page.getByTestId("mode-chip-all").click();

    // All 7 concrete modes should be active
    await expect(page.getByTestId("mode-chip-kanji-to-chinese")).toHaveClass(/bg-gray-900/);
    await expect(page.getByTestId("mode-chip-grammar-to-chinese")).toHaveClass(/bg-gray-900/);
    await expect(page.getByTestId("mode-chip-fill-in-grammar")).toHaveClass(/bg-gray-900/);

    // Click 全部模式 again to deselect → should fall back to defaults
    await page.getByTestId("mode-chip-all").click();

    // Should have kanji-to-chinese and grammar-to-chinese active (MIX_DEFAULT_MODES)
    await expect(page.getByTestId("mode-chip-kanji-to-chinese")).toHaveClass(/bg-gray-900/);
    await expect(page.getByTestId("mode-chip-grammar-to-chinese")).toHaveClass(/bg-gray-900/);
    // Other modes should not be active
    await expect(page.getByTestId("mode-chip-hiragana-to-chinese")).not.toHaveClass(/bg-gray-900/);
    await expect(page.getByTestId("mode-chip-fill-in-grammar")).not.toHaveClass(/bg-gray-900/);
  });

  test("should show multi-mode hint for mix", async ({ page }) => {
    // Default is multi-mode (2 modes)
    await expect(page.getByText("每張卡片將以適用的模式各測驗一次")).toBeVisible();
  });

  test("should have due card count", async ({ page }) => {
    // All 3 cards should be due (new cards = due)
    await expect(page.getByText("3 張待複習")).toBeVisible();
  });

  test("should navigate to study session with random review", async ({ page }) => {
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page).toHaveURL(/\/study\/test-mix\/session$/);
  });

  test("should have cursor-pointer on 進階設定", async ({ page }) => {
    const btn = page.getByText("進階設定");
    await expect(btn).toHaveCSS("cursor", "pointer");
  });

  test("should have cursor-pointer on 收起", async ({ page }) => {
    await page.getByText("進階設定").click();
    const btn = page.getByText("收起");
    await expect(btn).toHaveCSS("cursor", "pointer");
  });
});

test.describe("Mix Dataset - Study Session", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should complete a mix study session with random review", async ({ page }) => {
    await page.getByRole("heading", { name: "Test 綜合" }).click();
    await page.getByText("隨機複習（全部卡片）").click();
    await expect(page).toHaveURL(/\/study\/test-mix\/session$/);

    // Should see a flashcard
    const card = page.locator(".perspective");
    await expect(card).toBeVisible();

    // Click to flip
    await card.click();

    // Rating buttons should appear
    await expect(page.getByRole("button", { name: "記住了" })).toBeVisible();
  });

  test("should complete all mix cards in a session", async ({ page }) => {
    await page.getByRole("heading", { name: "Test 綜合" }).click();
    await page.getByText("隨機複習（全部卡片）").click();

    // Default modes: kanji-to-chinese + grammar-to-chinese
    // 2 vocab items get kanji-to-chinese → 2 cards
    // 1 grammar item gets grammar-to-chinese → 1 card
    // But also: 2 vocab items get grammar-to-chinese → skipped (N/A)
    //           1 grammar item gets kanji-to-chinese → skipped (N/A)
    // Total: 2 + 1 = 3 cards per mode applicable = 2 + 1 = 3,
    // but it's multi-mode, so grouped: 2 cards for kanji-to-chinese, then 1 for grammar-to-chinese
    // Wait, sessionSize=20 (default), all 3 items selected, 2 modes
    // vocab items × kanji-to-chinese = 2 cards
    // grammar items × grammar-to-chinese = 1 card
    // Total = 3 cards

    // Complete all cards
    for (let i = 0; i < 3; i++) {
      const card = page.locator(".perspective");
      await expect(card).toBeVisible({ timeout: 5000 });
      await card.click();

      const goodBtn = page.getByRole("button", { name: "記住了" });
      await expect(goodBtn).toBeVisible();
      await goodBtn.click();
      await page.waitForTimeout(300);
    }

    await expect(page.getByText("學習完成！")).toBeVisible({ timeout: 5000 });
  });

  test("should show mode label during multi-mode mix session", async ({ page }) => {
    await page.getByRole("heading", { name: "Test 綜合" }).click();
    await page.getByText("隨機複習（全部卡片）").click();

    // Should see a mode label on the progress bar (漢字 → 中文 or 文法 → 中文)
    const modeLabel = page.locator("text=漢字 → 中文").or(page.locator("text=文法 → 中文"));
    await expect(modeLabel.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Mix Dataset - Learn Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should show mix cards in learn mode", async ({ page }) => {
    await page.getByRole("heading", { name: "Test 綜合" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await expect(page).toHaveURL(/\/learn\/test-mix$/);

    // Click 開始學習 to enter session (全部學習 is default)
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-mix\/session$/);

    // Should see a card
    await expect(page.locator(".bg-white, .dark\\:bg-gray-800").first()).toBeVisible();
  });

  test("should navigate through all mix cards", async ({ page }) => {
    await page.getByRole("heading", { name: "Test 綜合" }).click();
    await page.getByText("學習模式（瀏覽全部卡片）").click();
    await page.getByRole("button", { name: "開始學習" }).click();
    await expect(page).toHaveURL(/\/learn\/test-mix\/session$/);

    // Navigate through 3 cards
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.getByRole("button", { name: /下一張|完成/ });
      await expect(nextBtn).toBeVisible();
      await nextBtn.click();
      await page.waitForTimeout(200);
    }

    // Should see completion
    await expect(page.getByText("瀏覽完成！")).toBeVisible();
  });
});

test.describe("Mix Dataset - Edit Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
  });

  test("should show item type badges on edit page for mix dataset", async ({ page }) => {
    // Navigate to mix dataset manage page
    const editButton = page.locator("button").filter({ hasText: "Test 綜合" });
    await editButton.click();
    await page.getByText("管理").click();

    // Should see 詞 and 文 badges
    await expect(page.getByText("詞").first()).toBeVisible();
    await expect(page.getByText("文").first()).toBeVisible();
  });
});
