import assert from "node:assert/strict";
import { test } from "node:test";
import {
  alignedToTranscript,
  spokenTokens,
} from "../tools/captions/align-adapter.ts";
import { checkTranscript, parseTranscript } from "../src/video/transcript.ts";

test("spokenTokens: dictionary forms of script words", () => {
  assert.deepEqual(spokenTokens("Einstein."), ["einstein"]);
  assert.deepEqual(spokenTokens("GPS"), ["g", "p", "s"]);
  assert.deepEqual(spokenTokens("forty-five,"), ["forty", "five"]);
  assert.deepEqual(spokenTokens("phone's"), ["phone's"]);
  assert.deepEqual(spokenTokens("—"), []);
});

const meta = { source: "projects/x/voiceover.wav", duration: 3, sourceSha256: "abc" };

test("aligned tokens map back onto the script's words and lines", () => {
  const t = alignedToTranscript(
    ["Around thirty GPS satellites.", "Hello."],
    [
      { t: "around", s: 0.1, e: 0.4 },
      { t: "thirty", s: 0.4, e: 0.7 },
      { t: "g", s: 0.7, e: 0.8 },
      { t: "p", s: 0.8, e: 0.9 },
      { t: "s", s: 0.9, e: 1.05 },
      { t: "satellites", s: 1.05, e: 1.6 },
      { t: "hello", s: 2.0, e: 2.4 },
    ],
    meta,
  );
  const words = t.segments.flatMap((s) => s.words);
  assert.deepEqual(
    words.map((w) => [w.word, w.start, w.end]),
    [
      ["Around", 0.1, 0.4],
      ["thirty", 0.4, 0.7],
      ["GPS", 0.7, 1.05],
      ["satellites.", 1.05, 1.6],
      ["Hello.", 2, 2.4],
    ],
  );
  assert.equal(t.segments.length, 2);
  assert.equal(t.engine.name, "pocketsphinx-align");
  assert.deepEqual(checkTranscript(parseTranscript(t)), []);
});

test("a recording that doesn't match the script fails loudly", () => {
  assert.throws(
    () =>
      alignedToTranscript(["Right now."], [{ t: "left", s: 0, e: 0.3 }, { t: "now", s: 0.3, e: 0.6 }], meta),
    /does not match the script at "Right"/,
  );
  assert.throws(
    () =>
      alignedToTranscript(["Now."], [{ t: "now", s: 0, e: 0.3 }, { t: "extra", s: 0.3, e: 0.6 }], meta),
    /extra token/,
  );
});
