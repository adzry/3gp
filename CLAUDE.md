# 3gp — instructions for Claude

3gp is a Remotion video production lab. Read `README.md` for the map.

## Making or editing a video
Use the `3gp-create-video` skill (`.claude/skills/3gp-create-video/SKILL.md`).
Short version: videos are data (`projects/<n>/video.json`) → validate → look at
review stills → render. Prefer changing data over writing animation code.

## Commands
- `npm run check` — lint + typecheck + validate. Must pass before committing.
- `npm run stills -- <nnn>` — review PNGs per scene. Always look at them.
- `npm run render -- <nnn>` — final MP4s (only when output is wanted).
- `npm run studio` — interactive preview for the user.

## Code conventions
- Size everything with `useLayout().u(px)` (1080-px short-edge units); colours,
  fonts and motion come from `useTheme()`. No hard-coded pixels/colours in templates.
- Animation is a pure function of `useCurrentFrame()`: no CSS transitions,
  no `Math.random()` (use `random(seed)` from remotion).
- Template schemas live in `src/templates/schemas.ts` and must stay pure zod
  (Node tools import them). `src/video/schema.ts` and `src/styles/names.ts`
  use explicit `.ts` import extensions for the same reason.
- Use `@remotion/media` `<Audio>`/`<Video>`, not the legacy ones.
- Official Remotion skills (`/remotion-best-practices`, `/remotion-markup`,
  `/remotion-captions`, `/remotion-docs`) cover Remotion APIs — use them
  instead of guessing. Missing? `npm run skills`.

## Integrity
- Never put an invented statistic, quote or attribution on screen. Every
  number needs a source in the project's `brief.md`.
- Check and record the licence of every asset (`research/licensing.md`).
  Repos without a licence (Locomotion, video-editor-plugin) are reference-only.
- Don't commit renders or downloaded media; they are git-ignored.

## Growing the system
Reusable animation → component/template. Visual language → style pack.
Workflow → recipe. Repeated manual step → tool. Update the README tables and
`research/resources.md` when you add any of these.
