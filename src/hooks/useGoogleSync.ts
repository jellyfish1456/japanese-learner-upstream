import { useState, useEffect, useCallback, useRef } from "react";
import type { SyncState, SyncMetadata } from "../lib/google/syncTypes";
import {
  requestAccessToken,
  isTokenValid,
  trySilentReauth,
  revokeAccess,
  loadAuthState,
  clearAuthState,
} from "../lib/google/gis";
import {
  pullFromDrive,
  pushToDrive,
  initialSync,
  createAutoPushDebouncer,
} from "../lib/google/syncEngine";
import { TokenExpiredError } from "../lib/google/driveApi";
import {
  subscribeSyncNeeded,
  loadSyncMetadata,
  clearSyncMetadata,
} from "../lib/storage";

function isEmailMismatch(authEmail: string, metaEmail: string): boolean {
  return authEmail !== "unknown" && metaEmail !== "unknown" && metaEmail !== authEmail;
}

const INITIAL_STATE: SyncState = {
  status: "disconnected",
  lastSyncedAt: null,
  error: null,
  isConnected: false,
  email: null,
};

// Guard against infinite reload after pull
const PULL_DONE_KEY = "jp-learner:sync-pull-done";

function markPullDone(): void {
  sessionStorage.setItem(PULL_DONE_KEY, "1");
}

function consumePullDone(): boolean {
  const done = sessionStorage.getItem(PULL_DONE_KEY) === "1";
  if (done) sessionStorage.removeItem(PULL_DONE_KEY);
  return done;
}

