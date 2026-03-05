import { test, expect } from "@playwright/test";

test.describe("Google Drive Sync UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("button", { name: "設定" }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("should display sync section with header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Google 雲端同步" })).toBeVisible();
  });

  test("should show sign-in button when disconnected", async ({ page }) => {
    const signInBtn = page.getByRole("button", { name: "使用 Google 帳號登入" });
    await expect(signInBtn).toBeVisible();
  });

  test("should show description text when disconnected", async ({ page }) => {
    await expect(
      page.getByText("連結 Google 帳號，將學習進度同步至 Google 雲端硬碟，跨裝置使用。"),
    ).toBeVisible();
  });

  test("should show disconnected status badge", async ({ page }) => {
    await expect(page.getByText("未連線")).toBeVisible();
  });

  test("should show general settings section below sync", async ({ page }) => {
    await expect(page.getByText("一般設定")).toBeVisible();
    await expect(page.getByText("深色模式")).toBeVisible();
    await expect(page.getByText("滑動提示")).toBeVisible();
  });
});

test.describe("Google Drive Sync UI - Connected State", () => {
  /** Set up connected state with pull-done flag then reload */
  async function setupConnectedState(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
      localStorage.setItem(
        "jp-learner:sync-meta",
        JSON.stringify({
          folderId: "folder-123",
          fileIds: {},
          lastSyncedAt: "2025-06-15T10:00:00Z",
          email: "test@example.com",
        }),
      );
      localStorage.setItem(
        "jp-learner:google-auth",
        JSON.stringify({
          accessToken: "fake-token",
          expiresAt: Date.now() + 3600000,
          email: "test@example.com",
        }),
      );
      // Skip auto-pull on reload
      sessionStorage.setItem("jp-learner:sync-pull-done", "1");
    });
    // Reload the current page so the hook re-initializes with connected state
    await page.reload();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("button", { name: "設定" }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("should show connected UI when sync metadata exists", async ({ page }) => {
    await setupConnectedState(page);

    await expect(page.getByText("帳號：test@example.com")).toBeVisible();
    await expect(page.getByText("從雲端同步")).toBeVisible();
    await expect(page.getByText("推送至雲端")).toBeVisible();
    await expect(page.getByText("解除連線")).toBeVisible();
  });

  test("should show last sync time", async ({ page }) => {
    await setupConnectedState(page);

    await expect(page.getByText(/上次同步：/)).toBeVisible();
  });

  test("should show confirm dialog when clicking disconnect", async ({ page }) => {
    await setupConnectedState(page);

    await page.getByText("解除連線").click();
    await expect(
      page.getByText("解除連線後將停止自動同步。雲端資料不會被刪除，本機資料也會保留。"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "取消" })).toBeVisible();
  });

  test("should disconnect when confirming disconnect dialog", async ({ page }) => {
    await setupConnectedState(page);

    await page.getByText("解除連線").click();
    // Click the confirm button inside the dialog
    await page.locator("[role=dialog] button", { hasText: "解除連線" }).click();

    // Should show disconnected state
    await expect(page.getByText("未連線")).toBeVisible();
    await expect(page.getByRole("button", { name: "使用 Google 帳號登入" })).toBeVisible();

    // localStorage should be cleared
    const meta = await page.evaluate(() => localStorage.getItem("jp-learner:sync-meta"));
    expect(meta).toBeNull();
  });

  test("should cancel disconnect dialog", async ({ page }) => {
    await setupConnectedState(page);

    await page.getByText("解除連線").click();
    await page.getByRole("button", { name: "取消" }).click();

    // Should still show connected state
    await expect(page.getByText("帳號：test@example.com")).toBeVisible();
  });

  test("should show sync from cloud confirm dialog", async ({ page }) => {
    await setupConnectedState(page);

    await page.getByText("從雲端同步").click();
    await expect(
      page.getByText("從雲端下載資料將覆蓋本機所有資料（進度、設定、自訂題庫等），確定要繼續嗎？"),
    ).toBeVisible();
  });
});

test.describe("Google Drive Sync UI - Error State", () => {
  test("should show error state when token is expired", async ({ page }) => {
    // Block GIS script to prevent hanging on reauth attempt
    await page.route("**/accounts.google.com/**", (route) => route.abort());

    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem(
        "jp-learner:sync-meta",
        JSON.stringify({
          folderId: "folder-123",
          fileIds: {},
          lastSyncedAt: "2025-06-15T10:00:00Z",
          email: "test@example.com",
        }),
      );
      localStorage.setItem(
        "jp-learner:google-auth",
        JSON.stringify({
          accessToken: "expired-token",
          expiresAt: Date.now() - 10000,
          email: "test@example.com",
        }),
      );
    });
    await page.getByRole("button", { name: "設定" }).click();

    // Should show error status and re-auth message after GIS script fails to load
    await expect(page.getByText("錯誤")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("登入已過期，請重新登入")).toBeVisible();
  });
});
