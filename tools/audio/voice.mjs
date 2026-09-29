#!/usr/bin/env node
/**
 * SCRATCH narration: synthesise the script's VO lines offline (RHVoice) into
 * public/projects/<n>/voiceover.wav, so a voice-first edit can be built and
 * timed against real audio before a human records it. Then run
 * `npm run align -- <n>` for word timings.
 *
 *   npm run voice -- <project> [--voice bdl] [--rate 100] [--gap 0.45] [--section-gap 1.1]
 *
 * Pacing: lines within a script section are `--gap` apart; a new `## ` section
 * starts after the longer `--section-gap` (a breath between ideas).
 *
 * Needs RHVoice (`apt install rhvoice rhvoice-english`). English voices
 * alan / bdl / clb / slt are LGPL-2.1+ (Debian rhvoice-english copyright).
 * It is a placeholder voice: say so when delivering, and replace it with a
 * recording for anything final.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, findProject, parseArgs, publicPath } from "../lib.mjs";
import { extractVoLines } from "../captions/draft-transcript.ts";

const { flags, positional } = parseArgs(process.argv.slice(2));
const project = positional[0] && findProject(positional[0]);
if (!project) {
  console.error("Usage: npm run voice -- <project> [--voice bdl] [--rate 100] [--gap 0.45] [--section-gap 1.1]");
  process.exit(1);
}
const video = JSON.parse(fs.readFileSync(project.file, "utf8"));
if (!video.voiceover?.src) {
  console.error(`${project.folder}: add "voiceover": { "src", "transcript" } to video.json first`);
  process.exit(1);
}
const script = fs.readFileSync(path.join(project.dir, "script.md"), "utf8");
const lines = extractVoLines(script);
// Which lines open a new "## " section (after the first line).
const opensSection = [];
let heading = false;
for (const l of script.split("\n")) {
  if (/^##\s/.test(l)) heading = true;
  else if (extractVoLines(l).length) {
    opensSection.push(heading);
    heading = false;
  }
}
if (!lines.length) {
  console.error(`${project.folder}/script.md has no "VO:" lines`);
  process.exit(1);
}
if (spawnSync("RHVoice-test", ["--version"]).error) {
  console.error("RHVoice not found — install it: apt install rhvoice rhvoice-english");
  process.exit(1);
}

const voice = flags.voice ?? "bdl";
const rate = String(flags.rate ?? 100);
const gap = Number(flags.gap ?? 0.45);
const sectionGap = Number(flags["section-gap"] ?? 1.1);
const RATE = 24000;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "3gp-voice-"));

/** PCM16 samples of a mono WAV (RHVoice output). */
const readPcm = (file) => {
  const b = fs.readFileSync(file);
  let o = 12;
  while (o < b.length - 8) {
    const id = b.toString("ascii", o, o + 4);
    const size = b.readUInt32LE(o + 4);
    if (id === "data") return b.subarray(o + 8, o + 8 + size);
    o += 8 + size + (size % 2);
  }
  throw new Error(`${file}: no data chunk`);
};

const silence = (s) => Buffer.alloc(Math.round(s * RATE) * 2);
const parts = [silence(0.4)];
lines.forEach((line, i) => {
  const out = path.join(tmp, `line-${i}.wav`);
  const r = spawnSync(
    "RHVoice-test",
    ["-p", voice, "-r", rate, "-R", String(RATE), "-o", out],
    { input: line },
  );
  if (r.status !== 0 || !fs.existsSync(out)) {
    console.error(`RHVoice failed on line ${i + 1}: ${r.stderr}`);
    process.exit(1);
  }
  const next = i + 1;
  parts.push(
    readPcm(out),
    silence(next === lines.length ? 1.0 : opensSection[next] ? sectionGap : gap),
  );
});

const pcm = Buffer.concat(parts);
const raw = path.join(tmp, "voice.wav");
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(raw, Buffer.concat([header, pcm]));

// 48 kHz, loudness-normalised for speech.
const dest = publicPath(video.voiceover.src);
fs.mkdirSync(path.dirname(dest), { recursive: true });
const ff = spawnSync(
  "npx",
  ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", dest],
  { cwd: ROOT, stdio: "inherit" },
);
if (ff.status !== 0) process.exit(ff.status ?? 1);
fs.rmSync(tmp, { recursive: true });
console.log(
  `✓ public/${video.voiceover.src} — SCRATCH narration (RHVoice "${voice}"), ${lines.length} lines, ${(pcm.length / 2 / RATE).toFixed(1)}s\n  Next: npm run align -- ${project.folder.slice(0, 3)}`,
);
