/**
 * Vercel Serverless Function — YouTube Caption Proxy
 *
 * Strategy:
 *   1. Try youtube-transcript package (works for most videos)
 *   2. If transcript disabled → extract signed timedtext URL from watch page
 *      and return it so the BROWSER can fetch it directly (signed URLs have
 *      CORS headers; they just return empty when fetched server-side).
 *
 * GET /api/captions?v=VIDEO_ID[&lang=ja]
 */

import { YoutubeTranscript } from "youtube-transcript";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { v: videoId, lang = "ja" } = req.query;

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: "invalid_video_id" });
  }

  // ── Strategy 1: youtube-transcript package ──────────────────────────────────
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
    if (segments && segments.length > 0) {
      const events = segments.map((s) => ({
        tStartMs: Math.round(s.offset),
        dDurationMs: Math.round(s.duration),
        segs: [{ utf8: s.text }],
      }));
      return res.status(200).json({ events });
    }
  } catch {
    // Fall through to strategy 2
  }

  // ── Strategy 2: extract signed URL for client-side fetch ────────────────────
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        Cookie: "CONSENT=YES+cb",
      },
    });
    const html = await pageRes.text();
    const captionUrl = extractCaptionUrl(html, lang);

    if (captionUrl) {
      // Return the signed URL — client will fetch it directly (CORS allowed)
      return res.status(200).json({
        events: [],
        captionUrl: captionUrl,
        captionUrlJson3: captionUrl + "&fmt=json3",
      });
    }

    return res.status(200).json({ events: [], error: "no_captions_found" });
  } catch (err) {
    return res.status(500).json({ events: [], error: String(err?.message ?? err) });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractJsonObject(str, startIdx) {
  const open = str[startIdx];
  const close = open === "{" ? "}" : "]";
  let depth = 0, inString = false, i = startIdx;
  while (i < str.length) {
    const c = str[i];
    if (inString) {
      if (c === "\\") i++;
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

function extractCaptionUrl(html, lang) {
  const markerIdx = html.indexOf("ytInitialPlayerResponse");
  if (markerIdx < 0) return null;
  const start = html.indexOf("{", markerIdx);
  if (start < 0) return null;

  const jsonStr = extractJsonObject(html, start);
  if (!jsonStr) return null;

  let playerData;
  try { playerData = JSON.parse(jsonStr); } catch { return null; }

  const tracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const track =
    tracks.find((t) => t.languageCode === lang) ??
    tracks.find((t) => t.languageCode.startsWith(lang)) ??
    tracks[0];

  return track?.baseUrl ?? null;
}
