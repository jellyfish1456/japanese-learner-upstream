/**
 * Vercel Serverless Function — YouTube Caption Proxy
 * Uses youtube-transcript package to fetch captions server-side.
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

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });

    if (!segments || segments.length === 0) {
      return res.status(200).json({ events: [], error: "no_captions_found" });
    }

    // Convert to JSON3-compatible format { events: [{ tStartMs, dDurationMs, segs }] }
    const events = segments.map((s) => ({
      tStartMs: Math.round(s.offset),
      dDurationMs: Math.round(s.duration),
      segs: [{ utf8: s.text }],
    }));

    return res.status(200).json({ events });
  } catch (err) {
    const msg = String(err?.message ?? err);
    // youtube-transcript throws when no transcript is available
    if (msg.includes("No transcripts") || msg.includes("Could not find")) {
      return res.status(200).json({ events: [], error: "no_captions_found" });
    }
    return res.status(500).json({ events: [], error: msg });
  }
}
