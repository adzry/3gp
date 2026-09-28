# Captions

Target pipeline:

```
VOICE → TRANSCRIPT → WORD TIMESTAMPS → Caption[] JSON → <Captions> / CaptionedShort
```

3gp's caption format is Remotion's `Caption` type from `@remotion/captions`
(MIT): `{ text, startMs, endMs, timestampMs, confidence }`. Each `text` token
carries its own leading space (`" word"`), which is how word tokens are joined.

## What works today (tested)

| Step | Command |
|---|---|
| SRT → Caption JSON | `npm run captions:srt -- in.srt public/projects/<n>/captions.json` |
| Any audio/video → 16 kHz mono WAV (Whisper input) | `npm run media -- wav16k vo.mp3` |
| Find pauses in VO (for scene boundaries) | `npm run media -- silences vo.wav` |
| Display captions | `CaptionedShort` with `captionsFile: "projects/<n>/captions.json"` |

SRT gives **cue-level** timing: the highlight moves per cue, not per word.

## Word-level transcription (not yet integrated)

Not wired in because it needs a model download (hundreds of MB) and network
access this environment didn't have when 3gp was set up. Options, in order of
preference — all MIT-licensed:

1. **`@remotion/install-whisper-cpp`** — official Remotion route. Downloads and
   builds whisper.cpp + a model, `transcribe({ tokenLevelTimestamps: true })`,
   then `toCaptions()` returns `Caption[]` directly. See the official
   `/remotion-captions` skill (`transcribe-captions.md`) for the script.
   Needs a C/C++ toolchain.
2. **faster-whisper** (Python, CTranslate2) — `word_timestamps=True`; fastest
   on CPU. Convert segments' words to `Caption[]` (`startMs = start*1000`, …).
3. **openai-whisper** (Python) — reference implementation, slower.

When one of these is set up, add `tools/captions/transcribe.mjs` that writes
`public/projects/<n>/captions.json`, and update this file. Git-ignore model
files (`.cache/`, `whisper.cpp/` already are).

Always proof-read transcripts: names, numbers and jargon are where Whisper errs.
