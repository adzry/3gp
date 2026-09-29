/**
 * DRAFT transcript: estimated timing from the script, before any recording
 * exists. Lets scenes be designed and previewed voice-first ("build against
 * provisional timings, then re-time to the real VO"). Marked
 * `engine.name: "draft"` — it is never a claim about recorded audio.
 *
 * Deterministic: same script → same timings.
 */
import type { Transcript } from "../../src/video/transcript.ts";

/** Pull narration from script.md: every line starting with "VO:" is one segment. */
export const extractVoLines = (markdown: string) =>
  markdown
    .split("\n")
    .map((l) => l.match(/^\s*(?:[-*]\s*)?VO:\s*(.+?)\s*$/i)?.[1])
    .filter((l): l is string => Boolean(l && l.trim()));

const r = (s: number) => Math.round(s * 1000) / 1000;

/** Rough spoken length of a word: longer words take longer (~2.4 words/s average). */
const wordSeconds = (w: string) => {
  const letters = w.replace(/[^\p{L}\p{N}]/gu, "").length;
  return Math.min(0.9, Math.max(0.18, 0.12 + 0.055 * letters));
};

export const draftTranscript = (
  lines: string[],
  source: string,
): Transcript => {
  let t = 0.3; // breath before the first word
  const segments: Transcript["segments"] = lines.map((line, li) => {
    if (li > 0) t += 0.45; // pause between lines
    const words = line
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const start = t;
        const end = start + wordSeconds(word);
        t = end + 0.04;
        if (/[.!?…]["”')]*$/.test(word)) t += 0.35;
        else if (/[,;:—–-]["”')]*$/.test(word)) t += 0.18;
        return { word, start: r(start), end: r(end) };
      });
    return {
      start: words[0].start,
      end: words[words.length - 1].end,
      text: line,
      words,
    };
  });
  return {
    version: 1,
    source,
    duration: r(t + 0.5),
    language: "en",
    engine: { name: "draft" },
    segments,
  };
};
