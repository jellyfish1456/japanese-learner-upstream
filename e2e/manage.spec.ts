import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
});

test.describe("Dataset Management - Create", () => {
  test("should navigate to create page from homepage", async ({ page }) => {
    await page.getByText("+ 新增學習集").click();
    await expect(page).toHaveURL(/\/manage\/new$/);
    await expect(page.getByText("新增學習集")).toBeVisible();
  });

  test("should create a new vocabulary dataset", async ({ page }) => {
    await page.getByText("+ 新增學習集").click();

    await page.getByPlaceholder("例：N5 動詞").fill("My Custom Vocab");
    // Vocabulary is selected by default
    await page.getByPlaceholder("例：N5").fill("N5");
    await page.getByRole("button", { name: "建立" }).click();

    // Should redirect to the dataset edit page
    await expect(page).toHaveURL(/\/manage\/custom-vocabulary-/);
    await expect(page.getByText("My Custom Vocab")).toBeVisible();
    await expect(page.getByText("0 個項目")).toBeVisible();
  });

  test("should create a new grammar dataset", async ({ page }) => {
    await page.getByText("+ 新增學習集").click();

    await page.getByPlaceholder("例：N5 動詞").fill("My Grammar Set");
    await page.getByRole("button", { name: "文法" }).click();
    await page.getByPlaceholder("例：N5").fill("N3");
    await page.getByRole("button", { name: "建立" }).click();

    await expect(page).toHaveURL(/\/manage\/custom-grammar-/);
    await expect(page.getByText("My Grammar Set")).toBeVisible();
  });

  test("should disable create button when fields are empty", async ({ page }) => {
    await page.getByText("+ 新增學習集").click();

    const createButton = page.getByRole("button", { name: "建立" });
    await expect(createButton).toBeDisabled();

    await page.getByPlaceholder("例：N5 動詞").fill("Test");
    await expect(createButton).toBeDisabled();

    await page.getByPlaceholder("例：N5").fill("N5");
    await expect(createButton).toBeEnabled();
  });
});

test.describe("Dataset Management - Add Items", () => {
  test("should add a vocabulary item to a custom dataset", async ({ page }) => {
    // Create dataset first
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("Test Vocab");
    await page.getByPlaceholder("例：N5").fill("N5");
    await page.getByRole("button", { name: "建立" }).click();

    // Add item
    await page.getByRole("button", { name: "+ 新增項目" }).click();
    await expect(page.getByText("新增項目")).toBeVisible();

    await page.getByPlaceholder("例：食べる").fill("猫");
    await page.getByPlaceholder("例：たべる").fill("ねこ");
    await page.getByPlaceholder("例：吃").fill("貓");
    await page.getByRole("button", { name: "儲存" }).click();

    // Back on edit page, item should appear
    await expect(page.getByText("1 個項目")).toBeVisible();
    await expect(page.getByText("猫")).toBeVisible();
    await expect(page.getByText("ねこ — 貓")).toBeVisible();
  });

  test("should add a grammar item with examples", async ({ page }) => {
    // Create grammar dataset
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("Grammar");
    await page.getByRole("button", { name: "文法" }).click();
    await page.getByPlaceholder("例：N5").fill("N3");
    await page.getByRole("button", { name: "建立" }).click();

    // Add grammar item
    await page.getByRole("button", { name: "+ 新增項目" }).click();
    await page.getByPlaceholder("例：食べる").fill("ている");
    await page.getByPlaceholder("例：吃").fill("正在～");

    // Fill in example
    await page.getByPlaceholder("日文例句（用【】標記文法）").fill("勉強【している】");
    await page.getByPlaceholder("中文翻譯").fill("正在學習");

    // Add another example
    await page.getByText("+ 新增例句").click();
    const sentenceInputs = page.getByPlaceholder("日文例句（用【】標記文法）");
    await sentenceInputs.nth(1).fill("食べ【ている】");
    const chineseInputs = page.getByPlaceholder("中文翻譯");
    await chineseInputs.nth(1).fill("正在吃");

    await page.getByRole("button", { name: "儲存" }).click();

    await expect(page.getByText("1 個項目")).toBeVisible();
    await expect(page.getByText("ている")).toBeVisible();
  });
});

test.describe("Dataset Management - Edit Items", () => {
  test("should edit an existing item", async ({ page }) => {
    // Create and add an item
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("Edit Test");
    await page.getByPlaceholder("例：N5").fill("N5");
    await page.getByRole("button", { name: "建立" }).click();

    await page.getByRole("button", { name: "+ 新增項目" }).click();
    await page.getByPlaceholder("例：食べる").fill("猫");
    await page.getByPlaceholder("例：たべる").fill("ねこ");
    await page.getByPlaceholder("例：吃").fill("貓");
    await page.getByRole("button", { name: "儲存" }).click();

    // Click edit on the item
    await page.getByTitle("編輯").click();
    await expect(page.getByText("編輯項目")).toBeVisible();

    // Verify fields are pre-filled
    await expect(page.getByPlaceholder("例：食べる")).toHaveValue("猫");

    // Edit the chinese meaning
    await page.getByPlaceholder("例：吃").fill("貓咪");
    await page.getByRole("button", { name: "儲存" }).click();

    // Verify updated
    await expect(page.getByText("ねこ — 貓咪")).toBeVisible();
  });
});

