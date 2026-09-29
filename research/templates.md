# Template & component ecosystem — evaluation

Researched 2026-09-28 from the repositories themselves (shallow clones).
Quality gate applied to each: quality ↑, time saved, reusable, licence clear,
agent-compatible, worth the maintenance.

## Summary

| Source | Licence | Verdict | What 3gp took |
|---|---|---|---|
| remotion-dev/skills | Remotion License (monorepo) | **Install** (not vendor) | The agent workflow for low-level Remotion work; layout minimums (84 px headline / 44 px support at 1080 px) |
| remotion-video-templates (AleBrito) | MIT | Reference | Architecture: each template = component + Zod schema + defaults + `calculateMetadata`; content data + template = video |
| Onda | MIT | Adapted (values) | Closed motion vocabulary: overdamped springs, one stagger value, duration scale; "source you own" philosophy |
| vox-style-animation | MIT | Adapted (style) | Palette discipline, texture system, motion vocabulary, process laws → `vox-editorial` |
| Locomotion | **none** | Reference only | Nothing copied. Confirms demand for metric/chart/SaaS cards → MetricCard, BarChart |
| video-editor-plugin | **none** | Reference only | Pattern: a Claude skill that routes "edit existing footage" → FFmpeg vs "create motion" → Remotion |
| OpenVideo | MIT | Reference | JSON edit decision list readable by agents → `video.json` scene list |
| template-prompt-to-motion-graphics-saas | Remotion License | Not used | A Next.js SaaS that compiles LLM-generated Remotion code at runtime — the opposite of 3gp's "reuse vetted templates" approach |
| Official templates (audiogram, tiktok, music-visualization, three, overlay, code-hike, …) | Remotion License | Reference, per need | Start points when a project needs that capability |

## Notes per source

### remotion-video-templates
Seven templates, each exporting `Component`, `schema`, `defaultProps`,
`calculateMetadata`, registered in one `Root.tsx`. Shared `lib/` for springs,
fonts, colours, layout. 3gp keeps the idea but adds: a **scene list** layer
(`video.json`) so templates compose into full videos, **themes** so each
template renders in any style, and **resolution-independent units** so one
template serves 16:9 / 9:16 / 1:1.

### Onda
70 components + 18 transitions, installed as source via `npx ondajs add <name>`
(shadcn-style), each with Zod schema + README. Strong motion-token discipline
(`lib/motion.ts`). **Future option:** when a project needs e.g. `code-block`,
`device-frame`, `node-graph` or `browser-frame`, `npx ondajs add` it into
`src/components/onda/` (MIT — keep the header/notice) rather than rebuilding.
Not done now to avoid importing a parallel theme system.

### vox-style-animation
Built on HyperFrames (HTML + GSAP), not Remotion — so its code can't be
dropped in. The valuable part is the **written style recipe**: one meaning per
colour, printed-not-lit register, 12 fps stutter only on dot fields/pen
strokes, VO-first timing, evidence annotation, "motion explains, never
decorates". Also a method for capturing any style into a pack — the model
for future 3gp style packs.

### Locomotion
67 single-file templates, visually polished, React 19 + Remotion 4. No licence
file → cannot copy. Useful as a visual quality bar for SaaS/metric content.

### video-editor-plugin
19 slash commands (trim, compress, merge, resize, stabilize, captions, title
cards…) over FFmpeg + Remotion + Whisper. Hard-codes macOS/Homebrew and
`h264_videotoolbox`. 3gp's equivalent is deliberately smaller (`tools/media`)
and uses Remotion's bundled FFmpeg for portability.

### OpenVideo
Main track = ordered array of clips (seconds, fractional positions), overlays
as separate tracks, JSON-pointer validation errors so agents self-correct.
**Decision:** 3gp adopts the principle (one JSON document per video,
validated, agent-editable) but for *motion-graphics scenes*, not a footage
timeline. If 3gp starts cutting real footage, extend `video.json` with a
`clip` template (source, trimStart, duration) before inventing a separate EDL.

## Initial 3gp template library

TitleCard · KineticText · LowerThird · QuoteCard · MetricCard · BarChart ·
CaptionedShort · LogoReveal. "Product promo" is a **recipe** composed from
these (`recipes/product-launch.md`), not a monolithic template.

Added since: `Footage` (trim, focus-crop, zoom/pan), `LineChart`,
`Comparison`, `EndCard`. Remaining candidates: `MapRoute` (via
`/remotion-maps`), `Audiogram`.
