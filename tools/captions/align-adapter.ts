/**
 * Forced alignment → 3gp transcript. The words come from the script (the
 * narrator read them); the TIMES come from the audio (pocketsphinx aligns
 * each word to where it is actually spoken). Pure, unit-tested.
 */
import type { Transcript } from "../../src/video/transcript.ts";

/**
 * Dictionary tokens for one script word: lower-case, punctuation stripped,
 * hyphenated words split, acronyms spelled out ("GPS" → g, p, s).
 */
export const spokenTokens = (word: string): string[] =>
  word
    .split(/[-–—]/)
    .map((w) => w.replace(/[^\p{L}\p{N}']/gu, "").replace(/^'+|'+$/g, ""))
    .filter(Boolean)
    .flatMap((w) =>
      /^[A-Z]{2,}$/.test(w) ? w.toLowerCase().split("") : [w.toLowerCase()],
    );

export type AlignedToken = { t: string; s: number; e: number };

const r = (s: number) => Math.round(s * 1000) / 1000;

/**
 * Map aligned tokens back onto the script's words (one segment per VO line).
 * Throws if the aligner's tokens don't match the script (never guesses).
 */
export const alignedToTranscript = (
  lines: string[],
  aligned: AlignedToken[],
  meta: { source: string; duration: number; sourceSha256?: string },
): Transcript => {
  let k = 0;
  const segments = lines.map((line) => {
    const words = line
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const tokens = spokenTokens(word);
        if (!tokens.length) return null;
        const got = aligned.slice(k, k + tokens.length);
        if (got.length !== tokens.length || got.some((g, i) => g.t !== tokens[i])) {
          throw new Error(
            `alignment does not match the script at "${word}" (expected ${tokens.join(" ")}, got ${got.map((g) => g.t).join(" ") || "nothing"})`,
          );
        }
        k += tokens.length;
        return { word, start: r(got[0].s), end: r(got[got.length - 1].e) };
      })
      .filter((w): w is { word: string; start: number; end: number } => w !== null);
    return {
      start: words[0].start,
      end: words[words.length - 1].end,
      text: line,
      words,
    };
  });
  if (k !== aligned.length) {
    throw new Error(`aligner returned ${aligned.length - k} extra token(s)`);
  }
  return {
    version: 1,
    source: meta.source,
    sourceSha256: meta.sourceSha256,
    duration: r(meta.duration),
    language: "en",
    engine: { name: "pocketsphinx-align", model: "en-us (cmudict)" },
    createdAt: new Date().toISOString(),
    segments,
  };
};
