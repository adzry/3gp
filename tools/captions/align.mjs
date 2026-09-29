#!/usr/bin/env node
/**
 * Word timings for a voice-over whose words are KNOWN (the script's VO lines):
 * forced alignment with pocketsphinx → the 3gp transcript format. Use it when
 * the narrator read the script (scratch or recorded); use `npm run transcribe`
 * (Whisper) when the words themselves must be recognised.
 *
 *   npm run align -- <project>
 *
 * Needs python3 + `pip install pocketsphinx` (BSD; bundles its en-US model).
 * The audio decides every time; nothing is estimated. If the recording
 * doesn't say the script, alignment fails loudly instead of guessing.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, findProject, parseArgs, publicPath, sha256File } from "../lib.mjs";
import { extractVoLines } from "./draft-transcript.ts";
import { alignedToTranscript, spokenTokens } from "./align-adapter.ts";
import { checkTranscript, parseTranscript } from "../../src/video/transcript.ts";

const { positional } = parseArgs(process.argv.slice(2));
const project = positional[0] && findProject(positional[0]);
if (!project) {
  console.error("Usage: npm run align -- <project>");
  process.exit(1);
}
const video = JSON.parse(fs.readFileSync(project.file, "utf8"));
const vo = video.voiceover;
if (!vo) {
  console.error(`${project.folder}: no "voiceover" in video.json`);
  process.exit(1);
}
const audio = publicPath(vo.src);
if (!fs.existsSync(audio)) {
  console.error(`missing public/${vo.src} — record it (or \`npm run voice -- ${project.folder.slice(0, 3)}\` for a scratch voice)`);
  process.exit(1);
}
const lines = extractVoLines(
  fs.readFileSync(path.join(project.dir, "script.md"), "utf8"),
);
const tokens = lines.flatMap((l) => l.split(/\s+/).filter(Boolean).flatMap(spokenTokens));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "3gp-align-"));
const wav16 = path.join(tmp, "a.wav");
const ff = spawnSync(
  "npx",
  ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", audio, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav16],
  { cwd: ROOT, stdio: "inherit" },
);
if (ff.status !== 0) process.exit(ff.status ?? 1);
const probe = spawnSync(
  "npx",
  ["remotion", "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio],
  { cwd: ROOT, encoding: "utf8" },
);
const duration = Number(probe.stdout.trim());
fs.writeFileSync(path.join(tmp, "tokens.json"), JSON.stringify(tokens));

const py = spawnSync(
  "python3",
  [path.join(ROOT, "tools/captions/align.py"), wav16, path.join(tmp, "tokens.json")],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
fs.rmSync(tmp, { recursive: true });
if (py.status !== 0) {
  console.error(`✗ alignment failed: ${py.stderr.trim() || py.error?.message}`);
  if (/No module named/.test(py.stderr)) console.error("  → pip install pocketsphinx");
  process.exit(1);
}
const transcript = parseTranscript(
  alignedToTranscript(lines, JSON.parse(py.stdout), {
    source: vo.src,
    duration,
    sourceSha256: sha256File(audio),
  }),
);
const problems = checkTranscript(transcript);
if (problems.length) {
  console.error(`✗ aligned transcript failed checks:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
const dest = publicPath(vo.transcript);
fs.writeFileSync(dest, JSON.stringify(transcript, null, 2) + "\n");
const n = transcript.segments.reduce((s, g) => s + g.words.length, 0);
console.log(`✓ public/${vo.transcript} — ${n} words aligned (pocketsphinx), ${duration.toFixed(1)}s\n  Next: npm run transcript -- ${project.folder.slice(0, 3)}`);