test.describe("Dataset Management - Delete Items", () => {
  test("should delete an item with confirmation", async ({ page }) => {
    // Create and add items
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("Delete Test");
    await page.getByPlaceholder("例：N5").fill("N5");
    await page.getByRole("button", { name: "建立" }).click();

    // Add two items
    await page.getByRole("button", { name: "+ 新增項目" }).click();
    await page.getByPlaceholder("例：食べる").fill("猫");
    await page.getByPlaceholder("例：たべる").fill("ねこ");
    await page.getByPlaceholder("例：吃").fill("貓");
    await page.getByRole("button", { name: "儲存" }).click();

    await page.getByRole("button", { name: "+ 新增項目" }).click();
    await page.getByPlaceholder("例：食べる").fill("犬");
    await page.getByPlaceholder("例：たべる").fill("いぬ");
    await page.getByPlaceholder("例：吃").fill("狗");
    await page.getByRole("button", { name: "儲存" }).click();

    await expect(page.getByText("2 個項目")).toBeVisible();

    // Delete the first item
    await page.getByTitle("刪除").first().click();
    await expect(page.getByText("確定要刪除這個項目嗎？")).toBeVisible();
    await page.getByRole("button", { name: "刪除" }).click();

    await expect(page.getByText("1 個項目")).toBeVisible();
  });

  test("should cancel delete when clicking cancel", async ({ page }) => {
    // Create and add an item
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("Cancel Test");
    await page.getByPlaceholder("例：N5").fill("N5");
    await page.getByRole("button", { name: "建立" }).click();

    await page.getByRole("button", { name: "+ 新增項目" }).click();
    await page.getByPlaceholder("例：食べる").fill("猫");
    await page.getByPlaceholder("例：たべる").fill("ねこ");
    await page.getByPlaceholder("例：吃").fill("貓");
    await page.getByRole("button", { name: "儲存" }).click();

    // Try to delete but cancel
    await page.getByTitle("刪除").click();
    await page.getByRole("button", { name: "取消" }).click();

    // Item still exists
    await expect(page.getByText("1 個項目")).toBeVisible();
    await expect(page.getByText("猫")).toBeVisible();
  });
});

test.describe("Dataset Management - Delete Dataset", () => {
  test("should delete a custom dataset", async ({ page }) => {
    // Create dataset
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("To Delete DS");
    await page.getByPlaceholder("例：N5").fill("N5");
    await page.getByRole("button", { name: "建立" }).click();

    // Delete dataset
    await page.getByRole("button", { name: "刪除學習集" }).click();
    await expect(page.getByText("確定要刪除整個學習集嗎？")).toBeVisible();
    await page.getByRole("button", { name: "刪除學習集" }).click();

    // Should navigate back to home
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("Dataset Management - Built-in Dataset", () => {
  test("should navigate to manage page for built-in dataset via edit icon", async ({ page }) => {
    // Find the edit icon on a dataset card and click it
    const editButton = page.getByTitle("管理").first();
    await editButton.click();
    await expect(page).toHaveURL(/\/manage\//);
  });

  test("should show built-in dataset info note", async ({ page }) => {
    const editButton = page.getByTitle("管理").first();
    await editButton.click();
    await expect(page.getByText("這是內建學習集")).toBeVisible();
  });

  test("should show modified badge and reset button after adding item to built-in", async ({ page }) => {
    const editButton = page.getByTitle("管理").first();
    await editButton.click();

    // Add an item to the built-in dataset
    await page.getByRole("button", { name: "+ 新增項目" }).click();
    await page.getByPlaceholder("例：食べる").fill("テスト");
    // Fill required fields based on category
    const hiraganaField = page.getByPlaceholder("例：たべる");
    if (await hiraganaField.isVisible()) {
      await hiraganaField.fill("てすと");
    }
    await page.getByPlaceholder("例：吃").fill("測試");
    await page.getByRole("button", { name: "儲存" }).click();

    // Should show "已修改" badge and reset button
    await expect(page.getByText("已修改")).toBeVisible();
    await expect(page.getByRole("button", { name: "還原預設" })).toBeVisible();
  });
});

test.describe("Dataset Management - Setup Page Integration", () => {
  test("should have manage link on setup page", async ({ page }) => {
    // Navigate to a dataset's setup page
    await page.locator("button").filter({ hasText: "Test 詞彙" }).click();
    await expect(page.getByText("管理")).toBeVisible();
  });

  test("should navigate to manage from setup page", async ({ page }) => {
    await page.locator("button").filter({ hasText: "Test 詞彙" }).click();
    await page.getByText("管理").click();
    await expect(page).toHaveURL(/\/manage\/test-vocab$/);
  });
});

test.describe("Dataset Management - Custom Dataset on HomePage", () => {
  test("should show custom dataset on homepage after creation", async ({ page }) => {
    // Create a dataset
    await page.getByText("+ 新增學習集").click();
    await page.getByPlaceholder("例：N5 動詞").fill("My New Set");
    await page.getByPlaceholder("例：N5").fill("N5");
    await page.getByRole("button", { name: "建立" }).click();

    // Add an item so it's visible
    await page.getByRole("button", { name: "+ 新增項目" }).click();
    await page.getByPlaceholder("例：食べる").fill("猫");
    await page.getByPlaceholder("例：たべる").fill("ねこ");
    await page.getByPlaceholder("例：吃").fill("貓");
    await page.getByRole("button", { name: "儲存" }).click();

    // Go home
    await page.goto("/");
    await expect(page.getByText("My New Set")).toBeVisible();
  });
});
