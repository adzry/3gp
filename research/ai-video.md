# AI video layer

**Status:** research register only. Nothing integrated. 3gp stays
model-agnostic: AI tools produce **assets** (clips, images, voice, music) that
enter a project like any other footage — through `public/projects/<n>/` and a
template prop — so no vendor assumption touches the core.

Evaluate tools **when a project needs them**, record the result here, and
re-check: this field changes monthly, so model names and terms are deliberately
not listed from memory.

## Capability checklist

| Capability | What to test | Notes |
|---|---|---|
| Text-to-video | Prompt adherence, motion quality, max length, resolution/fps | |
| Image-to-video | Fidelity to the first frame; camera vs subject motion | Best for animating stills/archival |
| Reference-to-video | Keeps a product/character/style from reference images | |
| Character consistency | Same person across shots | Check likeness rights |
| Camera control | Pan/tilt/dolly/orbit instructions honoured | |
| Scene extension | Continue a clip seamlessly | |
| Visual continuity | Lighting/colour match between generated shots | Grade in Remotion afterwards |
| Audio / dialogue / SFX | Native audio generation, lip-sync | Check voice-cloning consent |
| Voice-over (TTS) | Naturalness, word timestamps output | Timestamps feed captions directly |
| Music | Stems, loopability, licence of output | |

## Evaluation record template

```
### <Tool> — <date>
- Access: API / web / local; cost
- Output: max length, resolution, fps, format, alpha?
- Terms: commercial use of outputs? attribution? training-data or likeness restrictions? (link + date)
- Test prompt(s) and results (store clips outside git)
- Verdict: use for … / avoid because …
```

## Integration rules

1. Generated clips are assets: log prompt, tool, date and output terms in the
   project `brief.md`.
2. Prefer generating **plates** (backgrounds, B-roll) and keeping typography,
   data and captions in Remotion — text rendered by video models is unreliable
   and uneditable.
3. Keep generation scripts (if any) in `tools/ai/<vendor>.mjs` behind a
   common interface: `generate({ prompt, refs, seconds, aspect }) → file`.
   Add only when a second project needs the same tool.
4. Never present AI-generated footage of real people or events as real.
