# Resource registry

Every external resource 3gp uses, evaluated, or deliberately left out.
**Licence column rule:** only what was verified from the primary source on the
date shown; otherwise `REQUIRES REVIEW`. Details in [licensing.md](licensing.md).

Verified on **2026-09-28** by reading the LICENSE file in the repo, the npm
`license` field, or the licence text on raw.githubusercontent.com. Websites
for stock/audio/Lottie providers were **not reachable** from the build
environment (egress policy), so their terms are unverified.

**Status legend:** `Core` = installed and used · `Installed` = present, used by
tooling · `Secondary` = documented option, not installed · `Reference` =
studied for ideas, no code taken · `Adapted` = ideas/values re-implemented,
credited in `THIRD_PARTY_NOTICES.md` · `External` = use per asset, never bulk
import · `Not used`.

## Engines & frameworks

| Resource | Type | URL | Purpose | Licence | 3gp status |
|---|---|---|---|---|---|
| Remotion 4.0.529 (`remotion`, `@remotion/cli`) | Engine | https://github.com/remotion-dev/remotion | Programmatic video in React | Remotion License (free for individuals & companies ≤ 3 employees; company licence above) | **Core** |
| `@remotion/captions` | Library | npm | Caption type, TikTok-style paging, SRT parsing | MIT (npm field) | **Core** |
| `@remotion/fonts` | Library | npm | Load bundled font files with delayRender | MIT (npm field) | **Core** |
| `@remotion/media` | Library | npm | `<Audio>`, `<Video>` (current recommended API) | No licence field → treat as Remotion License | **Core** |
| `@remotion/transitions` | Library | npm | `TransitionSeries` | npm field "UNLICENSED" → treat as Remotion License | Not used yet (custom `SceneShell`) |
| `@remotion/three` | Library | npm | React Three Fiber in Remotion | Remotion License | Secondary (install per project) |
| `d3-geo` 3.1.1 | Library | npm | Map projections, great-circle paths (MapRoute) | ISC (npm field) | **Core** |
| `topojson-client` 3.1.0 | Library | npm | TopoJSON → GeoJSON (MapRoute) | ISC (npm field) | **Core** |
| `world-atlas` 2.0.2 | Map data | https://github.com/topojson/world-atlas | Natural Earth 1:110m / 1:50m countries as TopoJSON | ISC (package); data: Natural Earth — public domain ("Everything here is public domain", nvkelso/natural-earth-vector LICENSE.md, verified 2026-09-29) | **Core** |
| `@remotion/lottie` | Library | npm | Lottie playback | Remotion License | Secondary |
| `@remotion/install-whisper-cpp` 4.0.529 | Tool | npm | Builds whisper.cpp, downloads models, runs transcription | MIT (npm field) | **Installed** (devDependency, used by `npm run transcribe`) |
| whisper.cpp 1.5.5 | Transcription engine | https://github.com/ggml-org/whisper.cpp | Local speech-to-text with token timestamps | MIT (LICENSE) | **Core for voice-first** — built into `.cache/whisper.cpp` (git-ignored) |
| Whisper models (ggml) | Model weights | https://huggingface.co/ggerganov/whisper.cpp | base.en default | MIT — "Whisper's code and model weights are released under the MIT License" (openai/whisper README, verified 2026-09-28) | External download to `.cache/whisper-models` |
| faster-whisper / openai-whisper | Transcription engines | GitHub | Python alternatives | MIT | Not used (one engine at a time) |
| Motion Canvas 3.17.2 | Engine | https://github.com/motion-canvas/motion-canvas | Generator-based vector animation | MIT (LICENSE) | Secondary — see [engines.md](engines.md) |
| HyperFrames | Engine | https://github.com/heygen-com/hyperframes | HTML/GSAP → video (vox-style-animation runs on it) | Apache-2.0 (LICENSE) | Reference |
| Three.js | Library | https://github.com/mrdoob/three.js | 3D | MIT (LICENSE) | Secondary |
| React Three Fiber | Library | https://github.com/pmndrs/react-three-fiber | React renderer for Three.js | MIT (LICENSE) | Secondary |
| Blender | Tool | https://www.blender.org | Offline 3D, renders plates for Remotion | GPL (per Blender project) — REQUIRES REVIEW for asset/output questions | External tool |
| FFmpeg (bundled with Remotion, n7.1 minimal build) | Tool | https://ffmpeg.org | Encode, probe, loudness, GIF | LGPL-2.1+ / parts GPL (LICENSE.md) | **Installed** via `npx remotion ffmpeg` |
| Zod 4 | Library | npm | Schemas for templates and `video.json` | MIT | **Core** |

## Agent tooling

