# Style pack: `studio`

> **Register: calm, modern screen.** Dark canvas, one mint accent, confident
> overdamped motion. The default for product, tech and social content.

Tokens: [`tokens.ts`](tokens.ts).

| Token | Hex | Use |
|---|---|---|
| `background` | `#0e0f13` | canvas |
| `surface` | `#1b1d24` | cards, lower-third panels |
| `text` | `#f4f3ee` | type |
| `muted` | `#8d909c` | supporting text, non-focus bars |
| `accent` | `#7ce0b8` | the one thing to look at |
| `positive` / `negative` | `#6fa8ff` / `#ff6b5e` | signals, hand annotation |

- **Type:** Inter 800 headlines (tight tracking, sentence case), Inter 400–700 body,
  JetBrains Mono for numbers, Caveat for rare hand notes.
- **Motion:** `rise` entrance (fade + 40 px travel) on an overdamped spring
  (damping 200 / stiffness 100) — settles without bounce. 4-frame stagger.
  Scene transitions are short cross-fades.
- **Emphasis:** colour shift to accent (no highlighter block).
- **Depth:** soft drop shadow on cards only.
- **Don't:** more than one accent element per scene; gradients as decoration.

Motion token values are informed by the MIT-licensed
[degueba/onda](https://github.com/degueba/onda) motion system (see `THIRD_PARTY_NOTICES.md`).
