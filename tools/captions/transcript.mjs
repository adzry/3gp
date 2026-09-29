#!/usr/bin/env node
/**
 * Inspect or draft transcripts.
 *
 *   npm run transcript -- <project>            # words with indices + times, and
 *                                              #   which words each scene covers
 *   npm run transcript -- <project> --draft    # same, using the draft transcript
 *   npm run transcript -- <file.json>          # list any transcript file
 *   npm run transcript -- draft <project>      # write transcript.draft.json from
 *                                              #   the "VO:" lines in script.md
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
} from "../lib.mjs";
import { draftTranscript, extractVoLines } from "./draft-transcript.ts";
import { sceneKind } from "../../src/video/schema.ts";
import { flattenWords, parseTranscript } from "../../src/video/transcript.ts";

const { flags, positional } = parseArgs(process.argv.slice(2));
const fail = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};
const fmt = (s) => s.toFixed(2).padStart(6);

if (positional[0] === "draft") {
  const project = findProject(positional[1] ?? "");
  if (!project) fail("Usage: npm run transcript -- draft <project>");
  const video = JSON.parse(fs.readFileSync(project.file, "utf8"));
  if (!video.voiceover) fail(`${project.folder}/video.json has no "voiceover"`);
  const script = path.join(project.dir, "script.md");
  const lines = fs.existsSync(script)
    ? extractVoLines(fs.readFileSync(script, "utf8"))
    : [];
  if (!lines.length)
    fail(`no "VO: …" lines found in ${path.relative(ROOT, script)}`);
  const draft = draftTranscript(lines, video.voiceover.src);
  parseTranscript(draft);
  const out = publicPath(draftPathFor(video.voiceover.transcript));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(draft, null, 2) + "\n");
  const n = draft.segments.reduce((a, s) => a + s.words.length, 0);
  console.log(
    `✓ ${path.relative(ROOT, out)} — DRAFT timing from script: ${lines.length} lines, ${n} words, ~${draft.duration.toFixed(1)}s`,
  );
  process.exit(0);
}

const target = positional[0];
if (!target)
  fail("Usage: npm run transcript -- <project | transcript.json> [--draft]");

let transcript;
let check = null;
const project = fs.existsSync(target) ? null : findProject(target);
if (project) {
  const video = JSON.parse(fs.readFileSync(project.file, "utf8"));
  if (!video.voiceover) fail(`${project.folder}/video.json has no "voiceover"`);
  const override = flags.draft
    ? draftPathFor(video.voiceover.transcript)
    : undefined;
  check = await checkProject(project.file, { transcript: override });
  if (!check.transcript)
    fail(
      `no transcript available for ${project.folder}:\n  ${[...check.errors, ...check.pending].join("\n  ")}`,
    );
  transcript = check.transcript;
} else {
  if (!fs.existsSync(target)) fail(`not a project or file: ${target}`);
  transcript = parseTranscript(JSON.parse(fs.readFileSync(target, "utf8")));
}

const words = flattenWords(transcript);
console.log(
  `${transcript.engine.name === "draft" ? "DRAFT " : ""}transcript — ${transcript.duration}s, ${transcript.segments.length} segments, ${words.length} words, engine ${transcript.engine.name}${transcript.engine.model ? " / " + transcript.engine.model : ""}\n`,
);
transcript.segments.forEach((seg, si) => {
  console.log(
    `segment ${si}  [${seg.start.toFixed(2)}–${seg.end.toFixed(2)}s]`,
  );
  console.log(
    "  " +
      words
        .filter((w) => w.segment === si)
        .map((w) => `${w.index}:${w.word}@${w.start.toFixed(2)}`)
        .join("  "),
  );
});

if (check) {
  for (const { video, timeline } of check.compositions.slice(0, 1)) {
    console.log(
      `\nScenes of ${video.id} (${(timeline.durationInFrames / timeline.fps).toFixed(2)}s):`,
    );
    timeline.scenes.forEach((s) => {
      const sc = video.scenes[s.index];
      const text = s.words
        ? words
            .slice(s.words[0], s.words[1] + 1)
            .map((w) => w.word)
            .join(" ")
        : "—";
      console.log(
        `  ${String(s.index + 1).padStart(2)}. ${fmt(s.startFrame / timeline.fps)}s +${(s.durationInFrames / timeline.fps).toFixed(2)}s  ${sceneKind(sc).padEnd(14)} words ${s.words ? s.words.join("–") : "—"}  “${text.length > 70 ? text.slice(0, 67) + "…" : text}”`,
      );
    });
  }
  for (const e of check.errors) console.log(`✗ ${e}`);
  for (const w of check.warnings) console.log(`⚠ ${w}`);
}
