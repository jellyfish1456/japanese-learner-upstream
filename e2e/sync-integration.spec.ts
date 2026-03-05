import { test, expect, type Page, type Route } from "@playwright/test";

// ========== Types ==========

interface ApiCall {
  method: string;
  url: string;
  body?: string;
}

// ========== Shared Helpers ==========

const SYNC_DATA_KEYS = ["progress", "custom-data", "settings", "test-modes", "study-plans"] as const;

const FILE_IDS: Record<string, string> = {
  "progress": "file-progress-1",
  "custom-data": "file-custom-data-1",
  "settings": "file-settings-1",
  "test-modes": "file-test-modes-1",
  "study-plans": "file-study-plans-1",
};

/**
 * Intercept all Google API URLs and return mock responses.
 * Uses regex because glob patterns don't match `www.googleapis.com` correctly.
 */
async function mockDriveApi(
  page: Page,
  overrides?: {
    patchHandler?: (route: Route, url: URL) => Promise<void>;
    postHandler?: (route: Route, url: URL, body: string) => Promise<void>;
    getHandler?: (route: Route, url: URL) => Promise<void>;
  },
): Promise<ApiCall[]> {
  const calls: ApiCall[] = [];

  // Block GIS script to prevent hanging
  await page.route(/accounts\.google\.com/, (route) => route.abort());

  // Intercept all Drive API calls
  await page.route(/googleapis\.com/, async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const body = request.postData() ?? undefined;

    calls.push({ method, url: request.url(), body });

    if (method === "PATCH" && overrides?.patchHandler) {
      return overrides.patchHandler(route, url);
    }
    if (method === "POST" && overrides?.postHandler) {
      return overrides.postHandler(route, url, body ?? "");
    }
    if (method === "GET" && overrides?.getHandler) {
      return overrides.getHandler(route, url);
    }

    // Default: 200 OK with empty JSON
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "default-id", files: [] }),
    });
  });

  return calls;
}

/**
 * Suppress auto-pull on every page load.
 *
 * React 18 StrictMode in dev runs effects twice: the first call consumes
 * the `sync-pull-done` flag, and the second call triggers auto-pull
 * → reload → infinite loop. We override sessionStorage.getItem so the
 * flag always reads as "1", preventing auto-pull entirely.
 */
async function suppressAutoPull(page: Page) {
  await page.addInitScript(() => {
    const origGetItem = sessionStorage.getItem.bind(sessionStorage);
    sessionStorage.getItem = function (key: string) {
      if (key === "jp-learner:sync-pull-done") return "1";
      return origGetItem(key);
    };
  });
}

/** Set connected state in localStorage, then reload */
async function setupConnectedState(
  page: Page,
  opts?: { fileIds?: Record<string, string> },
) {
  const fileIds = opts?.fileIds ?? FILE_IDS;
  await page.evaluate(
    ({ fileIds }) => {
      localStorage.setItem(
        "jp-learner:sync-meta",
        JSON.stringify({
          folderId: "folder-123",
          fileIds,
          lastSyncedAt: "2025-06-15T10:00:00Z",
          email: "test@example.com",
        }),
      );
      localStorage.setItem(
        "jp-learner:google-auth",
        JSON.stringify({
          accessToken: "fake-token-valid",
          expiresAt: Date.now() + 3_600_000,
          email: "test@example.com",
        }),
      );
    },
    { fileIds },
  );
  await page.reload();
  await expect(page.getByText("帳號：test@example.com")).toBeVisible();
  await expect(page.getByText("已同步")).toBeVisible({ timeout: 5_000 });
}

// ========== Tests ==========

