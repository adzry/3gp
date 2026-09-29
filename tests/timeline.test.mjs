import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveTimeline,
  resolveTimelineOrThrow,
} from "../src/video/timeline.ts";
import { makeTranscript, makeVideo } from "./helpers.mjs";

// Word starts (s): 0.5 0.9 1.3 | 2.2 2.6 3.0 | 3.9 4.3 ; each word lasts 0.3s.
// At 30fps: word 0 → f15, word 3 → f66, word 6 → f117, last word ends 4.6s → f138.
const T = makeTranscript([
  ["One", "two", "three."],
  ["Four", "five", "six."],
  ["Seven", "eight."],
]);
const VO = {
  src: "projects/test/voiceover.wav",
  transcript: "projects/test/transcript.json",
  tail: 1,
  offset: 0,
};
const summary = (t) => t.scenes.map((s) => [s.startFrame, s.durationInFrames]);

test("seconds-only videos keep their exact frame lengths", () => {
  const t = resolveTimeline(makeVideo([{ seconds: 4.5 }, { seconds: 5 }]));
  assert.deepEqual(summary(t), [
    [0, 135],
    [135, 150],
  ]);
  assert.equal(t.durationInFrames, 285);
  assert.deepEqual(t.errors, []);
});

test("word ranges resolve to frames; first scene starts at 0, last holds the tail", () => {
  const v = makeVideo(
    [
      { timing: { words: [0, 2] } },
      { timing: { words: [3, 5] } },
      { timing: { words: [6, 7] } },
    ],
    { voiceover: VO },
  );
  const t = resolveTimelineOrThrow(v, T);
  assert.deepEqual(summary(t), [
    [0, 66],
    [66, 51],
    [117, 51],
  ]);
  assert.equal(t.durationInFrames, 138 + 30);
  assert.deepEqual(
    t.scenes.map((s) => s.words),
    [
      [0, 2],
      [3, 5],
      [6, 7],
    ],
  );
});

test("phrases, segments and word ranges agree", () => {
  const byPhrase = makeVideo(
    [
      { timing: { phrase: "one two" } },
      { timing: { phrase: "FOUR" } },
      { timing: { phrase: "seven", through: "eight" } },
    ],
    { voiceover: VO },
  );
  const bySegment = makeVideo(
    [
      { timing: { segments: [0, 0] } },
      { timing: { segments: [1, 1] } },
      { timing: { segments: [2, 2] } },
    ],
    { voiceover: VO },
  );
  const expected = [
    [0, 66],
    [66, 51],
    [117, 51],
  ];
  assert.deepEqual(summary(resolveTimelineOrThrow(byPhrase, T)), expected);
  assert.deepEqual(summary(resolveTimelineOrThrow(bySegment, T)), expected);
});

test("a final phrase without `through` runs to the last word + tail", () => {
  const v = makeVideo(
    [{ timing: { phrase: "one" } }, { timing: { phrase: "four" } }],
    { voiceover: VO },
  );
  const t = resolveTimelineOrThrow(v, T);
  assert.deepEqual(summary(t), [
    [0, 66],
    [66, 138 + 30 - 66],
  ]);
});

test("phrase search continues after the previous scene", () => {
  const tr = makeTranscript([
    ["go", "now"],
    ["go", "later"],
  ]);
  const v = makeVideo(
    [{ timing: { phrase: "go" } }, { timing: { phrase: "go" } }],
    { voiceover: VO },
  );
  const t = resolveTimelineOrThrow(v, tr);
  assert.equal(t.scenes[1].words[0], 2);
});

test("voiceover.offset shifts every anchor; an intro scene fills the gap", () => {
  const v = makeVideo([{ seconds: 3 }, { timing: { words: [0, 7] } }], {
    voiceover: { ...VO, offset: 3 },
  });
  const t = resolveTimelineOrThrow(v, T);
  assert.deepEqual(summary(t), [
    [0, 105],
    [105, 138 + 90 + 30 - 105],
  ]);
});

test("explicit from/to timing needs no transcript and holds seconds scenes", () => {
  const v = makeVideo([{ seconds: 2 }, { timing: { from: 3, to: 5 } }]);
  const t = resolveTimelineOrThrow(v, null);
  assert.deepEqual(summary(t), [
    [0, 90],
    [90, 60],
  ]);
});

