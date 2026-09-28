# Style pack: `vox-editorial`

> **Register: printed, not lit.** Ink on cream paper. Depth from hard offset
> shadows and cut-out edges, texture from halftone and grain. Nothing glows.

A style *recipe* for editorial explainers in the tradition of Vox-style motion
journalism. It encodes principles, not anyone's brand: no logos, no
proprietary assets, no copied footage. Tokens: [`tokens.ts`](tokens.ts).

Adapted from the MIT-licensed [Cele-san/vox-style-animation](https://github.com/Cele-san/vox-style-animation)
pack (built for HyperFrames/GSAP), re-implemented for Remotion. See
`THIRD_PARTY_NOTICES.md`.

## Colour — five hues, one job each

| Token | Hex | Meaning | Use |
|---|---|---|---|
| `background` paper | `#f2ecdf` | the page | every scene |
| `text` ink | `#161513` | structure, the narrator | type, outlines, most bars |
| `accent` highlighter | `#ffd200` | **the** key word/value | one per scene |
| `negative` signal red | `#e5483f` | old world, cost, friction; the pen | strike-throughs, hand annotation |
| `positive` cobalt | `#2f5fe8` | the new thing that replaces the old | new-era nodes, flow lines |

- Red and cobalt never share a beat — except the one "turn" scene where old
  meets new (that collision *is* the story).
- Never change text colour for emphasis; the highlighter block is the device.
- Paper never goes dark. A "collapse" darkens via red, not black.

## Type

| Role | Font | Rules |
|---|---|---|
| Headline / kinetic | Archivo Black | uppercase, line-height 0.98, flat ink, scale & slam |
| Labels, body, data | Inter 500/700 | sentence case |
| Numbers | JetBrains Mono (bars), Archivo Black (hero metrics) | tabular |
| Margin notes | Caveat 700 | ≤ 2 per video, always red "pen" |

All fonts are SIL OFL 1.1 via `@fontsource` (bundled, offline).

## Texture & depth

- Paper grain + print-edge vignette on every scene (`PaperTexture`, pure CSS).
- Halftone dot field as section texture (`DotField`), panned in 12 fps steps.
- Shadows: `10px 12px 0 rgba(22,21,19,.16)` — hard offset, never blur.
- **Editorial imperfection:** cards settle 0.4–0.8° off-axis (`tilt: 0.6`).
  Over-polish reads as advertising.
- Photos: pre-process to halftone/duotone cutouts *before* they enter the
  project (no runtime filters) so renders stay deterministic.

## Motion vocabulary

| Move | 3gp implementation | Recipe |
|---|---|---|
| Paper slap-in | `Reveal` (entrance `slap`) | scale 1.15→1, rotation settles crooked, springy but no rubber |
| Highlighter swipe | `Emphasis` | accent block scaleX 0→1 from left, 0.45 s ease-out |
| Strike-through | `Emphasis kind="strike"` | red bar at −2.5°, scaleX 0→1 |
| Pen circle | `HandCircle` | rough loop drawn at 12 fps steps (`strokeFps`) |
| Sheet-wipe | `SceneShell` (transition `sheet-wipe`) | the *only* scene transition; paper sheet sweeps off, ~0.4 s ease-in |
| Count-up | `CountUp` | ease-out cubic, tabular numerals |
| Word-by-word | `WordReveal` | 4-frame stagger, keyed to VO when available |

**The 12 fps stutter lives only on dot fields and pen strokes.** On hero type
it reads robotic.

## Layout & composition

- Left-aligned headlines by default; centre only for kinetic one-liners.
- One focal element per scene; everything else is ink or muted.
- Source line bottom-left, 26 px muted, on every data scene.

## Captions

Display font, uppercase, ink on paper; the active word gets the yellow
highlighter block. No drop shadows.

## Pacing (VO-first)

1. Write VO → record → transcribe (word timestamps).
2. Scene boundaries follow sentence boundaries; the key word's emphasis lands
   on its spoken onset.
3. Build against provisional timings (≈ 2.5 words/s), then re-time to real VO.
4. Hold the outro 4–6 s: thesis line + quiet drift.

## Evidence rules

- Annotate real evidence (circle the number on the exhibit), not only your own headlines.
- Every on-screen number exists in the narration and in `brief.md` sources.

## Don't

- Chrome gradients, glows, perspective grids, lens flares.
- More than one highlighter per scene.
- Invented statistics or quotes.
- `Math.random()` — use `random(seed)` so every render is identical.
