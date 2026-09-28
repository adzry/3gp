#!/usr/bin/env node
/**
 * Everyday media operations using the FFmpeg that ships with Remotion
 * (`npx remotion ffmpeg`), so no system FFmpeg is required.
 *
 *   npm run media -- probe  <in>                 # duration, streams (JSON)
 *   npm run media -- web    <in> [out.mp4]       # H.264 + AAC, faststart, CRF 20
 *   npm run media -- gif    <in> [out.gif] [--width 720] [--fps 15]
 *   npm run media -- loudnorm <in> [out]         # EBU R128 to -14 LUFS (streaming)
 *   npm run media -- wav16k <in> [out.wav]       # mono 16 kHz WAV for Whisper
 *   npm run media -- silences <in>               # list silent gaps (for VO timing)
 *
 * The bundled build is minimal (no drawtext/overlay/tile). For those, install
 * a full FFmpeg and run it directly.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { ROOT, parseArgs } from "../lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [cmd, input, maybeOut] = positional;

const run = (tool, args, capture = false) => {
  const r = spawnSync("npx", ["remotion", tool, "-hide_banner", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (r.status !== 0) {
    if (capture) process.stderr.write(r.stderr);
    process.exit(r.status ?? 1);
  }
  return r;
};
const out = (ext) => maybeOut ?? input.replace(/\.[^.]+$/, "") + ext;

if (!cmd || !input) {
  console.error(
    "Usage: npm run media -- <probe|web|gif|loudnorm|wav16k|silences> <input> [output]",
  );
  process.exit(1);
}

switch (cmd) {
  case "probe": {
    const r = run(
      "ffprobe",
      [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        input,
      ],
      true,
    );
    const j = JSON.parse(r.stdout);
    console.log(
      JSON.stringify(
        {
          file: path.basename(input),
          duration: Number(j.format.duration),
          size: Number(j.format.size),
          streams: j.streams.map((s) => ({
            type: s.codec_type,
            codec: s.codec_name,
            width: s.width,
            height: s.height,
            fps: s.avg_frame_rate,
            sampleRate: s.sample_rate,
            channels: s.channels,
          })),
        },
        null,
        2,
      ),
    );
    break;
  }
  case "web":
    run("ffmpeg", [
      "-y",
      "-i",
      input,
      "-c:v",
      "libx264",
      "-crf",
      "20",
      "-preset",
      "slow",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      out("-web.mp4"),
    ]);
    break;
  case "gif": {
    const width = flags.width ?? 720;
    const fps = flags.fps ?? 15;
    // The bundled build has no `fps` filter, so the frame rate is set with -r.
    const vf = `scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse`;
    run("ffmpeg", [
      "-y",
      "-i",
      input,
      "-vf",
      vf,
      "-r",
      String(fps),
      out(".gif"),
    ]);
    break;
  }
  case "loudnorm":
    run("ffmpeg", [
      "-y",
      "-i",
      input,
      "-af",
      "loudnorm=I=-14:TP=-1.5:LRA=11",
      "-c:v",
      "copy",
      out(`-norm${path.extname(input)}`),
    ]);
    break;
  case "wav16k":
    run("ffmpeg", [
      "-y",
      "-i",
      input,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "pcm_s16le",
      out("-16k.wav"),
    ]);
    break;
  case "silences": {
    const r = spawnSync(
      "npx",
      [
        "remotion",
        "ffmpeg",
        "-hide_banner",
        "-i",
        input,
        "-af",
        "silencedetect=noise=-35dB:d=0.35",
        "-f",
        "null",
        "-",
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    const lines = (r.stderr ?? "")
      .split("\n")
      .filter((l) => l.includes("silence_"));
    console.log(
      lines.map((l) => l.replace(/^\[.*?\]\s*/, "")).join("\n") ||
        "No silences found.",
    );
    break;
  }
  default:
    console.error(`Unknown command "${cmd}"`);
    process.exit(1);
}
