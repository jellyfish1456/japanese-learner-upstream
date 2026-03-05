import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ensureAppFolder,
  listAppFiles,
  readJsonFile,
  createJsonFile,
  updateJsonFile,
  DriveApiError,
  TokenExpiredError,
} from "../driveApi";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("ensureAppFolder", () => {
  it("should return existing folder id when folder exists", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ files: [{ id: "folder-123", name: "Japanese Learner" }] }),
    );

    const id = await ensureAppFolder("token-abc");
    expect(id).toBe("folder-123");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain("drive/v3/files?q=");
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer token-abc");
  });

  it("should create folder when none exists", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ files: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: "new-folder-456" }));

    const id = await ensureAppFolder("token-abc");
    expect(id).toBe("new-folder-456");
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const createCall = mockFetch.mock.calls[1];
    expect(createCall[1].method).toBe("POST");
    const body = JSON.parse(createCall[1].body);
    expect(body.name).toBe("Japanese Learner");
    expect(body.mimeType).toBe("application/vnd.google-apps.folder");
  });

  it("should throw TokenExpiredError on 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    } as Response);

    await expect(ensureAppFolder("expired-token")).rejects.toThrow(TokenExpiredError);
  });

  it("should throw DriveApiError on other errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    } as Response);

    await expect(ensureAppFolder("token")).rejects.toThrow(DriveApiError);
  });
});

describe("listAppFiles", () => {
  it("should return file list from folder", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        files: [
          { id: "f1", name: "progress.json", modifiedTime: "2025-01-01T00:00:00Z" },
          { id: "f2", name: "settings.json", modifiedTime: "2025-01-02T00:00:00Z" },
        ],
      }),
    );

    const files = await listAppFiles("token", "folder-123");
    expect(files).toHaveLength(2);
    expect(files[0]).toEqual({
      fileId: "f1",
      name: "progress.json",
      modifiedTime: "2025-01-01T00:00:00Z",
    });
  });

  it("should return empty array when no files exist", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ files: [] }));

    const files = await listAppFiles("token", "folder-123");
    expect(files).toHaveLength(0);
  });
});

describe("readJsonFile", () => {
  it("should read and parse JSON from file", async () => {
    const data = { key: "value", count: 42 };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await readJsonFile<typeof data>("token", "file-id");
    expect(result).toEqual(data);
    expect(mockFetch.mock.calls[0][0]).toContain("file-id?alt=media");
  });
});

describe("createJsonFile", () => {
  it("should create file with multipart upload and return id", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "new-file-789" }));

    const id = await createJsonFile("token", "folder-123", "test.json", { hello: "world" });
    expect(id).toBe("new-file-789");

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toContain("uploadType=multipart");
    expect(call[1].method).toBe("POST");
    expect(call[1].headers["Content-Type"]).toContain("multipart/related");
    expect(call[1].body).toContain('"name":"test.json"');
    expect(call[1].body).toContain('"hello":"world"');
  });
});

describe("updateJsonFile", () => {
  it("should update file with media upload", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await updateJsonFile("token", "file-id", { updated: true });

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toContain("file-id?uploadType=media");
    expect(call[1].method).toBe("PATCH");
    expect(call[1].headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(call[1].body)).toEqual({ updated: true });
  });
});

describe("error classes", () => {
  it("DriveApiError should have status", () => {
    const err = new DriveApiError("test", 403);
    expect(err.message).toBe("test");
    expect(err.status).toBe(403);
    expect(err.name).toBe("DriveApiError");
    expect(err).toBeInstanceOf(Error);
  });

  it("TokenExpiredError should be a DriveApiError with 401", () => {
    const err = new TokenExpiredError();
    expect(err.status).toBe(401);
    expect(err.name).toBe("TokenExpiredError");
    expect(err).toBeInstanceOf(DriveApiError);
  });
});
