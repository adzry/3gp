---
name: 3gp-create-video
description: Produce a video inside the 3gp lab — brief, script, per-scene creative direction (templates or bespoke custom scenes), video.json, voice-over transcription and voice-driven scene timing, review stills, render, QA and export. Use whenever the user asks to make, draft, edit, restyle or render a video, explainer, short, promo, title sequence or motion graphic in this repository, or provides a voice-over / narration to build a video around.
---

# 3gp: create a video

3gp is a Remotion-based production **engine**. A video is
`projects/<n>/video.json`: a list of scenes, each drawn either by a **template**
(`"template": "MetricCard"`) or by a **custom scene** written for this video
(`"custom": "ThroatOfVenice"`). Both get the same infrastructure: timing
(seconds or voice), narration context, captions, music + ducking, validation,
format variants, stills and render.

**Creative priority:** visual storytelling and final quality › scene-specific
direction › motion design › hierarchy and composition › narration sync ›
reusability › existing templates. For every scene ask *"what is the strongest
visual treatment?"* — not *"which template fits?"*. Templates are tools, not
constraints; never downgrade a scene because a template exists.

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
5. **Creative direction** — `storyboard.md`: one row per scene → the visual
   idea (what the viewer should *see* to understand it), the treatment, the motion,
   and the narration beat it lands on. Then choose how to build it — see
   **Choosing the treatment** below. A good explainer usually mixes a few
   bespoke hero scenes with template scenes for the connective tissue.
6. **Style** ⏸ — `studio` (clean dark: product, tech, social) or
   `vox-editorial` (paper, highlighter, annotation: explainers, journalism).
   Read `src/styles/vox-editorial/STYLE.md` before using it.
7. **Build** — Edit `video.json`. Template scene shapes are in
   `src/templates/samples.ts`; custom scenes are built as below. The schema is
   `src/video/schema.ts` (JSON Schema in `schemas/video.schema.json`). Add
   `variants` for other formats/styles of the same content.
8. **Validate** — `npm run validate`. Fix every error it prints.
9. **Review** — `npm run stills -- <nnn>` renders one PNG per scene to
   `projects/<n>/review/<composition>/scene-XX-<Template|CustomName>.png`.
   **Look at every still** (Read tool), in every variant. For a scene with
   real motion (camera moves, beats), also render its key moments:
   `npm run stills -- <nnn> --frames a,b,c`. Run the QA checklist below.
   Iterate 7–9.
10. **Render** — `npm run render -- <nnn>` → `projects/<n>/exports/<id>.mp4`.
    Only render the full video when the user wants output; stills are the
    fast loop.
11. **Deliver** — Optional: `npm run media -- web|gif|loudnorm <file>`.
    Report paths, duration, and anything you could not verify.

## When the user provides a voice-over (voice-first)

The narration sets the timing. Do this instead of guessing `seconds`:

1. **Inspect the audio** — `npm run media -- probe <file>`: duration, has an
   audio stream. Put it at `public/projects/<n>/voiceover.<ext>` and add
   `voiceover: { src, transcript }` to `video.json` (plus `captions: {}` if
   captions are wanted).
