# Brief — Einstein in your pocket

**Goal:** a creative benchmark for 3gp — a Vox-style explainer built almost
entirely from bespoke scenes on the open custom-scene architecture.
**Audience / channel:** curious general audience; YouTube 16:9, plus 9:16 and 1:1 cuts.
**Key message:** GPS turns *time* into *position* — and it only works because
engineers correct the satellites' clocks for relativity.
**Length:** ~80 s. **Style:** `orbit` (new style pack).

## Concept
The blue "you are here" dot is the protagonist. Everything is built from one
shape — the circle: the dot, signal wavefronts, orbits, distance spheres,
clock faces, error rings. Circles of time become circles of distance that
collapse into the dot; relativity makes an error ring grow; the tuned clock
collapses it again. The dot bookends the video.

## Narration
Scratch narration: synthesised offline with RHVoice (voice `bdl`, LGPL-2.1+),
word timing by forced alignment (pocketsphinx, BSD) — real audio, real
timings. Replace with a recorded voice: record the same `VO:` lines, drop in
`voiceover.wav`, `npm run align -- 005`; phrase-anchored scenes re-sync.

## Sources & facts
Verified 2026-09-29 via web search (primary/technical pages cited).

| On-screen / spoken claim | Source |
|---|---|
| GPS satellites orbit at ~20,200 km; six orbital planes, 55° inclination | GPS.gov, *Space Segment* (archive.gps.gov/systems/gps/space/) |
| "around thirty" satellites (31 operational; ≥24 maintained) | GPS.gov, *Space Segment* |
| Each satellite carries atomic clocks and broadcasts its time | GPS.gov *Space Segment*; R. Pogge, *Real-World Relativity: The GPS Navigation System* (Ohio State, astronomy.ohio-state.edu/pogge.1/Ast162/Unit5/gps.html) |
| Signal travels at the speed of light; delay × c = range | Pogge (Ohio State) |
| Position fix needs ≥4 satellites (3 position + receiver clock) | Pogge (Ohio State); GPS.gov |
| 1 µs of timing error ≈ 300 m (c = 299,792,458 m/s × 10⁻⁶ s = 299.8 m) | arithmetic from the defined speed of light |
| Speed (special relativity) slows satellite clocks ≈ 7 µs/day | Pogge (Ohio State); GPS World, *Inside the box: GPS and relativity* |
| Weaker gravity (general relativity) speeds them ≈ 45 µs/day | Pogge (Ohio State); GPS World |
| Net ≈ +38 µs/day | Pogge (Ohio State); NIST, *Putting Einstein to the Test* |
| Uncorrected, positions would drift ≈ 10 km/day | Pogge (Ohio State): "errors in global positions would continue to accumulate at a rate of about 10 kilometers each day" |
| Clocks set to 10.22999999543 MHz before launch (vs 10.23 MHz) so they tick at 10.23 MHz in orbit | IS-GPS interface specification, as quoted in GPS World *Inside the box* |
| Satellite speed ≈ 3.9 km/s (14,000 km/h) | Pogge (Ohio State) |

Schematic, labelled as such on screen: orbit diagram (not to scale),
trilateration geometry (drawn in 2D), city grid and drift path (illustrative).

## Assets
| File | Source | Licence |
|---|---|---|
| Map / globe | Natural Earth via world-atlas | Public domain |
| voiceover.wav | `npm run voice -- 005` (RHVoice `bdl`) | voice data LGPL-2.1+ (Debian `rhvoice-english` copyright) |
| music.generated.wav | `npm run music -- generate 005` | own (generated) |
| Fonts | Instrument Serif, Inter, JetBrains Mono (@fontsource) | SIL OFL 1.1 |
