/** Return the best available Japanese TTS voice (high-quality voices first). */
export function getBestJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const name of ["Kyoko", "Google 日本語", "O-Ren", "Otoya", "Hattori"]) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith("ja"));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("ja")) ?? null;
}