test.describe("Google Drive Sync Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("button", { name: "設定" }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("manual push — updates existing files on Drive", async ({ page }) => {
    const calls = await mockDriveApi(page, {
      patchHandler: async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "updated" }),
        });
      },
    });
    await suppressAutoPull(page);

    await page.evaluate(() => {
      localStorage.setItem(
        "jp-learner:progress",
        JSON.stringify({
          "dataset-1::item-1": { ease: 2.5, interval: 1, repetitions: 1, nextReview: "2025-06-20" },
        }),
      );
    });
    await setupConnectedState(page);

    await page.getByText("推送至雲端").click();

    // Wait for push to complete
    await expect(page.getByText("上傳中…")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("已同步")).toBeVisible({ timeout: 10_000 });

    // Verify 5 PATCH calls (one per sync key)
    const patchCalls = calls.filter((c) => c.method === "PATCH");
    expect(patchCalls).toHaveLength(5);

    for (const key of SYNC_DATA_KEYS) {
      const fileId = FILE_IDS[key];
      const matching = patchCalls.find((c) => c.url.includes(fileId));
      expect(matching, `Expected PATCH for ${key} (fileId: ${fileId})`).toBeTruthy();
    }

    // lastSyncedAt should be updated
    const meta = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("jp-learner:sync-meta") || "{}"),
    );
    expect(meta.lastSyncedAt).toBeTruthy();
    expect(new Date(meta.lastSyncedAt).getTime()).toBeGreaterThan(
      new Date("2025-06-15T10:00:00Z").getTime(),
    );
  });

  test("manual push — creates files when no fileIds exist", async ({ page }) => {
    let postCounter = 0;
    const calls = await mockDriveApi(page, {
      postHandler: async (route) => {
        postCounter++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: `new-id-${postCounter}` }),
        });
      },
    });
    await suppressAutoPull(page);

    await setupConnectedState(page, { fileIds: {} });

    await page.getByText("推送至雲端").click();

    await expect(page.getByText("上傳中…")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("已同步")).toBeVisible({ timeout: 10_000 });

    const postCalls = calls.filter(
      (c) => c.method === "POST" && c.url.includes("uploadType=multipart"),
    );
    expect(postCalls).toHaveLength(5);

    for (const call of postCalls) {
      expect(call.body).toBeTruthy();
      expect(call.body).toContain(".json");
    }

    const meta = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("jp-learner:sync-meta") || "{}"),
    );
    for (const key of SYNC_DATA_KEYS) {
      expect(meta.fileIds[key], `Expected fileId for ${key}`).toBeTruthy();
    }
  });

  test("manual pull — downloads cloud data to localStorage", async ({ page }) => {
    const cloudProgress = {
      "dataset-cloud::item-cloud": {
        ease: 3.0,
        interval: 10,
        repetitions: 5,
        nextReview: "2025-07-01",
      },
    };
    const cloudSettings = { defaultSessionSize: 50, showSwipeAssist: false };

    const fileMap: Record<string, { name: string; data: unknown }> = {
      "file-progress-1": { name: "progress.json", data: cloudProgress },
      "file-custom-data-1": { name: "custom-data.json", data: { datasets: {} } },
      "file-settings-1": { name: "settings.json", data: cloudSettings },
      "file-test-modes-1": { name: "test-modes.json", data: { "ds-1": ["kanji-to-chinese"] } },
      "file-study-plans-1": { name: "study-plans.json", data: {} },
    };

    await mockDriveApi(page, {
      getHandler: async (route, url) => {
        const urlStr = url.toString();

        // List files in folder
        if (urlStr.includes("/drive/v3/files") && urlStr.includes("q=")) {
          const files = Object.entries(fileMap).map(([id, info]) => ({
            id,
            name: info.name,
            modifiedTime: "2025-06-16T00:00:00Z",
          }));
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ files }),
          });
          return;
        }

        // Download file content
        if (urlStr.includes("alt=media")) {
          const fileId = urlStr.match(/files\/([^?/]+)/)?.[1];
          const entry = fileId ? fileMap[fileId] : undefined;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(entry?.data ?? {}),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ files: [] }),
        });
      },
    });
    await suppressAutoPull(page);

    // Set initial local data that differs from cloud
    await page.evaluate(() => {
      localStorage.setItem(
        "jp-learner:progress",
        JSON.stringify({
          "local-only::item": { ease: 2.5, interval: 1, repetitions: 1, nextReview: "2025-06-20" },
        }),
      );
    });

    await setupConnectedState(page);

    // Click pull button
    await page.getByText("從雲端同步").click();

    // Confirm dialog
    await expect(
      page.getByText("從雲端下載資料將覆蓋本機所有資料（進度、設定、自訂題庫等），確定要繼續嗎？"),
    ).toBeVisible();
    // Click confirm and wait for the pull-triggered reload to complete.
    // Pull is async: confirm → "下載中…" → fetch → save → reload → "已同步"
    await page.getByRole("button", { name: "確定同步" }).click();
    await expect(page.getByText("下載中…")).toBeVisible({ timeout: 5_000 });
    // After pull completes, page reloads. Wait for idle state after reload.
    await expect(page.getByText("已同步")).toBeVisible({ timeout: 15_000 });

    // After reload, verify localStorage has cloud data
    const progress = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("jp-learner:progress") || "{}"),
    );
    expect(progress["dataset-cloud::item-cloud"]).toBeTruthy();
    expect(progress["dataset-cloud::item-cloud"].interval).toBe(10);

    const settings = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("jp-learner:settings") || "{}"),
    );
    expect(settings.defaultSessionSize).toBe(50);
    expect(settings.showSwipeAssist).toBe(false);
  });

  test("push with stale file ID — 404 recovery", async ({ page }) => {
    const staleFileId = "stale-id-gone";
    const fileIds: Record<string, string> = {
      "progress": staleFileId,
      "custom-data": "file-custom-data-1",
      "settings": "file-settings-1",
      "test-modes": "file-test-modes-1",
      "study-plans": "file-study-plans-1",
    };

    let createCounter = 0;
    const calls = await mockDriveApi(page, {
      patchHandler: async (route, url) => {
        if (url.toString().includes(staleFileId)) {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ error: { code: 404, message: "File not found" } }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ id: "updated" }),
          });
        }
      },
      postHandler: async (route) => {
        createCounter++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: `recreated-id-${createCounter}` }),
        });
      },
    });
    await suppressAutoPull(page);

    await setupConnectedState(page, { fileIds });

    await page.getByText("推送至雲端").click();

    await expect(page.getByText("上傳中…")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("已同步")).toBeVisible({ timeout: 10_000 });

    const patchCalls = calls.filter((c) => c.method === "PATCH");
    expect(patchCalls).toHaveLength(5);

    // Stale file triggers a POST create after 404
    const postCalls = calls.filter(
      (c) => c.method === "POST" && c.url.includes("uploadType=multipart"),
    );
    expect(postCalls).toHaveLength(1);

    // Meta should have the recreated file ID for progress
    const meta = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("jp-learner:sync-meta") || "{}"),
    );
    expect(meta.fileIds["progress"]).toContain("recreated-id");
  });

  test("push with API error — shows error state", async ({ page }) => {
    await mockDriveApi(page, {
      patchHandler: async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: 500, message: "Internal Server Error" } }),
        });
      },
    });
    await suppressAutoPull(page);

    await setupConnectedState(page);

    await page.getByText("推送至雲端").click();

    // Should show error status badge
    await expect(page.getByText("錯誤")).toBeVisible({ timeout: 10_000 });

    // Error message should be visible
    const errorBox = page.locator(".text-red-600, .text-red-400");
    await expect(errorBox.first()).toBeVisible();
  });
});
