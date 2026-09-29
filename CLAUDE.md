# 3gp — instructions for Claude

3gp is a Remotion video production **engine**: standardised production
infrastructure (video.json, timeline, voice-first timing, transcripts,
captions, music, validation, variants, stills, render) under an **open visual
layer**. Read `README.md` for the map.

## Creative priority
1. Visual storytelling and final video quality
2. Scene-specific creative direction
3. Professional motion design
4. Strong visual hierarchy and composition
5. Story/narration synchronisation
6. Reusability
7. Existing templates

For every scene ask **"what is the strongest visual treatment?"** — never
"which template fits?". Then pick: an existing template, existing primitives
composed together, an extended component, or a fully custom scene. Templates
are tools, not constraints: never downgrade a scene because a template exists.

## Making or editing a video
Use the `3gp-create-video` skill (`.claude/skills/3gp-create-video/SKILL.md`).
Short version: brief → script → per-scene treatment → `projects/<n>/video.json`
(template scenes and custom scenes side by side) → validate → look at review
stills in every format → render.

Custom scenes are first-class, not an escape hatch: `{ "custom": "Name", … }`
in video.json, component in `projects/<n>/scenes/`, and they get the same
timing, narration, captions, music, validation, variants, stills and render as
templates. Never register a one-off as its own composition in `src/Root.tsx`.

## Commands
- `npm run check` — lint + typecheck + tests + validate. Must pass before committing.
- `npm run transcribe -- <nnn>` / `npm run transcript -- <nnn>` — voice-over → word-timed transcript / listing. Never claim a transcription succeeded unless the command did; never hand-write transcript content.
- `npm run stills -- <nnn> [--frames a,b,c]` — review PNGs. Always look at them.
- `npm run render -- <nnn>` — final MP4s (only when output is wanted).
- `npm run studio` — interactive preview for the user.

## Code conventions
- Size everything with `useLayout().u(px)` (1080-px short-edge units) and lay
  out from `useLayout()` — variants (16:9 / 9:16 / 1:1) depend on it.
- Colours and fonts come from `useTheme()` by default. A custom scene may use
  its own art-directed palette when the story needs it — as named constants at
  the top of the file, never scattered literals.
- Animation is a pure function of `useCurrentFrame()`: no CSS transitions,
  no `Math.random()` (use `random(seed)` from remotion).
- Sync beats to narration with `useWordFrame(phrase, fallback)` /
  `useScene().words` (frames relative to the scene start), not hand-counted frames.
- Schemas stay pure zod (Node tools import them): `src/templates/schemas.ts`,
  `projects/<n>/scenes/schemas.ts`. `src/video/*.ts` pure modules and
  `src/styles/names.ts` use explicit `.ts` import extensions for the same reason.
- Use `@remotion/media` `<Audio>`/`<Video>`, not the legacy ones.
- Official Remotion skills (`/remotion-best-practices`, `/remotion-markup`,
  `/remotion-captions`, `/remotion-docs`) cover Remotion APIs — use them
  instead of guessing. Missing? `npm run skills`.

## Integrity
- Never put an invented statistic, quote or attribution on screen. Every
  number needs a source in the project's `brief.md`. Schematic visuals (a
  route drawn by hand, an illustrative diagram) say so on screen.
- Check and record the licence of every asset (`research/licensing.md`).
  Repos without a licence (Locomotion, video-editor-plugin) are reference-only.
- Don't commit renders or downloaded media; they are git-ignored.

## Growing the system
Custom scenes stay project-local (`projects/<n>/scenes/`). Promote one to
`src/scenes/` (or a template) only when a **second real video** needs it.
Visual language → style pack. Workflow → recipe. Repeated manual step → tool.
Update the README tables and `research/resources.md` when you add any of these.
