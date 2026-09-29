# Recipe: Vox / editorial explainer

```
QUESTION → VISUAL EVIDENCE → ANNOTATION → DATA → EXPLANATION → CONCLUSION
```

**Use with:** the [`vox-editorial`](../src/styles/vox-editorial/STYLE.md) style.
Editorial explainers answer a question with evidence the viewer can see.

| Beat | Job | Typical treatment |
|---|---|---|
| Question | A genuine question, framed as a headline | TitleCard (kicker "Explained") |
| Visual evidence | Archival photo, document, map, footage | Custom: camera moves across the evidence (map pull-back, document zoom) — e.g. 004 `ThroatOfVenice`; or MapRoute / Footage / LowerThird with `background` |
| Annotation | Mark up the evidence — circle the detail | MetricCard `annotate: true` |
| Data | The pattern, with a hand-written note on the key bar | BarChart with `annotation` |
| Explanation | The mechanism, in plain words | Custom: annotated diagram built up beat by beat on the narration; or KineticText, one emphasis |
| Conclusion | The thesis, held 4–6 s | TitleCard |

**VO-first:** this style is audio-locked. Write VO, transcribe it (see
`tools/captions/README.md`), then time scene boundaries to the words.
**Evidence rule:** every number must exist in the narration and in `brief.md` sources.
