import type { GoogleAuthState } from "./syncTypes";
import { GOOGLE_AUTH_KEY } from "./syncTypes";

// ========== GIS Type Declarations ==========

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GisTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message: string }) => void;
  prompt?: string;
}

interface GoogleAccounts {
  oauth2: {
    initTokenClient: (config: GisTokenClientConfig) => TokenClient;
    revoke: (token: string, cb?: () => void) => void;
  };
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

// ========== Script Loading ==========

let gisLoadPromise: Promise<void> | null = null;

export function loadGisScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts) {
        gisLoadPromise = null;
        reject(new Error("Google Identity Services loaded but not available"));
        return;
      }
      resolve();
    };
    script.onerror = () => {
      gisLoadPromise = null;
      reject(new Error("Failed to load Google Identity Services"));
    };
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

// ========== OAuth2 Token Flow ==========

const SCOPES = "https://www.googleapis.com/auth/drive.file email";

function getClientId(): string {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!id) throw new Error("VITE_GOOGLE_CLIENT_ID is not set");
  return id;
}

async function fetchEmailWithRetry(token: string): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const info = await r.json();
      if (info.email) return info.email;
    } catch {
      // retry
    }
  }
  return "unknown";
}

export function requestAccessToken(): Promise<GoogleAuthState> {
  return loadGisScript().then(() => {
    return new Promise<GoogleAuthState>((resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: getClientId(),
        scope: SCOPES,
        callback: (response: TokenResponse) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          // Fetch email from userinfo (with retry)
          const expiresAt = Date.now() + response.expires_in * 1000;
          fetchEmailWithRetry(response.access_token).then((email) => {
            const auth: GoogleAuthState = {
              accessToken: response.access_token,
              expiresAt,
              email,
            };
            saveAuthState(auth);
            resolve(auth);
          });
        },
        error_callback: (error) => {
          reject(new Error(error.message || "OAuth error"));
        },
      });
      client.requestAccessToken();
    });
  });
}

export function trySilentReauth(): Promise<GoogleAuthState | null> {
  return loadGisScript().then(() => {
    return new Promise<GoogleAuthState | null>((resolve) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: getClientId(),
        scope: SCOPES,
        prompt: "none",
        callback: (response: TokenResponse) => {
          if (response.error) {
            resolve(null);
            return;
          }
          const saved = loadAuthState();
          const auth: GoogleAuthState = {
            accessToken: response.access_token,
            expiresAt: Date.now() + response.expires_in * 1000,
            email: saved?.email || "unknown",
          };
          saveAuthState(auth);
          resolve(auth);
        },
        error_callback: () => {
          resolve(null);
        },
      });
      client.requestAccessToken({ prompt: "none" });
    });
  });
}

// ========== Token Validation ==========

export function isTokenValid(auth: GoogleAuthState | null): boolean {
  if (!auth) return false;
  // 60s buffer before expiry
  return auth.expiresAt > Date.now() + 60_000;
}

// ========== Token Revocation ==========

export function revokeAccess(token: string): Promise<void> {
  return loadGisScript().then(() => {
    return new Promise<void>((resolve) => {
      window.google!.accounts.oauth2.revoke(token, () => resolve());
    });
  });
}

// ========== Auth State Persistence ==========

export function saveAuthState(auth: GoogleAuthState): void {
  localStorage.setItem(GOOGLE_AUTH_KEY, JSON.stringify(auth));
}

export function loadAuthState(): GoogleAuthState | null {
  try {
    const raw = localStorage.getItem(GOOGLE_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthState(): void {
  localStorage.removeItem(GOOGLE_AUTH_KEY);
}
