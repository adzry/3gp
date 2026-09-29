#!/usr/bin/env node
/**
 * Render a project (or any composition) to its exports folder.
 *
 *   npm run render -- 001                 # every composition of project 001
 *   npm run render -- 001 --only <id>     # one composition of the project
 *   npm run stills -- 001                 # one PNG per scene → projects/<project>/review/
 *   npm run stills -- 001 --frames 0,45   # specific frames instead
 *   npm run render -- 002 --draft         # voice-first preview on the DRAFT transcript
 *                                         #   (muted if the voice-over isn't recorded yet)
 *   npm run render -- 002 --transcript <file.json>   # any transcript override
 *   npm run render -- tpl-TitleCard       # any composition id → out/ (or --out file)
 *   npm run render -- 001 -- --crf=18     # pass extra flags to `remotion render`
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  checkProject,
  draftPathFor,
  findProject,
  parseArgs,
  publicPath,
  remotion,
} from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const target = positional[0];
const extra = flags._passthrough ?? [];
if (!target) {
  console.error(
    "Usage: npm run render -- <project|compositionId> [--stills] [--only id] [--draft | --transcript file]",
  );
  process.exit(1);
}

const project = findProject(target);

if (!project) {
  // A plain composition id (e.g. template gallery).
  const out = path.join(ROOT, "out");
  if (flags.stills) {
    const frames = flags.frames ?? "0";
    remotion([
      "render",
      target,
      path.join(out, target),
      `--frames=${frames}`,
      "--image-format=png",
      ...extra,
    ]);
  } else {
    remotion([
      "render",
      target,
      flags.out
        ? path.resolve(ROOT, flags.out)
        : path.join(out, `${target}.mp4`),
      ...extra,
    ]);
  }
  process.exit(0);
}

// Which transcript? --transcript file > --draft > the project's own.
const raw = JSON.parse(fs.readFileSync(project.file, "utf8"));
let override;
if ((flags.transcript || flags.draft) && !raw.voiceover) {
  const flag = flags.transcript ? "--transcript" : "--draft";
  console.error(`${project.folder} has no voiceover — ${flag} doesn't apply`);
  process.exit(1);
}
if (flags.transcript) override = flags.transcript;
else if (flags.draft) override = draftPathFor(raw.voiceover.transcript);

const check = await checkProject(project.file, { transcript: override });
for (const w of check.warnings) console.log(`⚠ ${w}`);
if (!check.ok) {
  console.error(`✗ ${project.folder} can't be rendered:`);
  for (const e of check.errors) console.error(`    ${e}`);
  process.exit(1);
}
const vo = check.data.voiceover;
const audioExists = vo ? fs.existsSync(publicPath(vo.src)) : false;
if (vo && !override && !audioExists) {
  console.error(
    `✗ voice-over not recorded yet: public/${vo.src}\n  Record it and run \`npm run transcribe -- ${project.folder.slice(0, 3)}\`, or preview with --draft.`,
  );
  process.exit(1);
}

let compositions = check.compositions;
if (flags.only)
  compositions = compositions.filter((c) => c.video.id === flags.only);
if (compositions.length === 0) {
  console.error(`No composition "${flags.only}" in ${project.folder}`);
  process.exit(1);
}

// With an override, hand the transcript to Remotion directly as a prop.
let propsArgs = [];
let suffix = "";
if (override) {
  const propsFile = path.join(
    ROOT,
    ".cache",
    "3gp",
    `${check.data.id}.props.json`,
  );
  fs.mkdirSync(path.dirname(propsFile), { recursive: true });
  fs.writeFileSync(
    propsFile,
    JSON.stringify({
      transcriptData: check.transcript,
      voiceover: { ...vo, mute: vo?.mute || !audioExists },
    }),
  );
  propsArgs = [`--props=${propsFile}`];
  suffix = check.transcript?.engine.name === "draft" ? ".draft" : ".preview";
  console.log(
    `Using transcript ${path.relative(ROOT, check.transcriptPath)}${audioExists ? "" : " (voice-over muted: not recorded yet)"}`,
  );
}

for (const { video, timeline } of compositions) {
  if (flags.stills) {
    // One review frame per scene, ~70% through (after entrances settle) — or --frames.
    const frames = flags.frames
      ? String(flags.frames).split(",").map(Number)
      : timeline.scenes.map(
          (s) => s.startFrame + Math.floor(s.durationInFrames * 0.7),
        );
    const dir = path.join(
      project.dir,
      "review",
      video.id + suffix.replace(".", "-"),
    );
    fs.rmSync(dir, { recursive: true, force: true });
    remotion([
      "render",
      video.id,
      dir,
      `--frames=${frames.join(",")}`,
      "--image-format=png",
      ...propsArgs,
      ...extra,
    ]);
    // Rename element-<frame>.png → scene-01-<Template>.png so reviews map to the storyboard.
    // (Remotion zero-pads the frame number, so match numerically.)
    for (const file of fs.readdirSync(dir)) {
      const m = file.match(/^element-(\d+)\.png$/);
      if (!m) continue;
      const f = Number(m[1]);
      const scene =
        timeline.scenes.findLast((s) => s.startFrame <= f) ??
        timeline.scenes[0];
      const name = flags.frames
        ? `frame-${String(f).padStart(5, "0")}-scene-${String(scene.index + 1).padStart(2, "0")}.png`
        : `scene-${String(scene.index + 1).padStart(2, "0")}-${video.scenes[scene.index].template}.png`;
      fs.renameSync(path.join(dir, file), path.join(dir, name));
    }
    console.log(`\n✓ review stills → ${path.relative(ROOT, dir)}/`);
  } else {
    const out = path.join(project.dir, "exports", `${video.id}${suffix}.mp4`);
    remotion(["render", video.id, out, ...propsArgs, ...extra]);
    console.log(`\n✓ ${path.relative(ROOT, out)}`);
  }
}
