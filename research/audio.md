# Audio, captions & Lottie

## Music & SFX sources

All **External**: download per asset, log licence in the project brief.
Terms were not verifiable from the build environment — see the checklist in
[licensing.md](licensing.md#asset-providers--terms-to-verify-before-first-use).

| Source | URL | Music | SFX | Licence | Commercial | Attribution | Watch out for |
|---|---|---|---|---|---|---|---|
| Mixkit | https://mixkit.co/ | ✓ | ✓ | REQUIRES REVIEW | verify | verify | Different licence per media type |
| Pixabay | https://pixabay.com/music/ | ✓ | ✓ | REQUIRES REVIEW | verify | verify | Content ID claims on some tracks |
| Freesound | https://freesound.org/ | — | ✓ | Per sound (CC variants) | depends on sound | often required | NC-licensed sounds; filter to CC0 first |

Preference: CC0/public-domain-style → attribution-only → never NC for
commercial work.

## Audio in Remotion

- `<Audio>` from `@remotion/media` (installed). 3gp: top-level `audio`
  in `video.json` for a VO/music bed; `CaptionedShort.audio` per scene.
- Volume must be a callback for animation (`volume={(f) => …}`) — lint enforces.
- Loudness for delivery: `npm run media -- loudnorm file` (−14 LUFS, −1.5 dBTP).
- Official guidance for trimming, ducking, SFX, visualisation:
  `/remotion-markup` → `audio.md`, `sfx.md`, `audio-visualization.md`,
  `voiceover.md`.

## Captions

Pipeline, setup and troubleshooting: [`tools/captions/README.md`](../tools/captions/README.md).
3gp transcribes locally with **whisper.cpp via `@remotion/install-whisper-cpp`**
(`npm run transcribe`) into its own transcript format, which drives both
captions and voice-timed scenes. One engine only; the others below are
documented alternatives, not installed.

| Tool | Licence (verified) | Word timestamps | Notes |
|---|---|---|---|
| whisper.cpp | MIT | ✓ (token-level) | C++, CPU-friendly; official Remotion wrapper `@remotion/install-whisper-cpp` (MIT) |
| faster-whisper | MIT | ✓ | Python/CTranslate2, fastest on CPU/GPU |
| openai-whisper | MIT | ✓ | Reference implementation |

Model weights are downloaded separately; check each model's licence when you
download it.

## Lottie

- `@remotion/lottie` (Remotion License) plays Lottie JSON frame-accurately.
  Install per project: `npx remotion add @remotion/lottie`. Guidance:
  `/remotion-markup` → `lottie.md`.
- Good for icons, UI micro-interactions, loaders, decorative accents.
- LottieFiles licensing is per animation — REQUIRES REVIEW each time; don't
  commit restricted `.json` files. Prefer building simple icon motion natively
  in React (it inherits the theme).