2. **Transcribe** — `npm run transcribe -- <nnn>` (local whisper.cpp; first
   run builds it). If it fails (model can't download, build tools missing),
   **stop and report the exact error and the setup step** from
   `tools/captions/README.md`. Never write a transcript by hand to "fill in",
   and never say transcription worked unless the command succeeded.
3. **Read the transcript** — `npm run transcript -- <nnn>` lists every word
   with its index and time. Proof-read names/numbers against the script;
   fix misheard words in `transcript.json` text only (keep timings) and tell
   the user what you changed.
4. **Design scenes around the narration** — one scene per thought (or one
   custom scene carrying several lines under one continuous camera move).
   Anchor each with `"timing": { "phrase": "<first words of the line>" }`
   (robust to re-recording), or `words`/`segments` ranges. Inside a custom
   scene, land beats on words with `useWordFrame("<phrase>", fallback)`.
   Numbers on screen only when actually said and sourced.
   Set `"captions": false` on scenes that already show the spoken words.
5. **Validate** — `npm run validate`; fix out-of-order anchors, missing
   phrases, overruns. `npm run transcript -- <nnn>` shows which words each
   scene got — check every scene covers the right line.
6. **Stills + QA** — `npm run stills -- <nnn>`; also check highlight timing on
   specific words: compute `frame = round(word.start × fps)` and render
   `npm run stills -- <nnn> --frames a,b,c`, then confirm the lit word.
7. **Render** — `npm run render -- <nnn>`.

No recording yet? Write `VO:` lines in `script.md`, run
`npm run transcript -- draft <nnn>` and preview with `--draft`. Say clearly
that the timing is estimated, not from real audio.

Do **not** invent transcript content, facts, or quotes.

## QA checklist (every review round)

- [ ] Each scene has a visual idea, not just text on a card: would a viewer with the sound off understand the point?
- [ ] One focal point per beat; the eye knows where to go (size, contrast, motion).
- [ ] Motion has a purpose (reveals, compares, connects) and lands on the narration beat; nothing moves just to move.
- [ ] Scene-to-scene flow: cuts/transitions feel intentional (`transition: "none"` scenes animate their own in/out).
- [ ] Nothing important outside the safe area; no text clipped or overlapping.
- [ ] Headline ≥ 84 px and supporting text ≥ 44 px at 1080 short edge (sized with `u()`).
- [ ] Custom scenes checked in **every** variant (16:9, 9:16, 1:1) — they own their layout.
- [ ] One emphasis per scene. Emphasis phrases exist verbatim in the text.
- [ ] Every number on screen is in `brief.md` → Sources, with a source. **Never invent statistics, quotes or attributions.**
- [ ] Scene reads in its duration (≈ 2.5 words/s + 1 s to settle).
- [ ] Vertical variant: nothing critical in the bottom 20% (platform UI).
- [ ] Voice-first: each scene's words (`npm run transcript`) match its visuals; captions never cover key on-screen text; no caption page mixes two sentences.
- [ ] Footage: the subject survives the crop in every format (`focus`, `zoom`); `credit` set when the licence needs attribution.
- [ ] Assets used are licensed for the intended use (`research/licensing.md`).

## Assets

Put project assets in `public/projects/<n>/` and reference them without the
`public/` prefix: `"background": "projects/001-x/clip.mp4"`. Record each
asset's source + license in `brief.md`. Rendered media is git-ignored.

## Captions, music

- Voice-over captions: top-level `captions` (from the transcript) — see above.
- SRT only: `npm run captions:srt -- in.srt public/projects/<n>/captions.json`
  → `CaptionedShort.captionsFile` (cue-level, not word-level).
- Music bed: top-level `audio: { src, volume, fadeIn, fadeOut, loop, duckUnderVoice }`.
  No licensed track? `npm run music -- generate <nnn> [--mood calm|bright]`
  (3gp's own synth, licence-clean). With a voice-over, keep `volume` ~0.25–0.4;
  it ducks automatically while the narrator speaks. `musicLevel` on a scene
  lowers it there. Only use outside tracks with a verified licence.

## Choosing the treatment

Decide per scene, strongest result first:

1. **An existing template** — when it genuinely is the best treatment
   (a clean metric, a lower third, an end card). `README.md` → *Templates*.
2. **Composed primitives** — a custom scene built from `Stage`, `Reveal`,
   `WordReveal`/`splitWithPhrases`, `Emphasis`, `HandCircle`, `CountUp`,
   `Media`, `src/lib/world.ts` maps, `placeLabels`…
3. **An extended component** — add a prop to a template when the change is
   generally useful, not to force one scene into it.
4. **A fully custom scene** — bespoke composition, camera moves, diagrams,
   visual metaphors, hybrid footage + graphics. Explicitly encouraged.

### Building a custom scene

1. `projects/<n>/scenes/schemas.ts` — pure zod (Node validates with it):
   ```ts
   import { z } from "zod";
   export const SCENE_SCHEMAS = {
     ThroatOfVenice: z.object({ quote: z.string(), /* … */ }),
   };
   ```
2. `projects/<n>/scenes/ThroatOfVenice.tsx` — the component. Props are the
   schema's parsed output (`z.output<(typeof SCENE_SCHEMAS)["ThroatOfVenice"]>`).
3. `projects/<n>/scenes/index.ts`:
   ```ts
   import { defineScenes } from "../../../src/video/custom-scenes";
   import { SCENE_SCHEMAS } from "./schemas";
   import { ThroatOfVenice } from "./ThroatOfVenice";
   export const SCENES = defineScenes(SCENE_SCHEMAS, { ThroatOfVenice });
   ```
   (Typecheck fails if a schema has no component or vice versa.)
4. Register it once in `projects/index.ts`: `{ video: p004, scenes: s004 }`.
5. Use it in `video.json` like any scene:
   ```json
   { "custom": "ThroatOfVenice", "timing": { "phrase": "Seorang pengembara" },
     "transition": "none", "props": { "quote": "…" } }
   ```

Inside the component, the infrastructure is available as hooks:
- `useScene()` → `{ index, durationInFrames, words, draft }` — `words` is the
  narration spoken in this scene, frames relative to the scene start.
- `useWordFrame(phrase, fallback)` — the frame where a phrase is spoken in
  this scene; `fallback` when there's no narration (a silent cut still works).
- `useLayout()` (`u()`, `safe`, `isVertical`), `useTheme()`, `useStrings()`.
- `transition: "none"` in video.json hands the entrance/exit to the scene;
  otherwise the style pack's cut (fade / sheet wipe) wraps it.
- Media paths in custom props (`"projects/004-x/clip.mp4"`) are found and
  checked by `npm run validate` like template media.

Custom scenes stay in their project. Promote one to `src/scenes/` (or a
template, with schema + sample + gallery check) only when a **second real
video** needs it — then import it into each project's `scenes/index.ts`.

A new visual language → a style pack in `src/styles/<name>/`
(`tokens.ts` + `STYLE.md`), registered in `src/styles/names.ts` and
`src/styles/index.tsx`.

## Hard rules

- Animations are driven by `useCurrentFrame()` only — no CSS transitions,
  no `Math.random()` (use Remotion's `random(seed)`).
- Every scene — template or custom — lives in `video.json`. Never render a
  one-off as a separate composition: it would lose timing, narration,
  captions, music, validation and variants.
- Don't copy code from third-party repos without checking
  `research/licensing.md`; Locomotion and the video-editor plugin have no
  license and are reference-only.
- `npm run check` (lint + typecheck + tests + validate) must pass before committing.
- Don't commit renders (`exports/`, `review/`, `out/` are git-ignored).
