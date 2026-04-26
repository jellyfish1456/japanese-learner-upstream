/**
 * YouTube Caption Proxy — Cloudflare Worker
 *
 * Why this is needed:
 *   YouTube's timedtext API requires *signed* URLs that are embedded in the
 *   watch-page HTML (ytInitialPlayerResponse.captions.captionTracks[].baseUrl).
 *   A browser on GitHub Pages cannot fetch youtube.com/watch because that page
 *   has no CORS header, so we proxy that single fetch server-side here.
 *   The signed timedtext URL itself *does* have CORS headers for GitHub Pages,
 *   so we only need to proxy the watch-page, not the caption content.
 *
 * Deploy in 2 minutes (free):
 *   1. Go to https://workers.cloudflare.com  → sign in with GitHub
 *   2. Create Application → Create Worker
 *   3. Replace the default code with this file
 *   4. Click "Deploy"
 *   5. Copy the *.workers.dev URL → add it as GitHub secret VITE_CAPTION_PROXY_URL
 *   6. Re-deploy the app (push any commit)
 *
 * Usage:  GET https://your-worker.workers.dev?v=VIDEO_ID[&lang=ja]
 * Returns: YouTube JSON3 caption data  { events: [{tStartMs, dDurationMs, segs:[{utf8}]}] }
 */

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("v") ?? "";
    const lang    = searchParams.get("lang") ?? "ja";

    if (!/^[\w-]{11}$/.test(videoId)) {
      return json({ error: "invalid videoId" }, 400);
    }

    try {
      // ── 1. Fetch the YouTube watch page (server-to-server, no CORS issue) ──
      const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          "User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
          "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const html = await pageResp.text();

      // ── 2. Extract ytInitialPlayerResponse using bracket counting ──────────
      const marker = "ytInitialPlayerResponse";
      const mIdx   = html.indexOf(marker);
      if (mIdx < 0) return json({ events: [], error: "no_player_response" });

      const start = html.indexOf("{", mIdx);
      if (start < 0) return json({ events: [], error: "no_json_start" });

      let depth = 0, end = start;
      for (let i = start; i < html.length; i++) {
        if (html[i] === "{") depth++;
        else if (html[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
      }

      const playerData = JSON.parse(html.slice(start, end + 1));
      const tracks     = playerData?.captions
                          ?.playerCaptionsTracklistRenderer
                          ?.captionTracks ?? [];

      // ── 3. Pick the best language track ───────────────────────────────────
      const track = tracks.find(t => t.languageCode === lang)
                 ?? tracks.find(t => t.languageCode.startsWith(lang))
                 ?? tracks[0];

      if (!track) return json({ events: [], error: "no_captions", available: tracks.map(t => t.languageCode) });

      // ── 4. Fetch the signed caption URL (returns JSON3 directly) ──────────
      const captionUrl = `${track.baseUrl}&fmt=json3`;
      const capResp    = await fetch(captionUrl);
      const capText    = await capResp.text();

      return new Response(capText, {
        headers: { ...cors(), "Content-Type": "application/json; charset=utf-8" },
      });

    } catch (err) {
      return json({ events: [], error: String(err) });
    }
  },
};

function cors() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(), "Content-Type": "application/json; charset=utf-8" },
  });
}
