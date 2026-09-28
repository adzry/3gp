# Engines

## Decision

| Engine | Role in 3gp | Status |
|---|---|---|
| **Remotion** | Primary engine for everything | Installed, core |
| FFmpeg | Encoding, probing, loudness, GIF, audio prep | Bundled with Remotion (`npx remotion ffmpeg`) |
| Motion Canvas | Secondary, for diagram-heavy explainer segments | Documented, not installed |
| Three.js / R3F via `@remotion/three` | 3D inside Remotion | Install per project |
| Blender | Offline 3D renders → footage for Remotion | External tool |
| HyperFrames | HTML/GSAP renderer (what vox-style-animation targets) | Reference only |

## Why Remotion is primary

- **Code-first and agent-friendly:** a video is a React component; props are
  data validated by Zod schemas. Claude edits JSON/TSX, validates, renders
  stills, and inspects them — a tight loop.
- **Deterministic:** frame = f(props, frame). Same input → same pixels.
- **Parameterised + data-driven:** `schema` + `defaultProps` +
  `calculateMetadata` mean duration/size come from data (3gp uses this for
  scene-list videos and format variants).
- **Ecosystem:** captions (`@remotion/captions`), media (`@remotion/media`),
  transitions, Lottie, Three.js, Skia, maps; official agent skills; Studio
  for visual preview; Lambda/Cloud Run for scale.
- **Rendering in constrained environments works:** in the build container,
  Remotion could not download its Chrome Headless Shell (host blocked), but
  runs fine against a preinstalled Chromium — `tools/lib.mjs` auto-detects
  Playwright's headless shell, or set `REMOTION_BROWSER_EXECUTABLE`.

Current recommended project shape (checked with `create-video@4.0.529`):
`src/index.ts` → `registerRoot(Root)`, `remotion.config.ts` with
`Config.setRspack(true)`, React 19, Zod 4, TypeScript 5.9. 3gp follows it.

**Licence caveat:** free for individuals and companies ≤ 3 employees;
Company License above that. See [licensing.md](licensing.md).

## Motion Canvas — when it would beat Remotion

Motion Canvas (MIT) uses generator functions (`yield* circle().scale(2, 1)`)
with a timeline editor and audio-synced "time events". Latest npm release
3.17.2 (Feb 2025); repo still receiving commits in 2026.

| Use Motion Canvas when… | Stay in Remotion when… |
|---|---|
| The segment is a **procedural diagram**: nodes/edges morphing, geometry, LaTeX, code morphing, math | The video is **templated/data-driven** (same animation, new content) |
| Animation is naturally **sequential** ("do A, then B, then C") and easier to write imperatively | You need **captions, footage, audio mixing, variants, batch rendering** |
| You want to **scrub-and-tweak timing** against VO in its editor | The output must be produced **headlessly by an agent** end to end |

**Integration pattern (if needed):** render the Motion Canvas segment to a
video file (its renderer outputs image sequences / video via its FFmpeg
plugin), drop it into `public/projects/<n>/`, and place it in a Remotion
scene. Don't run both engines inside one project's source.

Not installed now: no current project needs it, and it would add a second
toolchain (Vite project + editor) to maintain.

## FFmpeg

Remotion ships an FFmpeg **n7.1 minimal build** (`npx remotion ffmpeg`,
`npx remotion ffprobe`). Verified available: libx264, libvpx(-vp9),
ProRes (prores_ks), AAC, GIF, PNG/MJPEG; filters `scale`, `crop`,
`loudnorm`, `silencedetect`, `palettegen`/`paletteuse`, `concat`, `atempo`…
**Missing:** `fps`, `drawtext`, `overlay`, `tile`. `tools/media/media.mjs`
works within these limits. Install a full FFmpeg for compositing tasks — or
better, do compositing in Remotion.

## 3D

- **`@remotion/three`** (Remotion License) wraps React Three Fiber's canvas so
  frames are deterministic. Use for product spins, 3D logos, camera moves,
  spatial UI. Install only in projects that need it:
  `npx remotion add @remotion/three` (+ `three`, `@react-three/fiber`, both MIT).
  Official guidance: `/remotion-markup` → `3d.md`.
- **Blender** for photoreal/heavy scenes: render an image sequence or ProRes
  with alpha, composite in Remotion.
- Not a core dependency: WebGL rendering is slower and GPU-sensitive in
  headless Chromium.
