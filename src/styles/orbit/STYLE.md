# Style pack: `orbit`

> **Register: a night instrument.** Precise, quiet, luminous. Science
> explainers where the subject is invisible (signals, time, orbits) and the
> graphics have to *be* the instrument that shows it.

Tokens: [`tokens.ts`](tokens.ts). First used by project 005.

## Colour — one job each

| Token | Hex | Meaning |
|---|---|---|
| `background` night | `#0a0f1e` | space, the page |
| `surface` | `#141b31` | land, panels |
| `text` cream | `#f2ede3` | type, primary geometry |
| `muted` | `#8790a8` | secondary lines, labels, sources |
| `accent` amber | `#ffb547` | **time**: clocks, signals, the spoken caption word |
| `positive` GPS blue | `#4ea8ff` | **position**: the "you are here" dot and what locates it |
| `negative` red | `#ff5a4f` | **error**: drift, uncertainty |

Amber and blue are the story (time becomes position). Red appears only when
something is wrong.

## Type

| Role | Font |
|---|---|
| Editorial headlines, one idea per line | Instrument Serif 400 (italic for the key word) |
| Body, labels, captions | Inter 500/700, sentence case |
| Numbers, readouts | JetBrains Mono 500, tabular |

All SIL OFL 1.1 via `@fontsource`.

## Shape & motion

- Everything is circles and hairlines: dot, wavefronts, orbits, spheres,
  clock faces, error rings. 1.5–2 px strokes at 1080; never heavy.
- Motion eases out (cubic/expo), holds on the beat, never bounces.
- Camera: scale transitions and slow pushes; depth from starfield parallax.
- Cuts: match cuts on the dot/circle, hard cuts on narration beats; the
  pack's default `fade` is a fallback, not the language.