| Resource | Type | URL | Purpose | Licence | 3gp status |
|---|---|---|---|---|---|
| Remotion Agent Skills (12 skills) | Agent skills | https://github.com/remotion-dev/skills | Official Remotion best practices for agents | No LICENSE in mirror; source lives in the Remotion monorepo (`packages/skills`) → treat as Remotion License | **Installed** (`npm run skills`, pinned in `skills-lock.json`, not vendored) |
| `skills` CLI | Tool | npm `skills` | Installs agent skills | REQUIRES REVIEW | Used by `npm run skills` |
| video-editor-plugin | Claude Code plugin | https://github.com/ElSalvatore-sys/video-editor-plugin | FFmpeg + Remotion + Whisper slash commands | **No licence file** → all rights reserved | Reference only |
| OpenVideo | Agent-readable editor | https://github.com/clawnify/OpenVideo | JSON edit-decision-list editor | MIT (LICENSE) | Reference (EDL idea → `video.json`) |

## Templates & components

| Resource | Type | URL | Purpose | Licence | 3gp status |
|---|---|---|---|---|---|
| Remotion official templates | Templates | https://github.com/remotion-dev (`template-*`) | Starters: audiogram, tiktok, music-visualization, prompt-to-video, prompt-to-motion-graphics-saas, three, still, skia, tailwind, overlay, code-hike, helloworld, react-router (repos verified to exist) | Remotion License (per template README) | Reference — see [templates.md](templates.md) |
| remotion.dev/templates | Catalogue | https://www.remotion.dev/templates | Template gallery | — | Not reachable from build env |
| Onda | Components | https://github.com/degueba/onda | 70 Remotion motion components, source-you-own CLI | MIT (LICENSE) | **Adapted** (motion tokens); candidate for future `npx ondajs add` |
| Locomotion | Templates | https://github.com/locomotion-pro/locomotion | 67 single-file Remotion templates | **No licence file** → all rights reserved | Reference only |
| remotion-video-templates | Templates | https://github.com/AleBrito124356/remotion-video-templates | 7 prop-driven templates (logo, lower third, kinetic, charts, captions, promo) | MIT (LICENSE) | Reference (architecture: schema + defaults + calculateMetadata) |
| vox-style-animation | Style pack | https://github.com/Cele-san/vox-style-animation | Vox-style editorial rules for HyperFrames | MIT (LICENSE) | **Adapted** → `src/styles/vox-editorial` |
| Motion Canvas examples | Examples | https://github.com/motion-canvas/examples | Reference scenes | MIT (LICENSE) | Reference |

## Fonts

| Resource | Type | URL | Purpose | Licence | 3gp status |
|---|---|---|---|---|---|
| Inter (`@fontsource/inter` 5.3.0) | Font | https://github.com/rsms/inter | UI/body/display (studio) | SIL OFL 1.1 (google/fonts OFL.txt + npm) | **Core** (bundled) |
| Archivo Black (`@fontsource/archivo-black`) | Font | https://github.com/Omnibus-Type/ArchivoBlack | Editorial headlines | SIL OFL 1.1 | **Core** |
| Caveat (`@fontsource/caveat`) | Font | https://github.com/googlefonts/caveat | Hand-written notes | SIL OFL 1.1 | **Core** |
| JetBrains Mono (`@fontsource/jetbrains-mono`) | Font | https://github.com/JetBrains/JetBrainsMono | Numbers, code | SIL OFL 1.1 (npm field) | **Core** |
| Google Fonts | Font library | https://fonts.google.com | Source for further families | Per family (mostly OFL; some Apache/UFL) | External — add via `@fontsource/*`, log licence |

## Stock media, audio, animation (External — per-asset use)

| Resource | Type | URL | Purpose | Licence | 3gp status |
|---|---|---|---|---|---|
| Pexels | Stock video/photo | https://www.pexels.com/license/ | B-roll, stills | REQUIRES REVIEW | External |
| Pixabay | Stock video/photo/music/SFX | https://pixabay.com/service/license-summary/ | B-roll, music, SFX | REQUIRES REVIEW | External |
| Coverr | Stock video | https://coverr.co/license | B-roll | REQUIRES REVIEW | External |
| Mixkit | Stock video/music/SFX | https://mixkit.co/license/ | Music beds, SFX | REQUIRES REVIEW (separate licences per media type) | External |
| Freesound | SFX | https://freesound.org | Sound effects | Licence set **per sound** (Creative Commons variants incl. NC) — check each | External |
| LottieFiles | Lottie animations | https://help.lottiefiles.com/animation-licensing-basics- | Icons, UI motion | REQUIRES REVIEW (per-animation) | External |

## AI video / audio

See [ai-video.md](ai-video.md). No vendor is integrated; the layer is a
research register so the architecture stays model-agnostic.
