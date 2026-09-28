---
name: 3gp-create-video
description: Produce a video inside the 3gp lab — brief, storyboard, style and template selection, video.json, review stills, render, QA and export. Use whenever the user asks to make, draft, edit, restyle or render a video, explainer, short, promo, title sequence or motion graphic in this repository.
---

# 3gp: create a video

3gp is a Remotion-based production lab. A video is **data** (`projects/<n>/video.json`:
a list of scenes, each naming a template + props) rendered by **reusable
templates** in a **style pack**. Default to changing data, not code.

Read `README.md` once per session if you haven't. For low-level Remotion
questions (APIs, audio, transitions, 3D, maps), use the official skills
(`/remotion-best-practices`, `/remotion-markup`, `/remotion-captions`,
`/remotion-docs`). If they are missing, run `npm run skills`.

## Workflow

Work through these in order. Stop and ask the user only at the ⏸ points,
and only if the request leaves the answer genuinely open.

1. **Brief** ⏸ — Goal, audience/channel, key message, length, format
   (landscape / vertical / square), facts & sources. If the user gave a
   one-liner, draft the brief yourself and state assumptions.
2. **Pick a recipe** — `recipes/README.md`. explainer · documentary ·
   product-launch · social-short · vox-editorial.
3. **Scaffold** — `npm run new -- "Title" --recipe <recipe> [--format vertical] [--theme vox-editorial]`.
   Fill `brief.md`.
4. **Script (VO-first)** — Write `script.md` per scene. ~2.5 spoken words per
   second; set each scene's `seconds` from its line length (min ~2 s, final
   scene holds 3–5 s).
5. **Storyboard** — `storyboard.md`: one row per scene → template + on-screen text.
6. **Style** ⏸ — `studio` (clean dark: product, tech, social) or
   `vox-editorial` (paper, highlighter, annotation: explainers, journalism).
   Read `src/styles/vox-editorial/STYLE.md` before using it.
7. **Build** — Edit `video.json`. Copy scene shapes from
   `src/templates/samples.ts`; the schema is `src/video/schema.ts`
   (JSON Schema in `schemas/video.schema.json`). Add `variants` for other
   formats/styles of the same content.
8. **Validate** — `npm run validate`. Fix every error it prints.
9. **Review** — `npm run stills -- <nnn>` renders one PNG per scene to
   `projects/<n>/review/<composition>/scene-XX-<Template>.png`. **Look at
   every still** (Read tool). Run the QA checklist below. Iterate 7–9.
10. **Render** — `npm run render -- <nnn>` → `projects/<n>/exports/<id>.mp4`.
    Only render the full video when the user wants output; stills are the
    fast loop.
11. **Deliver** — Optional: `npm run media -- web|gif|loudnorm <file>`.
    Report paths, duration, and anything you could not verify.

## QA checklist (every review round)

- [ ] Nothing important outside the safe area; no text clipped or overlapping.
- [ ] Headline ≥ 84 px and supporting text ≥ 44 px at 1080 short edge (templates enforce via `u()`).
- [ ] One emphasis per scene. Emphasis phrases exist verbatim in the text.
- [ ] Every number on screen is in `brief.md` → Sources, with a source. **Never invent statistics, quotes or attributions.**
- [ ] Scene reads in its duration (≈ 2.5 words/s + 1 s to settle).
- [ ] Vertical variant: nothing critical in the bottom 20% (platform UI).
- [ ] Assets used are licensed for the intended use (`research/licensing.md`).

## Assets

Put project assets in `public/projects/<n>/` and reference them without the
`public/` prefix: `"background": "projects/001-x/clip.mp4"`. Record each
asset's source + license in `brief.md`. Rendered media is git-ignored.

## Captions / voice-over

VO file → `npm run media -- wav16k vo.mp3` → transcribe with Whisper
(see `tools/captions/README.md`) → `Caption[]` JSON in `public/projects/<n>/`
→ `CaptionedShort` `captionsFile`, and/or top-level `audio`. For SRT:
`npm run captions:srt -- in.srt public/projects/<n>/captions.json`.

## When the templates are not enough

1. First try: different props, a different template, splitting a scene, a
   per-scene `theme` override.
2. One-off visual for a single project → a component in
   `projects/<n>/components/` registered as its own composition in
   `src/Root.tsx` (see `/remotion-markup` for patterns).
3. Anything you would build twice → promote it to a template:
   - schema in `src/templates/schemas.ts` (pure zod),
   - component `src/templates/<Name>.tsx` using `Stage`, `Reveal`,
     `Headline`, `Emphasis`, `useLayout().u()` and `useTheme()` — never
     hard-coded colours, fonts or pixel sizes,
   - register in `src/templates/index.tsx` and `src/video/schema.ts`,
   - add a sample in `src/templates/samples.ts`,
   - check it in both styles: `npm run render -- gallery-studio --stills --frames <n>`.
4. A new visual language → a new style pack in `src/styles/<name>/`
   (`tokens.ts` + `STYLE.md`), registered in `src/styles/names.ts` and
   `src/styles/index.tsx`.

## Hard rules

- Animations are driven by `useCurrentFrame()` only — no CSS transitions,
  no `Math.random()` (use Remotion's `random(seed)`).
- Don't copy code from third-party repos without checking
  `research/licensing.md`; Locomotion and the video-editor plugin have no
  license and are reference-only.
- `npm run check` (lint + typecheck + validate) must pass before committing.
- Don't commit renders (`exports/`, `review/`, `out/` are git-ignored).
