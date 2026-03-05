import type { DriveFileInfo } from "./syncTypes";
import { DRIVE_FOLDER_NAME } from "./syncTypes";

// ========== Error Classes ==========

export class DriveApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "DriveApiError";
    this.status = status;
  }
}

export class TokenExpiredError extends DriveApiError {
  constructor() {
    super("Token expired", 401);
    this.name = "TokenExpiredError";
  }
}

// ========== Helpers ==========

async function driveRequest(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (res.status === 401) throw new TokenExpiredError();
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DriveApiError(`Drive API error: ${res.status} ${text}`, res.status);
  }
  return res;
}

// ========== Folder Operations ==========

export async function ensureAppFolder(token: string): Promise<string> {
  // Search for existing folder
  const query = `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const searchRes = await driveRequest(searchUrl, token);
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await driveRequest(
    "https://www.googleapis.com/drive/v3/files",
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
        parents: ["root"],
      }),
    },
  );
  const folder = await createRes.json();
  return folder.id;
}

// ========== File Listing ==========

export async function listAppFiles(
  token: string,
  folderId: string,
): Promise<DriveFileInfo[]> {
  const query = `'${folderId}' in parents and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`;
  const res = await driveRequest(url, token);
  const data = await res.json();
  return (data.files || []).map((f: { id: string; name: string; modifiedTime: string }) => ({
    fileId: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
  }));
}

// ========== File Read ==========

export async function readJsonFile<T>(token: string, fileId: string): Promise<T> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await driveRequest(url, token);
  return res.json();
}

// ========== File Create (multipart upload) ==========

export async function createJsonFile<T>(
  token: string,
  folderId: string,
  name: string,
  data: T,
): Promise<string> {
  const metadata = {
    name,
    mimeType: "application/json",
    parents: [folderId],
  };

  const boundary = "---sync-boundary-" + Date.now();
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(data)}\r\n` +
    `--${boundary}--`;

  const res = await driveRequest(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    token,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  const result = await res.json();
  return result.id;
}

// ========== File Update ==========

export async function updateJsonFile<T>(
  token: string,
  fileId: string,
  data: T,
): Promise<void> {
  await driveRequest(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    token,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
}
