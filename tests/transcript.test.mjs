import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkTranscript,
  findPhrase,
  flattenWords,
  parseTranscript,
  secondsToFrame,
  transcriptSchema,
  transcriptToCaptions,
} from "../src/video/transcript.ts";
import { makeTranscript } from "./helpers.mjs";

const valid = () =>
  makeTranscript([
    ["Hello", "there."],
    ["Second", "line,", "here."],
  ]);

test("a well-formed transcript parses and checks clean", () => {
  const t = parseTranscript(valid());
  assert.equal(t.segments.length, 2);
  assert.deepEqual(checkTranscript(t), []);
});

test("schema rejects missing fields and negative times", () => {
  const t = valid();
  delete t.duration;
  assert.equal(transcriptSchema.safeParse(t).success, false);
  const neg = valid();
  neg.segments[0].words[0].start = -0.1;
  assert.equal(transcriptSchema.safeParse(neg).success, false);
  const badVersion = { ...valid(), version: 2 };
  assert.equal(transcriptSchema.safeParse(badVersion).success, false);
});

test("words ending before they start are rejected", () => {
  const t = valid();
  t.segments[0].words[1].end = t.segments[0].words[1].start - 0.2;
  assert.match(checkTranscript(t).join("\n"), /end .* is before start/);
});

test("out-of-order and overlapping words are rejected", () => {
  const order = valid();
  order.segments[1].words[1].start = 0.1;
  order.segments[1].words[1].end = 0.2;
  assert.match(checkTranscript(order).join("\n"), /must be in time order/);

  const overlap = valid();
  const [a, b] = overlap.segments[0].words;
  b.start = a.end - 0.15; // overlaps by 150ms (> 20ms tolerance)
  assert.match(
    checkTranscript(overlap).join("\n"),
    /overlaps the previous word/,
  );
});

test("small overlaps within tolerance are accepted", () => {
  const t = valid();
  const [a, b] = t.segments[0].words;
  b.start = a.end - 0.01;
  assert.deepEqual(checkTranscript(t), []);
});

test("words outside their segment or past the audio are rejected", () => {
  const outside = valid();
  outside.segments[0].end = 0.6;
  assert.match(checkTranscript(outside).join("\n"), /outside its segment/);

  const past = valid();
  past.duration = 1.0;
  assert.match(checkTranscript(past).join("\n"), /after the audio duration/);
});

test("parseTranscript lists every problem", () => {
  const t = valid();
  t.segments[0].words[0].end = 0;
  t.duration = 0.5;
  assert.throws(
    () => parseTranscript(t),
    (e) => e.message.split("\n").length > 2,
  );
});

test("flattenWords gives global indices and segment numbers", () => {
  const words = flattenWords(valid());
  assert.deepEqual(
    words.map((w) => [w.index, w.segment, w.word]),
    [
      [0, 0, "Hello"],
      [1, 0, "there."],
      [2, 1, "Second"],
      [3, 1, "line,"],
      [4, 1, "here."],
    ],
  );
});

test("secondsToFrame rounds to the nearest frame", () => {
  assert.equal(secondsToFrame(0, 30), 0);
  assert.equal(secondsToFrame(1.5, 30), 45);
  assert.equal(secondsToFrame(1.51, 30), 45);
  assert.equal(secondsToFrame(1.52, 30), 46);
  assert.equal(secondsToFrame(2, 25), 50);
});

test("transcriptToCaptions follows Remotion's leading-space convention", () => {
  const caps = transcriptToCaptions(valid());
  assert.equal(caps[0].text, "Hello");
  assert.equal(caps[1].text, " there.");
  assert.equal(caps[0].startMs, 500);
  assert.equal(caps[0].endMs, 800);
  assert.equal(caps.length, 5);
});

test("transcriptToCaptions applies the voice-over offset", () => {
  const caps = transcriptToCaptions(valid(), 2);
  assert.equal(caps[0].startMs, 2500);
});

test("findPhrase ignores case and punctuation and respects the cursor", () => {
  const words = [
    { word: "The" },
    { word: "end." },
    { word: "The" },
    { word: "END!" },
  ];
  assert.deepEqual(findPhrase(words, "the end"), [0, 1]);
  assert.deepEqual(findPhrase(words, "The, end", 1), [2, 3]);
  assert.equal(findPhrase(words, "missing words"), null);
  assert.equal(findPhrase(words, "  "), null);
});
