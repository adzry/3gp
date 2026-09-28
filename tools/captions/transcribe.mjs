#!/usr/bin/env node
/**
 * Transcribe a voice-over locally with whisper.cpp → 3gp transcript JSON
 * (word-level timestamps). Local-first: no cloud service is used.
 *
 *   npm run transcribe -- <project>             # uses video.json → voiceover.src / .transcript
 *   npm run transcribe -- path/to/audio.wav     # writes path/to/audio.transcript.json
 *
 * Options:
 *   --model <name>       whisper model (default: base.en; e.g. small.en, medium.en, large-v3-turbo)
 *   --language <code>    e.g. en, de (default: auto; *.en models are English-only)
 *   --force              re-transcribe even if the transcript is up to date
 *   --from-json <file>   skip whisper: convert an existing whisper.cpp `-ojf` JSON output
 *
 * Environment (all optional):
 *   WHISPER_CPP_DIR      whisper.cpp checkout/build  (default .cache/whisper.cpp)
 *   WHISPER_CPP_VERSION  release to build            (default 1.5.5, as in Remotion's docs)
 *   WHISPER_MODELS_DIR   where ggml-<model>.bin lives (default .cache/whisper-models)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  PUBLIC_DIR,
  ROOT,
  findProject,
  parseArgs,
  publicPath,
  sha256File,
} from "../lib.mjs";
import { whisperCppToTranscript } from "./whisper-cpp-adapter.ts";
import { parseTranscript } from "../../src/video/transcript.ts";
import { MEDIA_EXTENSIONS } from "../../src/video/media.ts";

const { flags, positional } = parseArgs(process.argv.slice(2));
const target = positional[0];
const model = flags.model ?? "base.en";
const language = flags.language ?? null;
const WHISPER_DIR = path.resolve(
  ROOT,
  process.env.WHISPER_CPP_DIR ?? ".cache/whisper.cpp",
);
const WHISPER_VERSION = process.env.WHISPER_CPP_VERSION ?? "1.5.5";
const MODELS_DIR = path.resolve(
  ROOT,
  process.env.WHISPER_MODELS_DIR ?? ".cache/whisper-models",
);

/** Same rule as @remotion/install-whisper-cpp (not exported there): ≥1.7.4 builds build/bin/whisper-cli. */
const whisperExecutable = (dir, version) => {
  const [a, b, c] = version.split(".").map(Number);
  const modern = a > 1 || (a === 1 && (b > 7 || (b === 7 && c >= 4)));
  return modern
    ? path.join(dir, "build", "bin", "whisper-cli")
    : path.join(dir, "main");
};

/**
 * ggml models start with the magic "lmgg". Tiny files are whisper.cpp's
 * `for-tests-*` stubs (valid header, no real weights) — only accepted with
 * WHISPER_ALLOW_TEST_MODEL=1, for plumbing tests.
 */
const modelProblem = (file) => {
  const fd = fs.openSync(file, "r");
  const head = Buffer.alloc(4);
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  if (head.toString("latin1") !== "lmgg") {
    const preview = fs
      .readFileSync(file, "latin1")
      .slice(0, 120)
      .replace(/\s+/g, " ");
    return `is not a whisper model (bad header). Content starts: "${preview}"`;
  }
  if (
    fs.statSync(file).size < 10_000_000 &&
    process.env.WHISPER_ALLOW_TEST_MODEL !== "1"
  ) {
    return "is far too small to be a real model (a whisper.cpp test stub?)";
  }
  return null;
};

const fail = (msg, code = 1) => {
  console.error(`✗ ${msg}`);
  process.exit(code);
};

if (!target)
  fail(
    "Usage: npm run transcribe -- <project | audio-file> [--model base.en] [--language en] [--force]",
  );

// 1. Locate audio + output.
let audioFile;
let outFile;
let sourceRel;
const project = fs.existsSync(target) ? null : findProject(target);
if (project) {
  const video = JSON.parse(fs.readFileSync(project.file, "utf8"));
  if (!video.voiceover) {
    fail(
      `${project.folder}/video.json has no "voiceover" — add { "src": "projects/${project.folder}/voiceover.wav", "transcript": "projects/${project.folder}/transcript.json" }`,
    );
  }
  audioFile = publicPath(video.voiceover.src);
  outFile = publicPath(video.voiceover.transcript);
  sourceRel = video.voiceover.src;
} else if (fs.existsSync(target)) {
  audioFile = path.resolve(target);
  outFile = audioFile.replace(/\.[^.]+$/, "") + ".transcript.json";
  sourceRel = audioFile.startsWith(PUBLIC_DIR + path.sep)
    ? path.relative(PUBLIC_DIR, audioFile)
    : path.basename(audioFile);
} else {
  fail(`"${target}" is neither a project nor an existing file`);
}

// 2. Validate input.
if (!fs.existsSync(audioFile))
  fail(
    `voice-over not found: ${path.relative(ROOT, audioFile)} — record it and put it there`,
  );
const ext = audioFile.split(".").pop().toLowerCase();
const supported = [...MEDIA_EXTENSIONS.audio, ...MEDIA_EXTENSIONS.video];
if (!supported.includes(ext))
  fail(`.${ext} is not supported (use ${supported.join(", ")})`);

const probe = spawnSync(
  "npx",
  [
    "remotion",
    "ffprobe",
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    audioFile,
  ],
  { cwd: ROOT, encoding: "utf8" },
);
if (probe.status !== 0)
  fail(`can't read ${path.basename(audioFile)}: ${probe.stderr.trim()}`);
