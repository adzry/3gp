# 3gp

**A personal AI-assisted video production lab.** Programmatic video on
[Remotion](https://www.remotion.dev), reusable templates, style packs,
storytelling recipes and small production tools — built so Claude Code can
take a video from idea to export, and each video makes the next one faster.

```
IDEA → BRIEF → SCRIPT → STORYBOARD → STYLE → TEMPLATES → video.json
     → VALIDATE → REVIEW STILLS → RENDER → CAPTIONS/AUDIO → EXPORT
```

The core idea: **content data + reusable template + style pack = video.**
A project is a `video.json` listing scenes (template + props). Changing the
words, the format (16:9 / 9:16 / 1:1) or the whole visual style is a data
edit — no animation code is rewritten.

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
│   └── 001-from-3gp-to-3gp/   brief.md · storyboard.md · script.md · video.json
│                              exports/ and review/ are git-ignored
├── src/                       the Remotion workspace
│   ├── Root.tsx               registers projects + template gallery
│   ├── video/                 scene-list format (schema.ts) + SceneVideo renderer
│   ├── templates/             TitleCard, KineticText, LowerThird, QuoteCard,
│   │                          MetricCard, BarChart, CaptionedShort, LogoReveal
│   │                          + schemas.ts (zod) + samples.ts (gallery/examples)
│   ├── components/            Stage, Reveal, WordReveal, Headline, Emphasis,
│   │                          CountUp, HandCircle, Captions, Kicker, Media, SceneShell
│   ├── styles/                style packs: studio, vox-editorial (tokens + STYLE.md)
│   └── lib/                   motion tokens, resolution-independent layout, fonts
├── recipes/                   narrative structures + starter scene lists
├── tools/                     render/stills, new-project, validate, media, captions
├── schemas/video.schema.json  JSON Schema for video.json (generated)
├── public/projects/<n>/       per-project assets (images, video, audio, captions)
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

## Choose a template

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
| `npm run captions:srt -- in.srt out.json` | SRT → caption JSON |
| `npm run check` | Lint + typecheck + validate (run before committing) |
| `npm run skills` | Install/update the official Remotion agent skills |

## Outputs

- Final renders: `projects/<n>/exports/<compositionId>.mp4`
- Review stills: `projects/<n>/review/<compositionId>/scene-XX-<Template>.png`
- Ad-hoc renders: `out/`

All are git-ignored — renders are reproducible from the data.

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
