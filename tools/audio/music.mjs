#!/usr/bin/env node
/**
 * Generate a licence-clean background music bed (3gp's own synthesiser).
 *
 *   npm run music -- generate <project> [--mood calm|bright] [--seed 1]
 *       → public/projects/<n>/music.generated.wav, as long as the video
 *   npm run music -- generate out.wav --seconds 40 [--mood bright]
 *   npm run music -- moods
 *
 * Deterministic: same mood + seed + length → identical file, so the .wav is
 * not committed; re-run this command to recreate it.
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  checkProject,
  findProject,
  parseArgs,
  publicPath,
} from "../lib.mjs";
import { MOODS, barSeconds, synthesize, toWav } from "./synth.ts";

const { flags, positional } = parseArgs(process.argv.slice(2));
const fail = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};
const [cmd, target] = positional;

if (cmd === "moods") {
  for (const [name, m] of Object.entries(MOODS)) {
    console.log(
      `${name.padEnd(8)} ${m.bpm} bpm, bar ${barSeconds(name).toFixed(2)}s`,
    );
  }
  process.exit(0);
}
if (cmd !== "generate" || !target) {
  fail(
    "Usage: npm run music -- generate <project | out.wav> [--mood calm|bright] [--seconds N] [--seed N]",
  );
}

const mood = flags.mood ?? "calm";
if (!MOODS[mood])
  fail(`unknown mood "${mood}" (${Object.keys(MOODS).join(", ")})`);
const seed = Number(flags.seed ?? 1);

let seconds = flags.seconds ? Number(flags.seconds) : null;
let out;
let rel = null;
const project = findProject(target);
if (project) {
  const check = await checkProject(project.file);
  const tl = check.compositions[0]?.timeline;
  if (!seconds) {
    if (!tl)
      fail(
        `can't work out ${project.folder}'s length (${[...check.errors, ...check.pending].join("; ")}) — pass --seconds`,
      );
    seconds = tl.durationInFrames / tl.fps;
  }
  rel = `projects/${project.folder}/music.generated.wav`;
  out = publicPath(rel);
} else {
  if (!seconds) fail("--seconds is required when writing to a file");
  out = path.resolve(target);
}
if (!(seconds > 0)) fail("--seconds must be positive");

const {
  left,
  right,
  sampleRate,
  seconds: total,
} = synthesize({ seconds, mood, seed });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, toWav(left, right, sampleRate));
console.log(
  `✓ ${path.relative(ROOT, out)} — ${mood}, seed ${seed}, ${total.toFixed(2)}s (${MOODS[mood].bpm} bpm, whole bars)`,
);
if (rel) {
  console.log(
    `\nUse it in video.json:\n  "audio": { "src": "${rel}", "volume": 0.35 }`,
  );
}
