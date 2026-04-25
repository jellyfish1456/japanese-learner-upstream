/** Lazy-loaded furigana map: Japanese text → ruby HTML string */
let _map: Record<string, string> | null = null;
let _loading: Promise<void> | null = null;

export function loadFuriganaMap(): Promise<void> {
  if (_map) return Promise.resolve();
  if (_loading) return _loading;
  _loading = import("./furigana-map.json").then((m) => {
    _map = m.default as Record<string, string>;
  });
  return _loading;
}

export function getFuriganaHtml(text: string): string | null {
  return _map?.[text] ?? null;
}

/** Returns true if the map has been loaded */
export function isFuriganaReady(): boolean {
  return _map !== null;
}