test("error: a seconds scene that would run into the narration", () => {
  const v = makeVideo([{ seconds: 3 }, { timing: { words: [0, 7] } }], {
    voiceover: VO,
  });
  // word 0 is at 0.5s, but scene 0 lasts 3s
  const t = resolveTimeline(v, T);
  assert.match(
    t.errors.join("\n"),
    /runs to 3\.00s but scenes\.1's narration starts at 0\.50s/,
  );
});

test("error: word range outside the transcript", () => {
  const v = makeVideo([{ timing: { words: [0, 99] } }], { voiceover: VO });
  assert.match(
    resolveTimeline(v, T).errors.join("\n"),
    /outside the transcript \(words 0–7\)/,
  );
});

test("error: segment range outside the transcript / reversed range", () => {
  const v = makeVideo([{ timing: { segments: [0, 5] } }], { voiceover: VO });
  assert.match(resolveTimeline(v, T).errors.join("\n"), /segments 0–2/);
  const r = makeVideo([{ timing: { words: [3, 1] } }], { voiceover: VO });
  assert.match(
    resolveTimeline(r, T).errors.join("\n"),
    /start index is after end index/,
  );
});

test("error: out-of-range or reversed ranges never crash", () => {
  for (const timing of [
    { words: [5, 1] },
    { words: [99, 100] },
    { segments: [9, 1] },
    { segments: [7, 8] },
  ]) {
    const v = makeVideo([{ timing }], { voiceover: VO });
    const t = resolveTimeline(v, T);
    assert.ok(t.errors.length >= 1, JSON.stringify(timing));
  }
});

test("error: anchors out of spoken order give a scene no time", () => {
  const v = makeVideo(
    [
      { timing: { words: [0, 2] } },
      { timing: { words: [6, 7] } },
      { timing: { words: [3, 5] } },
    ],
    { voiceover: VO },
  );
  const t = resolveTimeline(v, T);
  assert.match(t.errors.join("\n"), /scenes\.1: has no time/);
  // Still returns a usable (≥1 frame) timeline for tooling.
  assert.ok(t.scenes.every((s) => s.durationInFrames >= 1));
});

test("error: voice timing without a transcript", () => {
  const v = makeVideo([{ timing: { words: [0, 1] } }], { voiceover: VO });
  assert.match(
    resolveTimeline(v, null).errors.join("\n"),
    /needs a transcript/,
  );
});

test("error: seconds and timing together, or neither", () => {
  const both = makeVideo([{ seconds: 2, timing: { words: [0, 1] } }], {
    voiceover: VO,
  });
  assert.match(
    resolveTimeline(both, T).errors.join("\n"),
    /both "seconds" and "timing"/,
  );
  const neither = makeVideo([{}]);
  assert.match(
    resolveTimeline(neither).errors.join("\n"),
    /needs "seconds" or "timing"/,
  );
});

test("error: phrase not found", () => {
  const v = makeVideo([{ timing: { phrase: "not in here" } }], {
    voiceover: VO,
  });
  assert.match(
    resolveTimeline(v, T).errors.join("\n"),
    /phrase "not in here" not found/,
  );
});

test("error: phrase without `through` followed by a seconds scene", () => {
  const v = makeVideo([{ timing: { phrase: "one" } }, { seconds: 1 }], {
    voiceover: VO,
  });
  assert.match(resolveTimeline(v, T).errors.join("\n"), /add "through"/);
});

test("error: video ends before the narration does", () => {
  const v = makeVideo([{ timing: { words: [0, 1] } }, { seconds: 1 }], {
    voiceover: VO,
  });
  const t = resolveTimeline(v, T);
  assert.match(t.errors.join("\n"), /narration continues to 4\.60s/);
});

test("negative / zero explicit durations are rejected", () => {
  const v = makeVideo([{ timing: { from: 2, to: 1 } }]);
  assert.match(
    resolveTimeline(v).errors.join("\n"),
    /must be after timing\.from/,
  );
});

test("a draft transcript is flagged", () => {
  const draft = { ...T, engine: { name: "draft" } };
  const v = makeVideo([{ timing: { words: [0, 7] } }], { voiceover: VO });
  assert.match(
    resolveTimeline(v, draft).warnings.join("\n"),
    /DRAFT transcript/,
  );
});

test("resolveTimelineOrThrow names the video and lists errors", () => {
  const v = makeVideo([{ timing: { words: [0, 99] } }], { voiceover: VO });
  assert.throws(() => resolveTimelineOrThrow(v, T), /Invalid timing in "test"/);
});
