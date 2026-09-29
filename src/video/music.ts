/**
 * Music-bed volume envelope: fades, ducking under the narration, and
 * per-scene levels — one pure function of the frame, so it is deterministic
 * and unit-tested. Used as the `volume` callback of the music <Audio>.
 *
 * volume(frame) = base × fade × duck × sceneLevel
 *
 * Pure, explicit .ts imports for Node.
 */
import type { VideoProps } from "./schema.ts";
import type { Timeline } from "./timeline.ts";
import { flattenWords, type Transcript } from "./transcript.ts";

/** Seconds a duck / level change takes to glide in or out. */
const RAMP_SECONDS = 0.3;
/** Pauses shorter than this don't un-duck the music (avoids pumping). */
const BRIDGE_SECONDS = 0.6;

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Merge spoken words into continuous "voice is talking" frame intervals. */
export const voiceIntervals = (
  transcript: Transcript,
  fps: number,
  offset = 0,
): [number, number][] => {
  const out: [number, number][] = [];
  for (const w of flattenWords(transcript)) {
    const a = (w.start + offset) * fps;
    const b = (w.end + offset) * fps;
    const last = out[out.length - 1];
    if (last && a - last[1] <= BRIDGE_SECONDS * fps)
      last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
};

export type MusicEnvelope = (frame: number) => number;

export const musicEnvelope = (
  video: VideoProps,
  timeline: Timeline,
  transcript?: Transcript | null,
): MusicEnvelope => {
  const audio = video.audio;
  if (!audio) return () => 0;
  const fps = timeline.fps;
  const total = timeline.durationInFrames;
  const base = audio.volume ?? 1;
  const fadeIn = (audio.fadeIn ?? 1) * fps;
  const fadeOut = (audio.fadeOut ?? 2) * fps;
  const duckTo = audio.duckUnderVoice ?? 0.35;
  const ramp = RAMP_SECONDS * fps;
  const voice =
    transcript && video.voiceover && !video.voiceover.mute
      ? voiceIntervals(transcript, fps, video.voiceover.offset ?? 0)
      : [];
  const levels = timeline.scenes.map((s) => ({
    from: s.startFrame,
    level: video.scenes[s.index].musicLevel ?? 1,
  }));

  return (frame: number) => {
    const fade = Math.min(
      fadeIn > 0 ? smooth(frame / fadeIn) : 1,
      fadeOut > 0 ? smooth((total - frame) / fadeOut) : 1,
    );

    // Duck: 1 → duckTo while the voice talks, gliding over `ramp` frames.
    let duck = 1;
    for (const [a, b] of voice) {
      if (frame < a - ramp || frame > b + ramp) continue;
      const inside =
        frame < a
          ? smooth((frame - (a - ramp)) / ramp)
          : frame > b
            ? smooth((b + ramp - frame) / ramp)
            : 1;
      duck = Math.min(duck, 1 - (1 - duckTo) * inside);
    }

    // Scene level: glide from the previous scene's level over `ramp` frames.
    let level = 1;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (frame >= levels[i].from) {
        const prev = i > 0 ? levels[i - 1].level : levels[i].level;
        const t = smooth((frame - levels[i].from) / ramp);
        level = prev + (levels[i].level - prev) * t;
        break;
      }
    }

    return Math.max(0, Math.min(1, base * fade * duck * level));
  };
};
