import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { checkMediaPath, collectMediaRefs } from "../src/video/media.ts";
import { findWordFrames, sceneWords } from "../src/video/narration.ts";
import { projectFileSchema, sceneKind } from "../src/video/schema.ts";
import { resolveTimeline } from "../src/video/timeline.ts";
import { ROOT, checkProject } from "../tools/lib.mjs";
import { makeTranscript } from "./helpers.mjs";

// Word starts (s): 0.5 0.9 1.3 | 2.2 2.6 3.0 ; each word lasts 0.3s.
const T = makeTranscript([
  ["One", "two", "three."],
  ["Four", "five", "six."],
]);
const VO = {
  src: "projects/test/voiceover.wav",
  transcript: "projects/test/transcript.json",
};
const video = (scenes, extra = {}) => ({
  id: "test",
  title: "Test",
  fps: 30,
  scenes,
  ...extra,
});

test("schema: custom scenes sit next to template scenes", () => {
  const r = projectFileSchema.safeParse(
    video([
      { template: "TitleCard", seconds: 2, props: { title: "x" } },
      { custom: "Chokepoint", seconds: 3, transition: "none", props: { a: 1 } },
      { custom: "NoProps", seconds: 1 },
    ]),
  );
  assert.ok(r.success, JSON.stringify(r.error?.issues));
  assert.deepEqual(r.data.scenes.map(sceneKind), [
    "TitleCard",
    "Chokepoint",
    "NoProps",
  ]);
  assert.deepEqual(r.data.scenes[2].props, {});
});

test("schema: a scene is a template OR custom, with a PascalCase name", () => {
  const bad = [
    { custom: "Chokepoint", template: "TitleCard", seconds: 1 },
    { custom: "chokepoint", seconds: 1 },
    { custom: "Chokepoint", seconds: 1, transition: "dissolve" },
  ];
  for (const s of bad)
    assert.equal(projectFileSchema.safeParse(video([s])).success, false);
});

test("timeline: custom scenes are timed like any scene (seconds, phrase)", () => {
  const t = resolveTimeline(
    video(
      [
        { custom: "Intro", timing: { phrase: "One" } },
        { template: "TitleCard", timing: { phrase: "Four" }, props: { title: "x" } },
      ],
      { voiceover: VO },
    ),
    T,
  );
  assert.deepEqual(t.errors, []);
  assert.deepEqual(
    t.scenes.map((s) => [s.startFrame, s.words]),
    [
      [0, [0, 2]],
      [66, [3, 5]],
    ],
  );
});

test("narration: scene words have frames relative to the scene start", () => {
  const v = video(
    [
      { custom: "A", timing: { phrase: "One" } },
      { custom: "B", timing: { phrase: "Four" } },
    ],
    { voiceover: { ...VO, offset: 1 } },
  );
  const t = resolveTimeline(v, T);
  // Scene B starts on "Four": 2.2s + 1s offset → f96.
  assert.equal(t.scenes[1].startFrame, 96);
  const words = sceneWords(t, 1, T, 1);
  assert.deepEqual(
    words.map((w) => [w.index, w.text, w.startFrame, w.endFrame]),
    [
      [3, "Four", 0, 9],
      [4, "five", 12, 21],
      [5, "six.", 24, 33],
    ],
  );
  assert.deepEqual(findWordFrames(words, "five SIX"), { start: 12, end: 33 });
  assert.equal(findWordFrames(words, "One"), null, "only this scene's words");
  assert.deepEqual(sceneWords(t, 1, null), [], "no transcript → no words");
});

test("media: string props of custom scenes are checked as media", () => {
  const refs = collectMediaRefs(
    video([
      {
        custom: "Hybrid",
        seconds: 2,
        props: {
          title: "Ends with a full stop.",
          clip: "projects/001-x/clip.mp4",
          layers: [{ image: "public/projects/001-x/a.png" }],
          music: "projects/001-x/sting.mp3",
          label: "file.png is mentioned in prose",
        },
      },
    ]),
  );
  assert.deepEqual(
    refs.map((r) => [r.where, r.kind]),
    [
      ["scenes.0.props.clip", "visual"],
      ["scenes.0.props.layers.0.image", "visual"],
      ["scenes.0.props.music", "audio"],
    ],
  );
  assert.match(checkMediaPath(refs[1]), /drop the "public\/" prefix/);
});

// A throwaway project inside the repo (so its schemas.ts resolves zod).
const withProject = async (videoJson, schemasTs, fn) => {
  const dir = fs.mkdtempSync(path.join(ROOT, ".cache", "test-project-"));
  try {
    fs.writeFileSync(path.join(dir, "video.json"), JSON.stringify(videoJson));
    if (schemasTs) {
      fs.mkdirSync(path.join(dir, "scenes"));
      fs.writeFileSync(path.join(dir, "scenes", "schemas.ts"), schemasTs);
    }
    await fn(await checkProject(path.join(dir, "video.json")));
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
};
fs.mkdirSync(path.join(ROOT, ".cache"), { recursive: true });

const SCHEMAS = `import { z } from "zod";
export const SCENE_SCHEMAS = {
  Chokepoint: z.object({ title: z.string(), width: z.number().default(3) }),
};
`;

test("validate: declared custom scene with valid props passes", async () => {
  await withProject(
    video([{ custom: "Chokepoint", seconds: 2, props: { title: "x" } }]),
    SCHEMAS,
    (check) => {
      assert.deepEqual(check.errors, []);
      assert.equal(check.ok, true);
      assert.equal(check.compositions[0].timeline.durationInFrames, 60);
    },
  );
});

test("validate: undeclared scene, bad props, missing schemas file", async () => {
  await withProject(
    video([
      { custom: "Chokepoint", seconds: 2, props: { width: "wide" } },
      { custom: "Missing", seconds: 2 },
    ]),
    SCHEMAS,
    (check) => {
      const e = check.errors.join("\n");
      assert.match(e, /scenes\.0\.props\.title \(Chokepoint\)/);
      assert.match(e, /scenes\.0\.props\.width \(Chokepoint\)/);
      assert.match(e, /"Missing" is not declared .*declared: Chokepoint/);
    },
  );
  await withProject(
    video([{ custom: "Chokepoint", seconds: 2 }]),
    null,
    (check) => assert.match(check.errors.join("\n"), /custom scenes need/),
  );
});

test("validate: schema errors name the kind of scene that was meant", async () => {
  await withProject(
    video([
      { template: "TitleCard", seconds: 2, props: {} },
      { custom: "chokepoint", seconds: 2 },
    ]),
    null,
    (check) => {
      assert.deepEqual(check.errors, [
        "scenes.0.props.title: Invalid input: expected string, received undefined",
        "scenes.1.custom: PascalCase component name, e.g. StraitChokepoint",
      ]);
    },
  );
});