export function useGoogleSync() {
  const [syncState, setSyncState] = useState<SyncState>(() => {
    const meta = loadSyncMetadata();
    const auth = loadAuthState();
    if (meta && auth) {
      return {
        status: isTokenValid(auth) ? "idle" : "error",
        lastSyncedAt: meta.lastSyncedAt,
        error: isTokenValid(auth) ? null : "登入已過期，請重新登入",
        isConnected: true,
        email: meta.email,
      };
    }
    return INITIAL_STATE;
  });

  const isPullingRef = useRef(false);
  const metaRef = useRef<SyncMetadata | null>(loadSyncMetadata());
  // Sync mutex: prevents concurrent pull/push operations
  const syncBusyRef = useRef(false);
  // Guard against StrictMode double-effect triggering auto-pull twice
  const autoPullRanRef = useRef(false);

  // Auto-push debouncer
  const debouncerRef = useRef<ReturnType<typeof createAutoPushDebouncer> | null>(null);

  // Shared helper: ensure we have a valid auth token, re-auth if needed
  const ensureAuth = useCallback(async (): Promise<{ accessToken: string; email: string } | null> => {
    const auth = loadAuthState();
    if (auth && isTokenValid(auth)) return auth;
    try {
      return await requestAccessToken();
    } catch {
      setSyncState((s) => ({
        ...s,
        status: "error",
        error: "登入失敗",
      }));
      return null;
    }
  }, []);

  const doPush = useCallback(async () => {
    const auth = loadAuthState();
    const meta = metaRef.current;
    if (!auth || !meta) return;
    if (!isTokenValid(auth)) {
      setSyncState((s) => ({ ...s, status: "error", error: "登入已過期，請重新登入" }));
      return;
    }
    if (syncBusyRef.current) return; // skip if another operation is in progress

    syncBusyRef.current = true;
    setSyncState((s) => ({ ...s, status: "pushing", error: null }));
    try {
      const updated = await pushToDrive(auth.accessToken, meta);
      metaRef.current = updated;
      setSyncState((s) => ({
        ...s,
        status: "idle",
        lastSyncedAt: updated.lastSyncedAt,
        error: null,
      }));
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        setSyncState((s) => ({
          ...s,
          status: "error",
          error: "登入已過期，請重新登入",
        }));
      } else {
        setSyncState((s) => ({
          ...s,
          status: "error",
          error: err instanceof Error ? err.message : "同步失敗",
        }));
      }
    } finally {
      syncBusyRef.current = false;
    }
  }, []);

  // Initialize debouncer
  useEffect(() => {
    debouncerRef.current = createAutoPushDebouncer(doPush);
    return () => debouncerRef.current?.cancel();
  }, [doPush]);

  // Subscribe to sync notifications
  useEffect(() => {
    return subscribeSyncNeeded(() => {
      if (isPullingRef.current) return; // suppress during pull
      if (!metaRef.current) return; // not connected
      debouncerRef.current?.trigger();
    });
  }, []);

  // Auto-pull on mount if connected (skip if just reloaded after pull)
  useEffect(() => {
    // Guard: in React 18 StrictMode (dev), effects run twice. The first
    // call consumes the sessionStorage flag, so the second call would
    // incorrectly start auto-pull → reload → infinite loop. The ref
    // persists across StrictMode remounts, preventing this.
    if (autoPullRanRef.current) return;
    autoPullRanRef.current = true;

    // If we just finished a pull-triggered reload, skip auto-pull
    if (consumePullDone()) return;

    const auth = loadAuthState();
    const meta = loadSyncMetadata();
    if (!auth || !meta) return;

    const doPull = (token: string) => {
      isPullingRef.current = true;
      syncBusyRef.current = true;
      setSyncState((s) => ({ ...s, status: "pulling", error: null }));
      pullFromDrive(token, meta)
        .then((updated) => {
          metaRef.current = updated;
          isPullingRef.current = false;
          syncBusyRef.current = false;
          markPullDone();
          window.location.reload();
        })
        .catch((err) => {
          isPullingRef.current = false;
          syncBusyRef.current = false;
          setSyncState((s) => ({
            ...s,
            status: "error",
            error: err instanceof Error ? err.message : "同步失敗",
          }));
        });
    };

    if (isTokenValid(auth)) {
      // Account consistency: verify auth email matches metadata email
      if (isEmailMismatch(auth.email, meta.email)) {
        setSyncState((s) => ({
          ...s,
          status: "error",
          error: "帳號不一致，請重新登入",
        }));
        return;
      }
      doPull(auth.accessToken);
    } else {
      // Token expired, try silent reauth
      trySilentReauth()
        .then((newAuth) => {
          if (newAuth && isTokenValid(newAuth)) {
            doPull(newAuth.accessToken);
          } else {
            setSyncState((s) => ({
              ...s,
              status: "error",
              error: "登入已過期，請重新登入",
            }));
          }
        })
        .catch(() => {
          setSyncState((s) => ({
            ...s,
            status: "error",
            error: "登入已過期，請重新登入",
          }));
        });
    }
  }, []);

  // Sign in
  const signIn = useCallback(async () => {
    try {
      setSyncState((s) => ({ ...s, status: "pulling", error: null }));
      const auth = await requestAccessToken();
      const meta = await initialSync(auth.accessToken, auth.email);
      metaRef.current = meta;
      setSyncState({
        status: "idle",
        lastSyncedAt: meta.lastSyncedAt,
        error: null,
        isConnected: true,
        email: meta.email,
      });
    } catch (err) {
      setSyncState({
        ...INITIAL_STATE,
        error: err instanceof Error ? err.message : "登入失敗",
      });
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    debouncerRef.current?.cancel();
    syncBusyRef.current = false;
    isPullingRef.current = false;
    const auth = loadAuthState();
    if (auth) {
      try {
        await revokeAccess(auth.accessToken);
      } catch {
        // revoke may fail if token expired, that's ok
      }
    }
    clearAuthState();
    clearSyncMetadata();
    metaRef.current = null;
    setSyncState(INITIAL_STATE);
  }, []);

  // Manual sync (pull from cloud)
  const manualSync = useCallback(async () => {
    const meta = metaRef.current;
    if (!meta || syncBusyRef.current) return;

    const auth = await ensureAuth();
    if (!auth) return;

    if (isEmailMismatch(auth.email, meta.email)) {
      setSyncState((s) => ({ ...s, status: "error", error: "帳號不一致，請重新登入" }));
      return;
    }

    debouncerRef.current?.cancel(); // cancel pending auto-push
    syncBusyRef.current = true;
    isPullingRef.current = true;
    setSyncState((s) => ({ ...s, status: "pulling", error: null }));
    try {
      const updated = await pullFromDrive(auth.accessToken, meta);
      metaRef.current = updated;
      isPullingRef.current = false;
      syncBusyRef.current = false;
      markPullDone();
      window.location.reload();
    } catch (err) {
      isPullingRef.current = false;
      syncBusyRef.current = false;
      setSyncState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "同步失敗",
      }));
    }
  }, [ensureAuth]);

  // Manual push
  const manualPush = useCallback(async () => {
    const meta = metaRef.current;
    if (!meta || syncBusyRef.current) return;

    const auth = await ensureAuth();
    if (!auth) return;

    if (isEmailMismatch(auth.email, meta.email)) {
      setSyncState((s) => ({ ...s, status: "error", error: "帳號不一致，請重新登入" }));
      return;
    }

    debouncerRef.current?.cancel(); // cancel pending auto-push
    syncBusyRef.current = true;
    setSyncState((s) => ({ ...s, status: "pushing", error: null }));
    try {
      const updated = await pushToDrive(auth.accessToken, meta);
      metaRef.current = updated;
      setSyncState((s) => ({
        ...s,
        status: "idle",
        lastSyncedAt: updated.lastSyncedAt,
        error: null,
      }));
    } catch (err) {
      setSyncState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "推送失敗",
      }));
    } finally {
      syncBusyRef.current = false;
    }
  }, [ensureAuth]);

  return { syncState, signIn, signOut, manualSync, manualPush };
}
