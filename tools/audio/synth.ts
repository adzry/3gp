/**
 * A tiny deterministic music generator for background beds: a warm chord pad,
 * a soft bass pulse and a plucked arpeggio over a four-chord loop.
 *
 * Why: licence-clean music that 3gp owns outright (no stock-site terms), for
 * silent explainers and drafts. Same options + seed → identical samples.
 * It is intentionally simple — swap in a real, licensed track for hero videos.
 */

export type Mood = "calm" | "bright";

type MoodSpec = {
  bpm: number;
  /** MIDI notes per chord (one chord per bar). */
  chords: number[][];
  /** Chance an arpeggio eighth-note plays (0–1). */
  arpDensity: number;
};

export const MOODS: Record<Mood, MoodSpec> = {
  // Am – F – C – G
  calm: {
    bpm: 84,
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    arpDensity: 0.55,
  },
  // C – G – Am – F
  bright: {
    bpm: 104,
    chords: [
      [48, 52, 55],
      [55, 59, 62],
      [57, 60, 64],
      [53, 57, 60],
    ],
    arpDensity: 0.85,
  },
};

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** mulberry32 — small, fast, deterministic PRNG. */
const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const barSeconds = (mood: Mood) => (4 * 60) / MOODS[mood].bpm;

/** Length rounded UP to whole bars, so the bed loops cleanly. */
export const loopSeconds = (seconds: number, mood: Mood) =>
  Math.ceil(seconds / barSeconds(mood)) * barSeconds(mood);

export const synthesize = ({
  seconds,
  mood = "calm",
  seed = 1,
  sampleRate = 44100,
}: {
  seconds: number;
  mood?: Mood;
  seed?: number;
  sampleRate?: number;
}) => {
  const spec = MOODS[mood];
  const total = loopSeconds(seconds, mood);
  const n = Math.round(total * sampleRate);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const bar = barSeconds(mood);
  const beat = bar / 4;
  const bars = Math.round(total / bar);
  const random = rng(seed);
  const TAU = Math.PI * 2;

  // Add a tone with envelope env(tSeconds) starting at `start` for `len` seconds.
  const tone = (
    start: number,
    len: number,
    f: number,
    amp: number,
    pan: number,
    env: (t: number) => number,
    harmonic2 = 0,
  ) => {
    const s0 = Math.round(start * sampleRate);
    const s1 = Math.min(n, Math.round((start + len) * sampleRate));
    const gl = amp * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = amp * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let s = s0; s < s1; s++) {
      const t = (s - s0) / sampleRate;
      const v =
        (Math.sin(TAU * f * t) + harmonic2 * Math.sin(TAU * 2 * f * t)) *
        env(t);
      // wrap past the end → seamless loop
      const idx = s % n;
      L[idx] += v * gl;
      R[idx] += v * gr;
    }
  };

  for (let b = 0; b < bars; b++) {
    const chord = spec.chords[b % spec.chords.length];
    const t0 = b * bar;
    // Pad: two slightly detuned voices per note, slow attack, overlapping release.
    const padEnv = (t: number) =>
      Math.min(1, t / 1.2) * (t > bar ? Math.exp(-(t - bar) * 3) : 1);
    for (const m of chord) {
      tone(t0, bar + 1.2, freq(m) * 1.002, 0.05, -0.4, padEnv);
      tone(t0, bar + 1.2, freq(m) * 0.998, 0.05, 0.4, padEnv);
    }
    // Bass: root an octave down, soft pulse on every beat.
    for (let k = 0; k < 4; k++) {
      tone(
        t0 + k * beat,
        beat,
        freq(chord[0] - 12),
        0.11,
        0,
        (t) => Math.min(1, t / 0.02) * Math.exp(-t * 3),
        0.25,
      );
    }
    // Arpeggio: eighth notes from the chord, an octave up, seeded pattern.
    for (let k = 0; k < 8; k++) {
      if (random() > spec.arpDensity) continue;
      const m =
        chord[Math.floor(random() * chord.length)] +
        12 +
        (random() > 0.8 ? 12 : 0);
      tone(
        t0 + (k * beat) / 2,
        beat * 1.5,
        freq(m),
        0.045,
        k % 2 ? 0.5 : -0.5,
        (t) => Math.min(1, t / 0.005) * Math.exp(-t * 5),
        0.15,
      );
    }
  }

  // Gentle swell, soft saturation, normalise to −3 dBFS peak.
  let peak = 0;
  for (let s = 0; s < n; s++) {
    const t = s / sampleRate;
    const swell = 0.9 + 0.1 * Math.sin(TAU * 0.125 * t);
    L[s] = Math.tanh(L[s] * swell * 1.3);
    R[s] = Math.tanh(R[s] * swell * 1.3);
    peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s]));
  }
  const gain = peak > 0 ? 0.708 / peak : 1;
  for (let s = 0; s < n; s++) {
    L[s] *= gain;
    R[s] *= gain;
  }
  return { left: L, right: R, sampleRate, seconds: total };
};

/** 16-bit PCM stereo WAV. */
export const toWav = (
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
) => {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, left[i])) * 32767),
      44 + i * 4,
    );
    buf.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, right[i])) * 32767),
      46 + i * 4,
    );
  }
  return buf;
};