const info = JSON.parse(probe.stdout);
if (!info.streams.some((s) => s.codec_type === "audio"))
  fail(`${path.basename(audioFile)} has no audio stream`);
const duration = Math.round(Number(info.format.duration) * 1000) / 1000;
const sha = sha256File(audioFile);
console.log(
  `Audio: ${path.relative(ROOT, audioFile)} — ${duration.toFixed(2)}s, sha256 ${sha.slice(0, 12)}…`,
);

// 3. Cache: same audio + same model = same transcript.
if (!flags.force && !flags["from-json"] && fs.existsSync(outFile)) {
  try {
    const existing = JSON.parse(fs.readFileSync(outFile, "utf8"));
    if (existing.sourceSha256 === sha && existing.engine?.model === model) {
      console.log(
        `✓ up to date: ${path.relative(ROOT, outFile)} (use --force to redo)`,
      );
      process.exit(0);
    }
  } catch {
    // unreadable → re-transcribe
  }
}

// 4. Get whisper.cpp JSON (run it, or read a provided file).
let whisperJson;
let engine;
if (flags["from-json"]) {
  whisperJson = JSON.parse(fs.readFileSync(flags["from-json"], "utf8"));
  // "models/ggml-base.en.bin" → "base.en", so the cache check compares like with like.
  const fromParams =
    whisperJson.params?.model &&
    path.basename(whisperJson.params.model).replace(/^ggml-|\.bin$/g, "");
  engine = { name: "whisper.cpp", model: fromParams || model };
} else {
  const iwc = await import("@remotion/install-whisper-cpp");

  // 4a. 16 kHz mono WAV (whisper.cpp requirement), cached by content hash.
  const wav = path.join(ROOT, ".cache", "3gp", "audio", `${sha}.wav`);
  if (!fs.existsSync(wav)) {
    fs.mkdirSync(path.dirname(wav), { recursive: true });
    const conv = spawnSync(
      "npx",
      [
        "remotion",
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        audioFile,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        wav,
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    if (conv.status !== 0) fail(`audio conversion failed: ${conv.stderr}`);
  }

  // 4b. whisper.cpp binary (git clone + make, once).
  const exe = whisperExecutable(WHISPER_DIR, WHISPER_VERSION);
  if (!fs.existsSync(exe)) {
    console.log(
      `Building whisper.cpp ${WHISPER_VERSION} into ${path.relative(ROOT, WHISPER_DIR)} (one-time, needs git + make + a C++ compiler)…`,
    );
    try {
      await iwc.installWhisperCpp({
        version: WHISPER_VERSION,
        to: WHISPER_DIR,
        printOutput: false,
      });
    } catch (e) {
      fail(
        `whisper.cpp build failed: ${e.message}\n  See tools/captions/README.md → Troubleshooting.`,
        2,
      );
    }
  }

  // 4c. Model (downloaded once from Hugging Face by Remotion's helper).
  const modelFile = path.join(MODELS_DIR, `ggml-${model}.bin`);
  const manual =
    `  Download it manually and place it at:\n    ${path.relative(ROOT, modelFile)}\n` +
    `  from https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${model}.bin\n` +
    `  (or set WHISPER_MODELS_DIR to a folder that contains ggml-${model}.bin), then re-run.`;
  if (!fs.existsSync(modelFile)) {
    console.log(`Downloading whisper model "${model}"…`);
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    try {
      await iwc.downloadWhisperModel({
        model,
        folder: MODELS_DIR,
        printOutput: false,
      });
    } catch (e) {
      fs.rmSync(modelFile, { force: true });
      fail(
        `could not download the whisper model "${model}": ${e.message}\n${manual}`,
        2,
      );
    }
  }
  // A blocked download can leave an HTML/text error page saved as the model.
  const problem = modelProblem(modelFile);
  if (problem) {
    const size = fs.statSync(modelFile).size;
    if (size < 100_000) fs.rmSync(modelFile, { force: true }); // an error page, not a model
    fail(`${path.relative(ROOT, modelFile)} ${problem}\n${manual}`, 2);
  }

  // 4d. Transcribe with token-level timestamps.
  console.log(
    `Transcribing with whisper.cpp ${WHISPER_VERSION} / ${model}${language ? ` / ${language}` : ""}…`,
  );
  try {
    whisperJson = await iwc.transcribe({
      inputPath: wav,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      model,
      modelFolder: MODELS_DIR,
      tokenLevelTimestamps: true,
      language,
      printOutput: false,
    });
  } catch (e) {
    fail(`whisper.cpp failed: ${e.message}`, 2);
  }
  engine = { name: "whisper.cpp", version: WHISPER_VERSION, model };
}

// 5. Convert, validate, write.
const transcript = whisperCppToTranscript(whisperJson, {
  source: sourceRel,
  duration,
  sourceSha256: sha,
  engine,
  createdAt: new Date().toISOString(),
});
try {
  parseTranscript(transcript);
} catch (e) {
  fail(`whisper output didn't produce a valid transcript:\n${e.message}`);
}
const words = transcript.segments.reduce((n, s) => n + s.words.length, 0);
if (words === 0) fail("no speech found in the audio");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(transcript, null, 2) + "\n");
console.log(
  `✓ ${path.relative(ROOT, outFile)}\n  ${transcript.segments.length} segments, ${words} words, ${duration.toFixed(2)}s, language: ${transcript.language ?? "unknown"}\n` +
    `  Proof-read it (names, numbers), then: npm run transcript -- ${project ? project.folder.slice(0, 3) : path.relative(ROOT, outFile)}`,
);
