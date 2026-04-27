/**
 * Vercel Serverless Function — YouTube Caption Proxy
 *
 * Why this works:
 *   YouTube's timedtext API requires *signed* URLs found inside the watch-page
 *   HTML (ytInitialPlayerResponse.captionTracks[].baseUrl). A browser cannot
 *   fetch that page (no CORS header), so we fetch it server-side here.
 *   The signed timedtext URL itself DOES have CORS headers, so after we
 *   obtain it here, the browser could even fetch it directly — but for
 *   simplicity we proxy the final caption content too.
 *
 * Usage:  GET /api/captions?v=VIDEO_ID[&lang=ja]
 * Returns: YouTube JSON3 caption data
 *
 * Deploy in 2 minutes (free):
 *   1. Go to vercel.com → sign in with GitHub
 *   2. "Add New Project" → import this GitHub repo
 *   3. Click Deploy (Vercel auto-detects Vite)
 *   4. Done — captions will work automatically on the Vercel URL
 */

const HANDLER_VERSION = "v7";

export default async function handler(req, res) {
  // CORS headers — allow any origin (the browser-side fetch uses this)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { v: videoId, lang = "ja" } = req.query;

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: "invalid_video_id" });
  }

  try {
    // ── 1. Fetch YouTube watch page (server-to-server, no CORS issue) ────────
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        // Bypass YouTube consent screen (EU/region gates)
        Cookie: "CONSENT=YES+cb; YSC=x; VISITOR_INFO1_LIVE=x",
      },
    });
    const html = await pageRes.text();
    const markerIdx = html.indexOf("ytInitialPlayerResponse");
    const ctIdx = html.indexOf("captionTracks");

    // ── 2. Extract ytInitialPlayerResponse ────────────────────────────────────
    const captionUrl = extractCaptionUrl(html, lang);
    if (!captionUrl) {
      return res.status(200).json({
        events: [], error: "no_captions_found",
        _debug: { htmlLen: html.length, markerIdx, ctIdx, v: HANDLER_VERSION },
      });
    }

    // ── 3. Fetch the actual caption content (JSON3) ────────────────────────────
    const capFetchUrl = `${captionUrl}&fmt=json3`;
    const capRes = await fetch(capFetchUrl);
    const capText = await capRes.text();
    if (!capRes.ok) {
      return res.status(502).json({ events: [], error: `caption_fetch_${capRes.status}`, _body: capText.slice(0, 200) });
    }
    // Debug: return raw text info if JSON parse would fail
    let data;
    try {
      data = JSON.parse(capText);
    } catch (parseErr) {
      return res.status(500).json({
        events: [], error: "caption_json_parse_failed",
        _debug: { status: capRes.status, bodyLen: capText.length, bodyHead: capText.slice(0, 300), urlHead: capFetchUrl.slice(0, 150) },
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ events: [], error: String(err), v: HANDLER_VERSION, stack: err?.stack?.slice(0,300) });
  }
}

/**
 * String-aware JSON value extractor.
 * Handles `"{"` and `"\""` inside strings correctly — plain bracket counting fails on those.
 */
function extractJsonObject(str, startIdx) {
  const open = str[startIdx];
  const close = open === "{" ? "}" : "]";
  let depth = 0, inString = false, i = startIdx;
  while (i < str.length) {
    const c = str[i];
    if (inString) {
      if (c === "\\") i++;          // skip escaped char
      else if (c === '"') inString = false;
    } else {
      if (c === '"') inString = true;
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) return str.slice(startIdx, i + 1); }
    }
    i++;
  }
  return null;
}

/** Parse ytInitialPlayerResponse from HTML, return signed captionTrack baseUrl */
function extractCaptionUrl(html, lang) {
  const markerIdx = html.indexOf("ytInitialPlayerResponse");
  if (markerIdx < 0) return null;

  const start = html.indexOf("{", markerIdx);
  if (start < 0) return null;

  const jsonStr = extractJsonObject(html, start);
  if (!jsonStr) return null;

  let playerData;
  try {
    playerData = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  const tracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  const track =
    tracks.find((t) => t.languageCode === lang) ??
    tracks.find((t) => t.languageCode.startsWith(lang)) ??
    tracks[0];

  return track?.baseUrl ?? null;
}
