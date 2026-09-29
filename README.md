# 3gp

**A personal AI-assisted video production engine.** Programmatic video on
[Remotion](https://www.remotion.dev): standardised production infrastructure
(scene data, voice-first timing, transcripts, captions, music, validation,
format variants, stills, render) under an **open visual layer** — templates
where they are the best treatment, bespoke scenes where they are not. Built
so Claude Code can take a video from idea to export.

```
IDEA → BRIEF → SCRIPT → CREATIVE DIRECTION (per scene) → video.json
     → VALIDATE → REVIEW STILLS → RENDER → CAPTIONS/AUDIO → EXPORT
```

or, **voice-first** — the narration sets the timing:

```
IDEA → SCRIPT → VOICE → TRANSCRIBE → transcript.json → SCENE TIMING → REMOTION → RENDER
```

The core idea: **3gp is a production engine, not a template library.** A
project is a `video.json` listing scenes. Each scene is drawn by a
**template** (`"template": "MetricCard"`) or by a **custom scene** written for
that video (`"custom": "ThroatOfVenice"`) — and both get the same timing,
narration, captions, music, validation, variants, stills and render.

Creative priority, in order: visual storytelling and final quality ›
scene-specific direction › motion design › hierarchy and composition ›
narration sync › reusability › existing templates. For each scene, ask
*what is the strongest visual treatment?* — then reuse a template, compose
primitives, extend a component, or build a custom scene.

## Quickstart

Requires Node ≥ 22.18.

```bash
npm install
npm run skills                     # official Remotion agent skills (optional, recommended)
npm run studio                     # visual preview at http://localhost:3000
npm run stills -- 001              # one PNG per scene of project 001 → review/
npm run render -- 001              # MP4s → projects/001-*/exports/
```

In cloud/CI containers where Remotion can't download its browser, set
`REMOTION_BROWSER_EXECUTABLE` to a Chromium/headless-shell binary (the 3gp
tools auto-detect Playwright's under `PLAYWRIGHT_BROWSERS_PATH`).

## Architecture

```
3gp/
├── projects/                  one folder per video
│   ├── index.ts               registry (auto-updated by `npm run new`)
│   ├── 001-from-3gp-to-3gp/   brief.md · storyboard.md · script.md · video.json
│   ├── 002-voice-first-demo/  voice-driven timing + captions + footage
│   └── 004-…/scenes/          bespoke scenes: schemas.ts (zod) + components + index.ts
│                              exports/ and review/ are git-ignored
├── src/                       the Remotion workspace
│   ├── Root.tsx               registers projects + template gallery
│   ├── video/                 scene-list format (schema.ts), SceneVideo renderer,
│   │                          transcript.ts (format), timeline.ts (seconds/voice → frames),
│   │                          narration.ts + scene-context.ts (useScene, useWordFrame),
│   │                          custom-scenes.ts (defineScenes registry)
│   ├── templates/             TitleCard, KineticText, LowerThird, QuoteCard,
│   │                          MetricCard, BarChart, LineChart, Comparison,
│   │                          CaptionedShort, EndCard, LogoReveal, Footage, MapRoute
│   │                          + schemas.ts (zod) + samples.ts (gallery/examples)
│   ├── components/            Stage, Reveal, WordReveal, Headline, Emphasis,
│   │                          CountUp, HandCircle, Captions, Kicker, Media, SceneShell
│   ├── styles/                style packs: studio, vox-editorial (tokens + STYLE.md)
│   └── lib/                   motion tokens, resolution-independent layout, fonts,
│                              world.ts (Natural Earth countries), geo, labels
├── recipes/                   narrative structures + starter scene lists
├── tools/                     render/stills, new-project, validate, media,
│                              captions/ (transcribe, transcript, SRT)
├── tests/                     unit tests (node --test): transcript, timing, captions
├── schemas/                   JSON Schemas for video.json + transcript.json (generated)
├── public/projects/<n>/       per-project assets (images, video, voiceover, transcript)
├── research/                  resources, licensing, engines, templates, audio, AI video
└── .claude/skills/3gp-create-video/   the production workflow for Claude
```

Why this shape: one Remotion workspace (not a monorepo), one data format, one
place per concern. Directories get added when a real project needs them.

## Create a video

```bash
npm run new -- "Why 3G phones mattered" --recipe explainer
#   --format landscape|vertical|square   --theme studio|vox-editorial
```

This creates `projects/NNN-slug/` with a brief, storyboard and script
pre-filled from the recipe, a starter `video.json`, an asset folder
`public/projects/NNN-slug/`, and registers the composition.

Then edit `video.json`:

```json
{
  "$schema": "../../schemas/video.schema.json",
  "id": "p002-why-3g-phones-mattered",
  "title": "Why 3G phones mattered",
  "format": "landscape",
  "theme": "vox-editorial",
  "scenes": [
    { "template": "TitleCard", "seconds": 4,
      "props": { "kicker": "Explained", "title": "Video fit in your pocket", "emphasis": ["pocket"] } },
    { "template": "MetricCard", "seconds": 4,
      "props": { "label": "Pixels in QCIF", "value": 25344, "annotate": true, "source": "176 × 144" } }
  ],
  "variants": [{ "id": "p002-why-3g-phones-mattered-vertical", "format": "vertical", "theme": "studio" }]
}
```

```bash
npm run validate          # errors with paths, e.g. "scenes.1.props.value: Invalid input: expected number"
npm run stills -- 002     # look at every scene
npm run render -- 002     # final MP4(s)
```

## Voice-first videos

Record the narration first; the words decide when each scene starts.

```bash
npm run new -- "My explainer" --recipe explainer
# 1. write VO: lines in script.md, design scenes in video.json (see below)
npm run transcript -- draft 003     # optional: estimated timing from the script
npm run stills -- 003 --draft       #   → preview before recording (muted)
# 2. record → public/projects/003-my-explainer/voiceover.wav
npm run transcribe -- 003           # local whisper.cpp → transcript.json (word timestamps)
npm run transcript -- 003           # words + which words each scene got
npm run validate && npm run stills -- 003
npm run render -- 003
```

In `video.json`, add the voice-over and time scenes by what is **said**:

```json
{
  "voiceover": {
    "src": "projects/003-my-explainer/voiceover.wav",
    "transcript": "projects/003-my-explainer/transcript.json",
    "offset": 0, "tail": 1.5
  },
  "captions": { "position": "bottom", "size": 54 },
  "scenes": [
    { "template": "TitleCard", "timing": { "phrase": "This video wasn't timed" }, "props": { … } },
    { "template": "Footage",   "timing": { "words": [12, 33] },  "props": { "src": "projects/003-my-explainer/clip.mp4" } },
    { "template": "KineticText", "timing": { "segments": [3, 3] }, "captions": false, "props": { … } },
    { "template": "LogoReveal", "seconds": 3, "props": { … } }
  ]
}
```

| Scene timing | Meaning |
|---|---|
| `"seconds": 4` | Fixed length (as before) |
| `"timing": { "phrase": "the words", "through": "optional end words" }` | Starts when the phrase is spoken — survives re-recording best |
| `"timing": { "words": [a, b] }` | Transcript word indices (inclusive) — `npm run transcript` lists them |
| `"timing": { "segments": [a, b] }` | Transcript segment indices |
| `"timing": { "from": 3.2, "to": 7 }` | Explicit seconds on the video timeline |

Rules (`src/video/timeline.ts`): scenes play back to back; a voice-timed
scene starts on its anchor and runs until the next scene starts; the first
scene starts at 0; the last ends on its last word + `voiceover.tail`;
`voiceover.offset` delays the narration (e.g. for a `seconds` intro).
`npm run validate` reports anchors out of spoken order, ranges outside the
transcript, `seconds` scenes that would run into the narration, missing or
stale transcripts, and missing/unsupported media. Captions come from the
transcript, one highlighted word at a time; set `"captions": false` on scenes
that already show the words. Details: [`tools/captions/README.md`](tools/captions/README.md).

## Background music

```bash
npm run music -- generate 003 --mood calm     # or bright; --seed N for a variation
```

writes `public/projects/003-…/music.generated.wav` — a licence-clean bed
(pad, bass, arpeggio) synthesised by 3gp itself, exactly as long as the video
(rounded to whole bars so it loops cleanly). Deterministic, so it isn't
committed: re-run the command to recreate it. Or use any track whose licence
you've verified.

```json
"audio": { "src": "projects/003-what-is-3gp/music.generated.wav",
           "volume": 0.6, "fadeIn": 1.5, "fadeOut": 3,
           "loop": true, "trimStart": 0, "duckUnderVoice": 0.35 }
```

- **Fades** at the start/end of the video; **loops** if the track is short.
- **Ducking:** with a voice-over, music drops to `duckUnderVoice` × volume
  while the narrator speaks (from the transcript), gliding in/out over 0.3 s
  and bridging pauses < 0.6 s so it doesn't pump.
- **Per-scene level:** `"musicLevel": 0.5` on a scene lowers the music there.
- Logic: `src/video/music.ts` (unit-tested). Loudness check:
  `npm run media -- loudnorm file` normalises a finished render to −14 LUFS.

## Custom scenes

When a template is not the strongest treatment — a camera move across a map,
an animated diagram, a visual metaphor, a hybrid of footage and graphics —
write the scene for the video. It stays in the project:

```
projects/004-sejarah-perdagangan-melaka/scenes/
  schemas.ts          export const SCENE_SCHEMAS = { ThroatOfVenice: z.object({…}) }   (pure zod)
  ThroatOfVenice.tsx  the component (props = the schema's parsed output)
  index.ts            export const SCENES = defineScenes(SCENE_SCHEMAS, { ThroatOfVenice })
```

Register once in `projects/index.ts` (`{ video: p004, scenes: s004 }`), then
use it in `video.json` like any scene:

```json
{ "custom": "ThroatOfVenice", "timing": { "phrase": "Seorang pengembara" },
  "transition": "none", "props": { "quote": "…", "emphasis": "throat of Venice" } }
```

What the scene gets from the engine:

| | |
|---|---|
| Timing | `seconds` or any voice `timing` — identical rules to templates |
| Narration | `useScene().words` (this scene's words, frames relative to its start) · `useWordFrame("phrase", fallback)` to land a beat on a spoken word |
| Transitions | the style pack's cut by default; `"transition": "none"` hands entrance/exit to the scene |
| Captions, music | the video-level overlay and ducking, `captions: false` / `musicLevel` per scene |
| Validation | scene declared, props checked against its schema, media paths in props checked |
| Variants, stills, render | every format of the video; stills named `scene-XX-<CustomName>.png` |
| Primitives | `Stage`, `Reveal`, `Emphasis`, `WordReveal`/`splitWithPhrases`, `HandCircle`, `CountUp`, `Media`, `useLayout`, `useTheme`, `src/lib/world.ts` |

Custom scenes stay project-local; promote one to `src/scenes/` (or a
template) only when a second real video needs it.

## Templates — tools, not constraints

Use one when it is genuinely the best treatment for the scene.

| Template | Use for | Key props |
|---|---|---|
| `TitleCard` | Hooks, section titles, conclusions, CTAs | `kicker`, `title`, `subtitle`, `emphasis`, `align` |
| `KineticText` | Punchy lines one at a time | `lines[]`, `emphasis`, `size` |
| `LowerThird` | Name/role IDs, exhibit labels (over footage) | `name`, `role`, `side`, `background` |
| `QuoteCard` | Real, attributed quotes | `quote`, `author`, `source`, `emphasis` |
| `MetricCard` | One number that matters | `value`, `label`, `prefix/suffix`, `context`, `source`, `annotate` |
| `BarChart` | Comparisons (≤ 8 bars) | `title`, `data[{label,value,highlight}]`, `annotation`, `source` |
| `CaptionedShort` | Vertical VO + word-timed captions | `captions` / `captionsFile`, `audio`, `background`, `headline` |
| `LogoReveal` | Openers, sign-offs | `wordmark`, `tagline`, `logo` |
| `LineChart` | Trends over time / ordered steps (2–24 points) | `title`, `data[{label,value}]`, `unit`, `highlight`, `annotation`, `zeroBased`, `source` |
| `Comparison` | Before/after, A vs B | `title`, `left`/`right` `{label,title,points[],media}`, `winner` |
| `EndCard` | Closing CTA + credits/attributions | `headline`, `subline`, `credits[]` |
| `MapRoute` | Journeys: flights, trade routes, trips (offline vector map) | `title`, `stops[{name,lon,lat}]`, `path` (arc\|line), `highlight[]` (country names), `showDistance`, `padding`, `source` |
| `Footage` | A clip or still, any aspect ratio | `src`, `trimStart`, `fit`, `focus{x,y}` (crop), `zoom{from,to}`, `pan{x,y}`, `loop`, `dim`, `label`, `credit` |

Full schemas: `src/templates/schemas.ts`. Working examples of every template:
`src/templates/samples.ts`, previewable in Studio under **templates/** (and
the `gallery-studio` / `gallery-vox-editorial` compositions).

## Choose a style

| Style | Register | Good for |
|---|---|---|
| `studio` | Calm dark screen, one mint accent, overdamped motion | Product, tech, social |
| `vox-editorial` | Printed paper, ink, yellow highlighter, red pen annotation, sheet-wipe cuts | Explainers, journalism, data stories |

Per-scene override: `"theme": "studio"` on any scene. Specs:
`src/styles/<name>/STYLE.md`.

**Language:** `"lang": "ms"` (or `"en"`, the default) in `video.json` sets the
text templates print themselves — "Sumber:" instead of "Source:", map
distance notes. Everything else comes from your props, in any language.
Add a language in `src/lib/lang.ts`.

## Recipes

Explainer · Documentary · Product launch · Social short · Vox/editorial —
see [`recipes/README.md`](recipes/README.md). Rules for all: VO-first, one
idea per scene, one emphasis per scene, **no invented numbers**.

## Working with Claude Code

Ask for a video in plain language — *"make a 30-second vertical explainer
about X in the vox style"*. Claude follows the
[`3gp-create-video`](.claude/skills/3gp-create-video/SKILL.md) skill: brief →
recipe → scaffold → script → storyboard → `video.json` → validate → review
stills (it looks at every frame) → render → report. For low-level Remotion
work it uses the official Remotion skills (`/remotion-best-practices`,
`/remotion-captions`, …), installed by `npm run skills` and by the
SessionStart hook in `.claude/settings.json`.

Claude's standing instructions are in [`CLAUDE.md`](CLAUDE.md).

## Commands

| Command | Does |
|---|---|
| `npm run studio` | Remotion Studio (preview, edit props visually) |
| `npm run new -- "Title" [--recipe r] [--format f] [--theme t]` | Scaffold a project |
| `npm run validate` | Validate all `video.json`; regenerate JSON Schema |
| `npm run stills -- <nnn>` | One review PNG per scene → `projects/<n>/review/` |
| `npm run render -- <nnn> [--only id] [-- remotion flags]` | Render → `projects/<n>/exports/` |
| `npm run render -- <compositionId>` | Render any composition → `out/` |
| `npm run media -- probe\|web\|gif\|loudnorm\|wav16k\|silences <file>` | FFmpeg tasks (Remotion's bundled FFmpeg) |
| `npm run transcribe -- <nnn \| file> [--model m] [--language l] [--force]` | Local whisper.cpp → transcript JSON (word timestamps) |
| `npm run transcript -- <nnn> [--draft]` · `npm run transcript -- draft <nnn>` | List words/scene timing · draft transcript from script |
| `npm run stills\|render -- <nnn> --draft` | Voice-first preview on the draft transcript |
| `npm run music -- generate <nnn \| out.wav> [--mood calm\|bright] [--seed N] [--seconds N]` | Generate a licence-clean music bed |
| `npm run fixtures` | Render the placeholder footage test clip → `public/fixtures/` |
| `npm run captions:srt -- in.srt out.json` | SRT → caption JSON |
| `npm test` | Unit tests (transcript, timing, captions, custom scenes, adapter) |
| `npm run validate [-- --strict]` | Validate projects; `--strict` also fails on pending recordings |
| `npm run check` | Lint + typecheck + tests + validate (run before committing) |
| `npm run skills` | Install/update the official Remotion agent skills |

## Outputs

- Final renders: `projects/<n>/exports/<compositionId>.mp4`
- Review stills: `projects/<n>/review/<compositionId>/scene-XX-<Template|CustomName>.png`
  (`--frames a,b,c` → `frame-NNNNN-scene-XX.png`)
- Draft previews: `….draft.mp4` / `review/<id>-draft/`
- Ad-hoc renders: `out/`

All of these are git-ignored — renders are reproducible from the data.
Transcripts (`public/projects/<n>/transcript.json`) are data: commit them,
since renders depend on them.

## Licensing

- **Remotion** is free for individuals and companies of up to 3 employees;
  larger for-profit organisations need a Company License. Details and the full
  register: [`research/licensing.md`](research/licensing.md).
- Bundled fonts (Inter, Archivo Black, Caveat, JetBrains Mono) are SIL OFL 1.1.
- Adapted MIT material is credited in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
- Stock/music/SFX/Lottie providers are external and **REQUIRES REVIEW** per
  asset; log every asset's licence in the project's `brief.md`.

## Quality gate for new resources

Before adding any dependency, template, asset source or tool, it must:
improve quality, save production time, be reusable, have a clear licence,
work in an agent/code workflow, and justify its maintenance. Otherwise it
goes in `research/` as a reference, not in the build.

## Research

[`research/resources.md`](research/resources.md) is the registry of every
resource evaluated — engines, skills, templates, fonts, stock, audio, AI —
with licence and status. See also `engines.md` (Remotion vs Motion Canvas,
FFmpeg, 3D), `templates.md`, `audio.md`, `ai-video.md`.
