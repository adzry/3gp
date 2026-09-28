# Recipes

A recipe is a **narrative structure** (the `.md`) plus a **starter scene list**
(`starters/<name>.json`) that `npm run new -- "Title" --recipe <name>` copies
into a new project. Recipes are defaults, not rules — reorder, cut or add beats.

| Recipe | Structure | Default format · style |
|---|---|---|
| [explainer](explainer.md) | Hook → Problem → Context → Evidence → Explanation → Solution → Payoff | 16:9 · studio |
| [documentary](documentary.md) | Cold open → Context → Character → Conflict → Evidence → Turning point → Resolution | 16:9 · vox-editorial |
| [product-launch](product-launch.md) | Problem → Reveal → Feature → Feature → Proof → Result → CTA | 16:9 · studio |
| [social-short](social-short.md) | Hook → Pattern interrupt → Value → Visual reinforcement → Payoff → CTA | 9:16 · studio |
| [vox-editorial](vox-editorial.md) | Question → Visual evidence → Annotation → Data → Explanation → Conclusion | 16:9 · vox-editorial |

## Rules that apply to every recipe

1. **VO-first.** Write the script, read it aloud (or record it), then set scene
   `seconds` to the spoken length. Animation serves the words.
2. **One idea per scene.** If a scene needs two sentences on screen, it is two scenes.
3. **No invented numbers.** Every on-screen figure is listed with its source in
   `brief.md`. Starters contain `REPLACE with a real source` on purpose.
4. **One emphasis per scene.** The highlighter loses meaning when everything is highlighted.
5. **Hold the ending.** Give the final scene at least 3–5 seconds.

Adding a recipe: write `<name>.md`, add `starters/<name>.json` (validated by
`src/video/schema.ts`), and list it above.
