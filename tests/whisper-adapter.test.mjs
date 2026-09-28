import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { whisperCppToTranscript } from "../tools/captions/whisper-cpp-adapter.ts";
import {
  checkTranscript,
  flattenWords,
  transcriptSchema,
} from "../src/video/transcript.ts";

const json = JSON.parse(
  fs.readFileSync(new URL("./fixtures/whisper-cpp-ojf.json", import.meta.url)),
);
const meta = {
  source: "projects/x/voiceover.wav",
  duration: 4.2,
  sourceSha256: "abc",
  engine: { name: "whisper.cpp", model: "base.en" },
};

test("tokens merge into words; special tokens and empty items are dropped", () => {
  const t = whisperCppToTranscript(json, meta);
  assert.deepEqual(
    flattenWords(t).map((w) => w.word),
    ["Voice", "first,", "then", "pocket.", "It", "works."],
  );
  assert.equal(t.segments.length, 2);
  assert.equal(t.segments[0].text, "Voice first, then pocket.");
});

test("word timing spans its tokens, in seconds", () => {
  const [voice, first, , pocket] = flattenWords(
    whisperCppToTranscript(json, meta),
  );
  assert.deepEqual([voice.start, voice.end], [0.3, 0.7]);
  assert.deepEqual([first.start, first.end], [0.7, 1.1]);
  assert.equal(pocket.end, 2.15);
});

test("overlapping token offsets are normalised (words never run backwards)", () => {
  // " pock" starts at 1.55s but " then" ends at 1.60s in the fixture.
  const words = flattenWords(whisperCppToTranscript(json, meta));
  assert.equal(words[3].start, 1.6);
  assert.deepEqual(checkTranscript(whisperCppToTranscript(json, meta)), []);
});

test("confidence is the mean token probability", () => {
  const [, first] = flattenWords(whisperCppToTranscript(json, meta));
  assert.equal(first.confidence, 0.75);
});

test("output matches the transcript schema and carries metadata", () => {
  const t = whisperCppToTranscript(json, meta);
  assert.equal(transcriptSchema.safeParse(t).success, true);
  assert.equal(t.language, "en");
  assert.equal(t.sourceSha256, "abc");
  assert.equal(t.engine.model, "base.en");
});

test("times are clamped to the audio duration", () => {
  const t = whisperCppToTranscript(json, { ...meta, duration: 3.5 });
  const last = flattenWords(t).at(-1);
  assert.ok(last.end <= 3.5);
  assert.deepEqual(checkTranscript(t), []);
});
