/**
 * The 3gp transcript format: a timed record of what was said in a voice-over.
 * One file per recording, stored next to the audio in public/projects/<n>/.
 *
 * It is engine-neutral (whisper.cpp today; anything that yields word timing
 * tomorrow) and is the single source for captions, voice-driven scene timing
 * and, later, search / emphasis / automatic editing.
 *
 * Times are in SECONDS relative to the start of the audio file.
 * Pure zod + pure functions with explicit .ts imports so Node tools can use it.
 */
import { z } from "zod";

const seconds = z.number().min(0);

export const transcriptWordSchema = z.object({
  /** The word as spoken, without surrounding whitespace. Punctuation stays attached ("pocket."). */
  word: z.string().min(1),
  start: seconds,
  end: seconds,
  /** 0–1 model confidence, when the engine provides it. */
  confidence: z.number().min(0).max(1).optional(),
});

export const transcriptSegmentSchema = z.object({
  start: seconds,
  end: seconds,
  text: z.string(),
  /** Future: diarisation. Free-form label ("host", "S1"). */
  speaker: z.string().optional(),
  words: z.array(transcriptWordSchema),
});

export const transcriptSchema = z.object({
  version: z.literal(1),
  /** Audio path relative to public/ (as used in video.json). */
  source: z.string(),
  /** SHA-256 of the audio file — detects a stale transcript after re-recording. */
  sourceSha256: z.string().optional(),
  /** Audio duration in seconds. */
  duration: z.number().positive(),
  /** ISO 639-1 code ("en") when known. */
  language: z.string().optional(),
  engine: z.object({
    /** e.g. "whisper.cpp", or "draft" for timing estimated from the script. */
    name: z.string(),
    version: z.string().optional(),
    model: z.string().optional(),
  }),
  createdAt: z.string().optional(),
  segments: z.array(transcriptSegmentSchema),
});

export type Transcript = z.infer<typeof transcriptSchema>;
export type TranscriptWord = z.infer<typeof transcriptWordSchema>;

/** Tolerance for timing comparisons (seconds). */
export const TIME_EPSILON = 0.02;

/**
 * Semantic checks zod can't express: ordering, overlaps, bounds.
 * Returns human-readable errors with paths; empty = valid.
 */
export const checkTranscript = (t: Transcript): string[] => {
  const errors: string[] = [];
  let prevWordEnd = 0;
  let prevWordStart = 0;
  let prevSegEnd = 0;
  let wordIndex = 0;
  t.segments.forEach((seg, si) => {
    const at = `segments.${si}`;
    if (seg.end < seg.start)
      errors.push(`${at}: end (${seg.end}) is before start (${seg.start})`);
    if (seg.start < prevSegEnd - TIME_EPSILON) {
      errors.push(
        `${at}: starts at ${seg.start}s, before the previous segment ends (${prevSegEnd}s)`,
      );
    }
    if (seg.end > t.duration + TIME_EPSILON) {
      errors.push(
        `${at}: ends at ${seg.end}s, after the audio duration (${t.duration}s)`,
      );
    }
    prevSegEnd = Math.max(prevSegEnd, seg.end);
    seg.words.forEach((w, wi) => {
      const wat = `${at}.words.${wi} (word #${wordIndex} "${w.word}")`;
      if (w.end < w.start)
        errors.push(`${wat}: end (${w.end}) is before start (${w.start})`);
      if (w.start < prevWordStart - TIME_EPSILON) {
        errors.push(
          `${wat}: starts at ${w.start}s, before the previous word (${prevWordStart}s) — words must be in time order`,
        );
      } else if (w.start < prevWordEnd - TIME_EPSILON) {
        errors.push(
          `${wat}: overlaps the previous word (starts ${w.start}s, previous ends ${prevWordEnd}s)`,
        );
      }
      if (
        w.start < seg.start - TIME_EPSILON ||
        w.end > seg.end + TIME_EPSILON
      ) {
        errors.push(
          `${wat}: [${w.start}–${w.end}s] lies outside its segment [${seg.start}–${seg.end}s]`,
        );
      }
      if (w.end > t.duration + TIME_EPSILON) {
        errors.push(
          `${wat}: ends at ${w.end}s, after the audio duration (${t.duration}s)`,
        );
      }
      prevWordStart = w.start;
      prevWordEnd = Math.max(prevWordEnd, w.end);
      wordIndex++;
    });
  });
  return errors;
};

/** Parse + check. Throws with every problem listed. */
export const parseTranscript = (data: unknown): Transcript => {
  const r = transcriptSchema.safeParse(data);
  if (!r.success) {
    throw new Error(
      "Invalid transcript:\n" +
        r.error.issues
          .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("\n"),
    );
  }
  const errors = checkTranscript(r.data);
  if (errors.length)
    throw new Error(
      "Invalid transcript:\n" + errors.map((e) => `  ${e}`).join("\n"),
    );
  return r.data;
};

/** All words in order, with their global index and segment index. */
export const flattenWords = (t: Transcript) =>
  t.segments
    .flatMap((seg, segment) => seg.words.map((w) => ({ ...w, segment })))
    .map((w, index) => ({ ...w, index }));

export type FlatWord = ReturnType<typeof flattenWords>[number];

/** Seconds → frame index (nearest frame). The one conversion used everywhere. */
export const secondsToFrame = (s: number, fps: number) => Math.round(s * fps);

/** Structurally identical to @remotion/captions `Caption` (kept dependency-free for Node). */
export type CaptionLike = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
  pageBreakAfter?: boolean;
};

/**
 * Transcript → @remotion/captions Caption[] (one caption per word).
 * Follows Remotion's convention: every token after the first carries its
 * leading space. `offset` shifts everything (voice-over starting later in the video).
 * Caption pages break after sentence-ending punctuation and at segment ends,
 * so a page never mixes the end of one thought with the start of the next.
 */
export const transcriptToCaptions = (
  t: Transcript,
  offset = 0,
): CaptionLike[] => {
  const words = flattenWords(t);
  return words.map((w, i) => ({
    text: i === 0 ? w.word : ` ${w.word}`,
    startMs: Math.round((w.start + offset) * 1000),
    endMs: Math.round((w.end + offset) * 1000),
    timestampMs: Math.round((w.start + offset) * 1000),
    confidence: w.confidence ?? null,
    pageBreakAfter:
      /[.!?…]["”')\]]*$/.test(w.word) || words[i + 1]?.segment !== w.segment,
  }));
};

/** Normalise for phrase matching: lowercase, letters/digits only. */
export const normalizeWord = (w: string) =>
  w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * Find the first occurrence of `phrase` in the word list at or after
 * `fromIndex`. Punctuation- and case-insensitive. Returns [first, last] word
 * indices or null.
 */
export const findPhrase = (
  words: { word: string }[],
  phrase: string,
  fromIndex = 0,
): [number, number] | null => {
  const needle = phrase.split(/\s+/).map(normalizeWord).filter(Boolean);
  if (needle.length === 0) return null;
  const hay = words.map((w) => normalizeWord(w.word));
  for (let i = Math.max(0, fromIndex); i + needle.length <= hay.length; i++) {
    if (needle.every((n, k) => hay[i + k] === n))
      return [i, i + needle.length - 1];
  }
  return null;
};
