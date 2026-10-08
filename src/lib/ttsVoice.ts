const VOICE_KEY = "jp-learner:tts-voice";

const QUALITY_KEYWORDS = ["google", "enhanced", "premium", "natural", "neural", "wavenet"];

function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  let s = 0;
  if (QUALITY_KEYWORDS.some((k) => name.includes(k))) s += 10;
  if (!v.localService) s += 5;
  if (v.lang === "ja-JP") s += 2;
  return s;
}

export function getJapaneseVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith("ja"))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

export function getSavedVoiceName(): string | null {
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

export function saveVoiceName(name: string): void {
  try {
    localStorage.setItem(VOICE_KEY, name);
  } catch { /* ignore */ }
}

export function pickBestVoice(): SpeechSynthesisVoice | null {
  const voices = getJapaneseVoices();
  if (voices.length === 0) return null;

  const saved = getSavedVoiceName();
  if (saved) {
    const match = voices.find((v) => v.name === saved);
    if (match) return match;
  }

  return voices[0];
}
