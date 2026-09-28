#!/usr/bin/env node
/**
 * Render a project (or any composition) to its exports folder.
 *
 *   npm run render -- 001                 # every composition of project 001
 *   npm run render -- 001 --only <id>     # one composition of the project
 *   npm run stills -- 001                 # one PNG per scene → projects/<project>/review/
 *   npm run render -- tpl-TitleCard       # any composition id → out/
 *   npm run render -- 001 -- --crf=18     # pass extra flags to `remotion render`
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  findProject,
  parseArgs,
  remotion,
  validateProject,
} from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const target = positional[0];
const extra = flags._passthrough ?? [];
if (!target) {
  console.error(
    "Usage: npm run render -- <project|compositionId> [--stills] [--only id]",
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
    remotion(["render", target, path.join(out, `${target}.mp4`), ...extra]);
  }
  process.exit(0);
}

const v = await validateProject(project.file);
if (!v.ok) {
  console.error(`✗ ${project.folder}/video.json is invalid:`);
  for (const e of v.errors) console.error(`    ${e}`);
  process.exit(1);
}
const { expandProject, sceneFrames } = await import(
  path.join(ROOT, "src/video/schema.ts")
);
let videos = expandProject(v.data);
if (flags.only) videos = videos.filter((x) => x.id === flags.only);
if (videos.length === 0) {
  console.error(`No composition "${flags.only}" in ${project.folder}`);
  process.exit(1);
}

for (const video of videos) {
  if (flags.stills) {
    // One review frame per scene, ~70% through (after entrances settle).
    let start = 0;
    const frames = video.scenes.map((s) => {
      const len = sceneFrames(s.seconds, video.fps);
      const f = start + Math.floor(len * 0.7);
      start += len;
      return f;
    });
    const dir = path.join(project.dir, "review", video.id);
    fs.rmSync(dir, { recursive: true, force: true });
    remotion([
      "render",
      video.id,
      dir,
      `--frames=${frames.join(",")}`,
      "--image-format=png",
      ...extra,
    ]);
    // Rename element-<frame>.png → scene-01-<Template>.png so reviews map to the storyboard.
    // (Remotion zero-pads the frame number, so match numerically.)
    for (const file of fs.readdirSync(dir)) {
      const m = file.match(/^element-(\d+)\.png$/);
      const i = m ? frames.indexOf(Number(m[1])) : -1;
      if (i === -1) continue;
      const name = `scene-${String(i + 1).padStart(2, "0")}-${video.scenes[i].template}.png`;
      fs.renameSync(path.join(dir, file), path.join(dir, name));
    }
    console.log(`\n✓ review stills → ${path.relative(ROOT, dir)}/`);
  } else {
    const out = path.join(project.dir, "exports", `${video.id}.mp4`);
    remotion(["render", video.id, out, ...extra]);
    console.log(`\n✓ ${path.relative(ROOT, out)}`);
  }
}
