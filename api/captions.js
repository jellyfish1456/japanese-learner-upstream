/**
 * Vercel Serverless Function — YouTube Caption Proxy
 *
 * Strategy order:
 *   1. youtube-transcript package (fast, works for ~80% of videos)
 *   2. InnerTube API (YouTube's own internal API) → fetch caption server-side
 *   3. Watch-page scrape → fetch caption server-side
 *   4. Return signed URL to browser as last resort
 *
 * GET /api/captions?v=VIDEO_ID[&lang=ja]
 */

import { YoutubeTranscript } from "youtube-transcript";

// Public InnerTube web client key (used by youtube.com itself)
const IT_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickTrack(tracks, lang) {
  return (
    tracks.find((t) => t.languageCode === lang) ??
    tracks.find((t) => t.languageCode?.startsWith(lang)) ??
    tracks[0] ??
    null
  );
}

/** Fetch caption JSON3 from a baseUrl, trying both server-side fetch attempts. */
async function fetchCaptionContent(baseUrl, videoId) {
  const url = baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      "Referer": `https://www.youtube.com/watch?v=${videoId}`,
      "Cookie": "CONSENT=YES+cb; PREF=hl=ja&f6=40000000",
    },
  });
  const text = await res.text();
  if (!text || text.length < 10) return null;
  if (text.trimStart().startsWith("{")) return JSON.parse(text);
  return null;
}

/** Extract caption tracks via InnerTube /player endpoint. */
async function innertubePlayerData(videoId, lang) {
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${IT_KEY}&prettyPrint=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": BROWSER_UA,
        "X-YouTube-Client-Name": "1",
        "X-YouTube-Client-Version": "2.20240430.00.00",
        "Origin": "https://www.youtube.com",
        "Referer": `https://www.youtube.com/watch?v=${videoId}`,
        "Accept-Language": "ja,en-US;q=0.9",
        "Cookie": "CONSENT=YES+cb; PREF=hl=ja",
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240430.00.00",
            hl: lang,
            gl: "JP",
          },
        },
      }),
    }
  );
  return res.json();
}

// String-aware JSON object extractor (handles nested braces inside strings)
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

function extractCaptionTracks(html) {
  const markerIdx = html.indexOf("ytInitialPlayerResponse");
  if (markerIdx < 0) return [];
  const start = html.indexOf("{", markerIdx);
  if (start < 0) return [];
  const jsonStr = extractJsonObject(html, start);
  if (!jsonStr) return [];
  let playerData;
  try { playerData = JSON.parse(jsonStr); } catch { return []; }
  return playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

function json3ToEvents(json3) {
  return (json3.events ?? []).filter((e) => Array.isArray(e.segs));
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { v: videoId, lang = "ja" } = req.query;
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: "invalid_video_id" });
  }

  // ── Strategy 1: youtube-transcript (fast path) ───────────────────────────
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
    if (segments?.length > 0) {
      return res.status(200).json({
        events: segments.map((s) => ({
          tStartMs: Math.round(s.offset),
          dDurationMs: Math.round(s.duration),
          segs: [{ utf8: s.text }],
        })),
      });
    }
  } catch { /* fall through */ }

  // ── Strategy 2: InnerTube API → server-side caption fetch ────────────────
  try {
    const playerData = await innertubePlayerData(videoId, lang);
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    const track = pickTrack(tracks, lang);
    if (track?.baseUrl) {
      const json3 = await fetchCaptionContent(track.baseUrl, videoId).catch(() => null);
      if (json3) {
        const events = json3ToEvents(json3);
        if (events.length > 0) return res.status(200).json({ events });
      }
      // Server-side fetch empty — return URL to browser (browser has different IP/cookies)
      const fmt3Url = track.baseUrl.includes("fmt=")
        ? track.baseUrl
        : `${track.baseUrl}&fmt=json3`;
      return res.status(200).json({
        events: [],
        captionUrl: track.baseUrl,
        captionUrlJson3: fmt3Url,
      });
    }
  } catch { /* fall through */ }

  // ── Strategy 3: Watch-page scrape → server-side caption fetch ────────────
  try {
    const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        "Cookie": "CONSENT=YES+cb; PREF=hl=ja",
      },
    }).then((r) => r.text());

    const tracks = extractCaptionTracks(html);
    const track = pickTrack(tracks, lang);
    if (track?.baseUrl) {
      const json3 = await fetchCaptionContent(track.baseUrl, videoId).catch(() => null);
      if (json3) {
        const events = json3ToEvents(json3);
        if (events.length > 0) return res.status(200).json({ events });
      }
      const fmt3Url = track.baseUrl.includes("fmt=")
        ? track.baseUrl
        : `${track.baseUrl}&fmt=json3`;
      return res.status(200).json({
        events: [],
        captionUrl: track.baseUrl,
        captionUrlJson3: fmt3Url,
      });
    }
    return res.status(200).json({ events: [], error: "no_captions_found" });
  } catch (err) {
    return res.status(500).json({ events: [], error: String(err?.message ?? err) });
  }
}
