import assert from "node:assert/strict";
import { test } from "node:test";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { activeTokenIndex, pageWindows } from "../src/lib/caption-timing.ts";
import { transcriptToCaptions } from "../src/video/transcript.ts";
import { makeTranscript } from "./helpers.mjs";

const tokens = [
  { fromMs: 0, toMs: 300 },
  { fromMs: 400, toMs: 700 },
  { fromMs: 800, toMs: 1000 },
];

test("activeTokenIndex keeps the last started word lit through gaps", () => {
  assert.equal(activeTokenIndex(tokens, -10), -1);
  assert.equal(activeTokenIndex(tokens, 0), 0);
  assert.equal(activeTokenIndex(tokens, 350), 0); // gap after word 0
  assert.equal(activeTokenIndex(tokens, 400), 1);
  assert.equal(activeTokenIndex(tokens, 5000), 2);
});

test("pageWindows ends a page at the next page", () => {
  const pages = [
    { startMs: 0, durationMs: 1000, tokens },
    { startMs: 1200, durationMs: 500, tokens: [{ fromMs: 1200, toMs: 1700 }] },
  ];
  assert.deepEqual(pageWindows(pages, 30), [
    { from: 0, durationInFrames: 36 }, // until 1200ms (sooner than 1000+600)
    { from: 36, durationInFrames: 33 }, // last page: word end 1700 + 600 hold → 2300ms = f69
  ]);
});

test("pageWindows clears a page during long pauses", () => {
  const pages = [
    { startMs: 0, durationMs: 1000, tokens },
    { startMs: 5000, durationMs: 500, tokens: [{ fromMs: 5000, toMs: 5500 }] },
  ];
  // page 0 holds only 600ms after its last word (1000ms) → 1600ms = frame 48
  assert.equal(pageWindows(pages, 30)[0].durationInFrames, 48);
});

test("transcript → captions → TikTok pages keeps every word, in order", () => {
  const t = makeTranscript([
    ["one", "two", "three", "four"],
    ["five", "six"],
  ]);
  const { pages } = createTikTokStyleCaptions({
    captions: transcriptToCaptions(t),
    combineTokensWithinMilliseconds: 1000,
  });
  // Each page renders on its own, so createTikTokStyleCaptions trims the page's first token.
  const text = pages
    .map((p) =>
      p.tokens
        .map((k) => k.text)
        .join("")
        .trim(),
    )
    .join(" ");
  assert.equal(text, "one two three four five six");
  assert.ok(pages.length >= 2);
  const windows = pageWindows(pages, 30);
  for (let i = 1; i < windows.length; i++) {
    assert.ok(
      windows[i].from >= windows[i - 1].from + windows[i - 1].durationInFrames,
      "pages never overlap",
    );
  }
});

test("caption pages break at sentence ends and segment ends", () => {
  const t = makeTranscript([
    ["It", "was", "timed.", "By", "voice"],
    ["Next", "line"],
  ]);
  const caps = transcriptToCaptions(t);
  assert.deepEqual(
    caps.map((c) => Boolean(c.pageBreakAfter)),
    [false, false, true, false, true, false, true],
  );
  const { pages } = createTikTokStyleCaptions({
    captions: caps,
    combineTokensWithinMilliseconds: 5000,
  });
  // A long combine window would merge everything; the breaks keep sentences apart.
  assert.deepEqual(
    pages.map((p) =>
      p.tokens
        .map((k) => k.text)
        .join("")
        .trim(),
    ),
    ["It was timed.", "By voice", "Next line"],
  );
});
