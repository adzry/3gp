import assert from "node:assert/strict";
import { test } from "node:test";
import {
  draftTranscript,
  extractVoLines,
} from "../tools/captions/draft-transcript.ts";
import { checkMediaPath, collectMediaRefs } from "../src/video/media.ts";
import { checkTranscript, flattenWords } from "../src/video/transcript.ts";

const script = `# Script
## 1. Hook
VO: This video was timed by my voice.

- VO: Second line, with a pause.
Not narration.
vo:   lowercase works too
`;

test("extractVoLines reads only VO lines", () => {
  assert.deepEqual(extractVoLines(script), [
    "This video was timed by my voice.",
    "Second line, with a pause.",
    "lowercase works too",
  ]);
});

test("draft transcripts are valid, deterministic and marked as drafts", () => {
  const lines = extractVoLines(script);
  const a = draftTranscript(lines, "projects/x/voiceover.wav");
  const b = draftTranscript(lines, "projects/x/voiceover.wav");
  assert.deepEqual(a, b);
  assert.equal(a.engine.name, "draft");
  assert.deepEqual(checkTranscript(a), []);
  assert.equal(a.segments.length, 3);
  assert.equal(flattenWords(a).length, 15); // 7 + 5 + 3
});

test("draft pacing is roughly conversational (1.8–3.2 words/s)", () => {
  const lines = [
    "The quick brown fox jumps over the lazy dog, and then it rests for a while.",
  ];
  const t = draftTranscript(lines, "x.wav");
  const words = flattenWords(t);
  const rate = words.length / (words.at(-1).end - words[0].start);
  assert.ok(rate > 1.8 && rate < 3.2, `rate ${rate}`);
});

test("collectMediaRefs finds every referenced file", () => {
  const refs = collectMediaRefs({
    id: "x",
    title: "x",
    audio: { src: "projects/x/music.mp3" },
    voiceover: {
      src: "projects/x/vo.wav",
      transcript: "projects/x/transcript.json",
    },
    scenes: [
      {
        template: "Footage",
        seconds: 2,
        props: { src: "projects/x/clip.mp4" },
      },
      {
        template: "LowerThird",
        seconds: 2,
        props: { name: "n", background: "projects/x/bg.jpg" },
      },
    ],
  });
  assert.deepEqual(
    refs.map((r) => r.where),
    [
      "audio.src",
      "voiceover.src",
      "voiceover.transcript",
      "scenes.0.props.src",
      "scenes.1.props.background",
    ],
  );
});

test("checkMediaPath rejects unsupported and unsafe paths", () => {
  const ok = (path, kind = "visual") =>
    checkMediaPath({ path, kind, where: "w" });
  assert.equal(ok("projects/x/clip.mp4"), null);
  assert.equal(ok("projects/x/still.webp"), null);
  assert.equal(ok("https://example.com/a.mp4"), null);
  assert.match(ok("/home/me/clip.mp4"), /absolute/);
  assert.match(ok("public/projects/x/clip.mp4"), /drop the "public\/" prefix/);
  assert.match(ok("projects/../secret.mp4"), /must not contain/);
  assert.match(ok("projects/x/clip.avi"), /not a supported visual format/);
  assert.match(
    ok("projects/x/voice.mp4", "audio"),
    /not a supported audio format/,
  );
  assert.match(ok("projects/x/t.txt", "json"), /not a supported json format/);
});
