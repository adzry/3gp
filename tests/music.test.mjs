import assert from "node:assert/strict";
import { test } from "node:test";
import { musicEnvelope, voiceIntervals } from "../src/video/music.ts";
import { resolveTimeline } from "../src/video/timeline.ts";
import {
  MOODS,
  barSeconds,
  loopSeconds,
  synthesize,
  toWav,
} from "../tools/audio/synth.ts";
import { makeTranscript, makeVideo } from "./helpers.mjs";

const fps = 30;
const withMusic = (scenes, audio = {}, extra = {}) =>
  makeVideo(scenes, {
    audio: { src: "m.wav", volume: 1, fadeIn: 1, fadeOut: 2, ...audio },
    ...extra,
  });
const env = (video, transcript) =>
  musicEnvelope(video, resolveTimeline(video, transcript), transcript);
const close = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("no audio → silent envelope", () => {
  const v = makeVideo([{ seconds: 4 }]);
  assert.equal(env(v)(30), 0);
});

test("fades in from 0 and out to 0; full level in between", () => {
  const e = env(withMusic([{ seconds: 10 }])); // 300 frames
  close(e(0), 0);
  close(e(15), 0.5); // smoothstep midpoint of a 1s fade
  close(e(150), 1);
  close(e(270), 0.5); // 1s before the end of a 2s fade
  close(e(300), 0);
});

test("volume scales the whole envelope and results stay in 0–1", () => {
  const e = env(withMusic([{ seconds: 10 }], { volume: 0.3 }));
  close(e(150), 0.3);
  for (let f = -10; f < 320; f++) assert.ok(e(f) >= 0 && e(f) <= 1);
});

test("scene musicLevel glides to the new level at the cut", () => {
  const e = env(withMusic([{ seconds: 5 }, { seconds: 5, musicLevel: 0.5 }]));
  close(e(140), 1); // scene 1
  assert.ok(e(152) < 1 && e(152) > 0.5); // gliding (0.3s ramp from frame 150)
  close(e(200), 0.5);
});

test("voice intervals merge across short pauses only", () => {
  // words: 0.5–0.8, 0.9–1.2 (gap 0.1 → merged) … next segment after a 0.6s pause
  const t = makeTranscript([["a", "b"], ["c"]]);
  const iv = voiceIntervals(t, fps);
  assert.equal(iv.length, 1); // 1.2 → 1.8 gap is 0.6s = bridged
  const far = makeTranscript([["a"], ["b"]], {});
  far.segments[1].words[0].start = 5;
  far.segments[1].words[0].end = 5.3;
  far.segments[1].start = 5;
  far.segments[1].end = 5.3;
  far.duration = 6;
  assert.equal(voiceIntervals(far, fps).length, 2);
});

test("music ducks under the narration and recovers after it", () => {
  const t = makeTranscript([["one", "two", "three"]], { duration: 10 }); // voice 0.5s–1.6s
  const v = withMusic(
    [{ seconds: 10 }],
    { duckUnderVoice: 0.25, fadeIn: 0 },
    {
      voiceover: { src: "vo.wav", transcript: "t.json" },
    },
  );
  const e = env(v, t);
  close(e(30), 0.25); // 1.0s: talking
  close(e(150), 1); // 5.0s: silence again
  assert.ok(e(12) > 0.25 && e(12) < 1); // ramping down just before the first word
});

test("a muted voice-over (draft preview) does not duck the music", () => {
  const t = makeTranscript([["one", "two"]], { duration: 10 });
  const v = withMusic(
    [{ seconds: 10 }],
    { fadeIn: 0 },
    {
      voiceover: { src: "vo.wav", transcript: "t.json", mute: true },
    },
  );
  close(env(v, t)(30), 1);
});

test("synth: deterministic, whole bars, normalised, valid WAV", () => {
  const a = synthesize({
    seconds: 5,
    mood: "bright",
    seed: 7,
    sampleRate: 8000,
  });
  const b = synthesize({
    seconds: 5,
    mood: "bright",
    seed: 7,
    sampleRate: 8000,
  });
  assert.deepEqual(a.left, b.left);
  const c = synthesize({
    seconds: 5,
    mood: "bright",
    seed: 8,
    sampleRate: 8000,
  });
  assert.notDeepEqual(a.left, c.left);
  close(
    a.seconds / barSeconds("bright"),
    Math.round(a.seconds / barSeconds("bright")),
    1e-9,
  );
  assert.ok(a.seconds >= 5);
  let peak = 0;
  for (const x of a.left) peak = Math.max(peak, Math.abs(x));
  assert.ok(peak > 0.6 && peak <= 0.71, `peak ${peak}`);
  const wav = toWav(a.left, a.right, a.sampleRate);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt16LE(22), 2);
  assert.equal(wav.length, 44 + a.left.length * 4);
});

test("loopSeconds rounds up to whole bars for every mood", () => {
  for (const mood of Object.keys(MOODS)) {
    const s = loopSeconds(10, mood);
    assert.ok(s >= 10 && s < 10 + barSeconds(mood) + 1e-9);
  }
});
