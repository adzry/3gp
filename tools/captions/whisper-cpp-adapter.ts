/**
 * whisper.cpp full JSON (as returned by @remotion/install-whisper-cpp
 * `transcribe({ tokenLevelTimestamps: true })`) → 3gp Transcript.
 *
 * whisper.cpp emits sub-word TOKENS (" pock", "et", "."). A token starting
 * with a space begins a new word; others (and bare punctuation) attach to the
 * current word. Special tokens ("[_BEG_]", "[_TT_42]") are dropped.
 * Timing is normalised so words never run backwards or overlap.
 */
import type { Transcript } from "../../src/video/transcript.ts";

type Token = {
  text: string;
  offsets: { from: number; to: number };
  p?: number;
};
type Item = {
  text: string;
  offsets: { from: number; to: number };
  tokens?: Token[];
};

export type WhisperCppJson = {
  result?: { language?: string };
  params?: { model?: string; language?: string };
  transcription: Item[];
};

const isSpecial = (t: string) =>
  /^\s*\[_/.test(t) || /^\s*<\|.*\|>\s*$/.test(t);
const isPunctuation = (t: string) => /^[\p{P}\p{S}]+$/u.test(t.trim());
const round = (s: number) => Math.round(s * 1000) / 1000;

export const whisperCppToTranscript = (
  json: WhisperCppJson,
  meta: {
    source: string;
    duration: number;
    sourceSha256?: string;
    engine: Transcript["engine"];
    createdAt?: string;
  },
): Transcript => {
  const segments: Transcript["segments"] = [];
  let prevEnd = 0;

  for (const item of json.transcription) {
    const words: { word: string; start: number; end: number; ps: number[] }[] =
      [];
    for (const tok of item.tokens ?? []) {
      if (!tok.text || isSpecial(tok.text)) continue;
      const startsWord = /^\s/.test(tok.text);
      const text = tok.text.trim();
      if (!text) continue;
      const current = words[words.length - 1];
      if (current && (!startsWord || isPunctuation(text))) {
        current.word += text;
        current.end = tok.offsets.to / 1000;
        if (tok.p !== undefined) current.ps.push(tok.p);
      } else {
        words.push({
          word: text,
          start: tok.offsets.from / 1000,
          end: tok.offsets.to / 1000,
          ps: tok.p !== undefined ? [tok.p] : [],
        });
      }
    }
    if (words.length === 0) continue;

    const normalised = words.map((w) => {
      const start = round(Math.min(Math.max(w.start, prevEnd), meta.duration));
      const end = round(Math.min(Math.max(w.end, start), meta.duration));
      prevEnd = end;
      const confidence = w.ps.length
        ? round(w.ps.reduce((a, b) => a + b, 0) / w.ps.length)
        : undefined;
      return {
        word: w.word,
        start,
        end,
        ...(confidence !== undefined ? { confidence } : {}),
      };
    });
    const first = normalised[0];
    const last = normalised[normalised.length - 1];
    segments.push({
      start: first.start,
      end: last.end,
      text: normalised.map((w) => w.word).join(" "),
      words: normalised,
    });
  }

  return {
    version: 1,
    source: meta.source,
    ...(meta.sourceSha256 ? { sourceSha256: meta.sourceSha256 } : {}),
    duration: meta.duration,
    language: json.result?.language ?? json.params?.language,
    engine: meta.engine,
    ...(meta.createdAt ? { createdAt: meta.createdAt } : {}),
    segments,
  };
};
