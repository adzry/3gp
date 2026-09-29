# Voice-over → transcript → captions & timing

```
voiceover.wav ──npm run transcribe──▶ transcript.json ──▶ scene timing (video.json "timing")
                  (whisper.cpp, local)       │           └▶ word-by-word captions ("captions")
                                             └──npm run transcript──▶ word/scene listing
```

Everything runs **locally**: whisper.cpp built from source, a model file on
disk, no cloud service.

## Commands

| Command | What it does |
|---|---|
| `npm run transcribe -- <project>` | Transcribe `voiceover.src` → `voiceover.transcript` (both in `public/`) |
| `npm run transcribe -- path/to/file.wav` | Transcribe any file → `path/to/file.transcript.json` |
| `  --model small.en` | Model (default `base.en`) — see below |
| `  --language de` | Force a language (default: auto; `*.en` models are English-only) |
| `  --force` | Re-transcribe even if up to date |
| `  --from-json whisper.json` | Convert an existing whisper.cpp `-ojf` output instead of running whisper |
| `npm run transcript -- <project>` | List words with indices/times + which words each scene covers |
| `npm run transcript -- draft <project>` | Write `transcript.draft.json` from the `VO:` lines of `script.md` (estimated timing) |
| `npm run media -- wav16k file` / `silences file` | Inspect/convert audio by hand |
| `npm run captions:srt -- in.srt out.json` | SRT → caption JSON (cue-level timing, for `CaptionedShort`) |

The transcript is **cached**: re-running `transcribe` on the same audio with
the same model is a no-op. It records the audio's SHA-256; `npm run validate`
flags a transcript as **stale** if the recording changes.

## Setup (one-time)

Requirements: Node ≥ 22.18, `git`, `make`, a C/C++ compiler (Xcode CLT on
macOS; `build-essential` on Debian/Ubuntu). ~150 MB–1.6 GB disk for a model.

1. **whisper.cpp** — built automatically on first `npm run transcribe`
   (`git clone` + `make` into `.cache/whisper.cpp`, via Remotion's official
   `@remotion/install-whisper-cpp`). Version 1.5.5 by default (the version
   Remotion's docs use); override with `WHISPER_CPP_VERSION`.
2. **Model** — downloaded automatically from Hugging Face into
   `.cache/whisper-models/ggml-<model>.bin`. If that host is blocked
   (corporate proxy, sandbox), download it yourself:
   `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin`
   and put it at `.cache/whisper-models/ggml-base.en.bin`, or point
   `WHISPER_MODELS_DIR` at a folder containing it. The tool verifies the file
   header, so an error page saved as a "model" is caught.

| Model | Size | Speed (CPU) | Use |
|---|---|---|---|
| `tiny.en` | 75 MB | fastest | quick drafts |
| `base.en` (default) | 142 MB | fast | clean studio VO |
| `small.en` | 466 MB | medium | noisy audio, accents |
| `medium.en` | 1.5 GB | slow | best English accuracy |
| `large-v3-turbo` | 1.6 GB | slow | multilingual |

GPU: whisper.cpp uses Metal on Apple Silicon automatically; CUDA needs a
custom build (outside 3gp's scope). CPU is fine for VO-length audio.

## Supported audio

wav, mp3, m4a, aac, ogg, flac — or the audio track of mp4/webm/mov/mkv/m4v.
It's converted to 16 kHz mono WAV (cached in `.cache/3gp/audio/`) before
whisper runs; the original is what plays in the video.

## Transcript format

`src/video/transcript.ts` (zod) — JSON Schema: `schemas/transcript.schema.json`.

```json
{
  "version": 1,
  "source": "projects/002-voice-first-demo/voiceover.wav",
  "sourceSha256": "…",
  "duration": 48.21,
  "language": "en",
  "engine": { "name": "whisper.cpp", "version": "1.5.5", "model": "base.en" },
  "segments": [
    { "start": 0.31, "end": 2.9, "text": "This video wasn't timed by hand.",
      "speaker": "optional, for future diarisation",
      "words": [ { "word": "This", "start": 0.31, "end": 0.52, "confidence": 0.93 } ] }
  ]
}
```

Seconds, relative to the audio file. Words keep attached punctuation.
Validation rejects: negative times, end < start, words out of order or
overlapping (> 20 ms), words outside their segment, times past `duration`.

Engine notes: whisper.cpp returns sub-word tokens; `whisper-cpp-adapter.ts`
merges them into words (a token starting with a space starts a word;
punctuation attaches), drops special tokens (`[_BEG_]`, `[_TT_…]`), and
normalises timing so words never run backwards. Word boundaries are
whisper's token timestamps — accurate to roughly ±0.1 s, fine for scene cuts
and caption highlighting.

**Deterministic?** Same audio + model + whisper.cpp version gives the same
output on the same machine; across CPUs, timings can differ slightly. That's
why the transcript is saved and committed, not regenerated at render time:
renders are reproducible from `transcript.json`.

## Draft transcripts

`npm run transcript -- draft <project>` estimates timing from the script
(~2–2.5 words/s, pauses at punctuation) so you can build and preview scenes
**before** recording: `npm run stills -- <project> --draft`. It's marked
`engine.name: "draft"`, warned about everywhere, and never replaces a real
transcript. Until `transcript.json` exists, Studio (and `npx remotion …`)
fall back to the draft with the narration muted, so you can preview; the
3gp `npm run render` refuses to make a final render without the recording
unless you pass `--draft`. Anchor scenes with `timing.phrase` so they survive the switch to
the real recording.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `could not download the whisper model` / `bad header` | Model host blocked — download manually (Setup → 2) |
| `whisper.cpp build failed` | Install git/make/compiler; delete `.cache/whisper.cpp` and retry |
| `Whisper folder … exists but the executable … is missing` | Delete `.cache/whisper.cpp` (half-finished build) |
| `no speech found in the audio` | Wrong file / silent file / wrong `--language` |
| `transcript is stale` (validate) | Recording changed: `npm run transcribe -- <n> --force` |
| `phrase "…" not found` (validate) | The recording differs from the script: check `npm run transcript -- <n>` and adjust `timing.phrase` |
| Misheard names/numbers | Edit `transcript.json` by hand (keep timings), then `npm run validate` |
