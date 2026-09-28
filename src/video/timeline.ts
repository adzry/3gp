/**
 * Timeline resolution: turns a video's scene list into exact frame ranges.
 *
 * Scenes are timed either by `seconds` (fixed length) or by `timing` (anchored
 * to the voice-over transcript, or to explicit seconds). Rules:
 *
 *  - Scenes are contiguous (no gaps, no overlaps) — they play back to back.
 *  - A voice-timed scene STARTS at its anchor and runs until the next scene
 *    starts. The first scene always starts at frame 0 (it absorbs any
 *    pre-roll before the first word).
 *  - A `seconds` scene starts when the previous one ends. If the next scene is
 *    voice-timed, the seconds scene is held until that anchor; if it would run
 *    past it, that is an error.
 *  - The last scene ends at its natural end: seconds → start + seconds;
 *    voice-timed → last anchored word + `voiceover.tail`.
 *
 * Transcript times are shifted by `voiceover.offset`; `{from, to}` timings
 * are already on the video timeline.
 *
 * Pure and deterministic: the renderer, `npm run validate` and
 * `npm run stills` all call this same function.
 */
import type { SceneTiming, VideoProps } from "./schema.ts";
import {
  findPhrase,
  flattenWords,
  secondsToFrame,
  type FlatWord,
  type Transcript,
} from "./transcript.ts";

export type ResolvedScene = {
  index: number;
  startFrame: number;
  durationInFrames: number;
  /** Transcript word indices spoken during this scene, or null. */
  words: [number, number] | null;
};

export type Timeline = {
  fps: number;
  durationInFrames: number;
  scenes: ResolvedScene[];
  errors: string[];
  warnings: string[];
};

type Anchor =
  | { kind: "seconds"; frames: number }
  | {
      kind: "timed";
      start: number;
      end: number | null;
      firstWord: number | null;
    };

const fmt = (frames: number, fps: number) => `${(frames / fps).toFixed(2)}s`;

export const resolveTimeline = (
  video: VideoProps,
  transcript?: Transcript | null,
): Timeline => {
  const fps = video.fps ?? 30;
  const errors: string[] = [];
  const warnings: string[] = [];
  const offset = video.voiceover?.offset ?? 0;
  const tail = video.voiceover?.tail ?? 1;
  const words: FlatWord[] = transcript ? flattenWords(transcript) : [];
  const segments = transcript?.segments ?? [];
  const at = (s: number) => secondsToFrame(s + offset, fps);

  // 1. Anchor every scene.
  let phraseCursor = 0;
  const anchors: Anchor[] = video.scenes.map((scene, i) => {
    const where = `scenes.${i}${scene.name ? ` ("${scene.name}")` : ""}`;
    const timing: SceneTiming | undefined = scene.timing;
    if (timing && scene.seconds !== undefined) {
      errors.push(`${where}: has both "seconds" and "timing" — use one`);
    }
    if (!timing) {
      if (scene.seconds === undefined) {
        errors.push(`${where}: needs "seconds" or "timing"`);
        return { kind: "seconds", frames: fps };
      }
      return {
        kind: "seconds",
        frames: Math.max(1, secondsToFrame(scene.seconds, fps)),
      };
    }
    if ("from" in timing) {
      if (timing.to <= timing.from)
        errors.push(
          `${where}: timing.to (${timing.to}) must be after timing.from (${timing.from})`,
        );
      return {
        kind: "timed",
        start: secondsToFrame(timing.from, fps),
        end: secondsToFrame(timing.to, fps),
        firstWord: null,
      };
    }
    if (!transcript) {
      errors.push(
        `${where}: voice timing needs a transcript (set "voiceover" and run \`npm run transcribe\`)`,
      );
      return { kind: "seconds", frames: fps };
    }
    if ("words" in timing) {
      const [a, b] = timing.words;
      if (a > b)
        errors.push(
          `${where}: timing.words [${a}, ${b}] — start index is after end index`,
        );
      if (b >= words.length) {
        errors.push(
          `${where}: timing.words [${a}, ${b}] is outside the transcript (words 0–${words.length - 1})`,
        );
        return { kind: "seconds", frames: fps };
      }
      phraseCursor = a + 1;
      return {
        kind: "timed",
        start: at(words[a].start),
        end: at(words[b].end),
        firstWord: a,
      };
    }
    if ("segments" in timing) {
      const [a, b] = timing.segments;
      if (a > b)
        errors.push(
          `${where}: timing.segments [${a}, ${b}] — start index is after end index`,
        );
      if (b >= segments.length) {
        errors.push(
          `${where}: timing.segments [${a}, ${b}] is outside the transcript (segments 0–${segments.length - 1})`,
        );
        return { kind: "seconds", frames: fps };
      }
      const firstWord = words.find((w) => w.segment === a)?.index ?? null;
      if (firstWord !== null) phraseCursor = firstWord + 1;
      return {
        kind: "timed",
        start: at(segments[a].start),
        end: at(segments[b].end),
        firstWord,
      };
    }
    // phrase
    const hit = findPhrase(words, timing.phrase, phraseCursor);
    if (!hit) {
      errors.push(
        `${where}: phrase "${timing.phrase}" not found in the transcript after word #${phraseCursor}`,
      );
      return { kind: "seconds", frames: fps };
    }
    phraseCursor = hit[0] + 1;
    let end: number | null = null;
    if (timing.through) {
      const through = findPhrase(words, timing.through, hit[0]);
      if (!through) {
        errors.push(
          `${where}: "through" phrase "${timing.through}" not found after "${timing.phrase}"`,
        );
      } else {
        end = at(words[through[1]].end);
      }
    }
    return {
      kind: "timed",
      start: at(words[hit[0]].start),
      end,
      firstWord: hit[0],
    };
  });

  // 2. Lay scenes end to end.
  const n = anchors.length;
  const starts: number[] = [];
  const naturalEnd = (i: number): number | null => {
    const a = anchors[i];
    if (a.kind === "seconds") return starts[i] + a.frames;
    if (a.end !== null) return a.end;
    // Phrase without `through`: runs to the next scene, or to the last word.
    if (i === n - 1 && words.length) return at(words[words.length - 1].end);
    return null;
  };
  for (let i = 0; i < n; i++) {
    const a = anchors[i];
    if (i === 0) starts.push(0);
    else if (a.kind === "timed") starts.push(a.start);
    else {
      const prevEnd = naturalEnd(i - 1);
      if (prevEnd === null) {
        errors.push(
          `scenes.${i - 1}: phrase timing without "through" can't be followed by a "seconds" scene — add "through"`,
        );
      }
      starts.push(prevEnd ?? starts[i - 1] + fps);
    }
  }

  const scenes: ResolvedScene[] = [];
  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1;
    let end: number;
    if (!isLast) {
      end = starts[i + 1];
      const a = anchors[i];
      if (
        a.kind === "seconds" &&
        anchors[i + 1].kind === "timed" &&
        starts[i] + a.frames > end
      ) {
        errors.push(
          `scenes.${i}: runs to ${fmt(starts[i] + a.frames, fps)} but scenes.${i + 1}'s narration starts at ${fmt(end, fps)} — shorten it or increase voiceover.offset`,
        );
      }
    } else {
      const a = anchors[i];
      end =
        (naturalEnd(i) ?? starts[i] + fps) +
        (a.kind === "timed" && a.firstWord !== null
          ? secondsToFrame(tail, fps)
          : 0);
    }
    const duration = end - starts[i];
    if (duration <= 0) {
      errors.push(
        `scenes.${i}: has no time — it starts at ${fmt(starts[i], fps)} but the next scene starts at ${fmt(end, fps)}. Voice anchors must be in spoken order.`,
      );
    }
    scenes.push({
      index: i,
      startFrame: starts[i],
      durationInFrames: Math.max(1, duration),
      words: null,
    });
  }

  // 3. Which words fall in each scene (for captions, QA listings, emphasis).
  for (const scene of scenes) {
    const inScene = words.filter((w) => {
      const f = at(w.start);
      return (
        f >= scene.startFrame && f < scene.startFrame + scene.durationInFrames
      );
    });
    scene.words = inScene.length
      ? [inScene[0].index, inScene[inScene.length - 1].index]
      : null;
  }

  const durationInFrames = scenes.length
    ? scenes[n - 1].startFrame + scenes[n - 1].durationInFrames
    : 1;

  if (transcript && video.voiceover) {
    const voiceEnd = at(transcript.duration);
    const lastWordEnd = words.length ? at(words[words.length - 1].end) : 0;
    if (lastWordEnd > durationInFrames) {
      errors.push(
        `the video ends at ${fmt(durationInFrames, fps)} but narration continues to ${fmt(lastWordEnd, fps)} — extend the last scene`,
      );
    } else if (voiceEnd > durationInFrames) {
      warnings.push(
        `the voice-over file runs to ${fmt(voiceEnd, fps)}; the video ends at ${fmt(durationInFrames, fps)} (trailing audio is cut)`,
      );
    }
    if (transcript.engine.name === "draft") {
      warnings.push(
        "using a DRAFT transcript (timing estimated from the script, not from recorded audio)",
      );
    }
  }

  return { fps, durationInFrames, scenes, errors, warnings };
};

/** Throw if the timeline has errors (renderer entry point). */
export const resolveTimelineOrThrow = (
  video: VideoProps,
  transcript?: Transcript | null,
) => {
  const t = resolveTimeline(video, transcript);
  if (t.errors.length)
    throw new Error(
      `Invalid timing in "${video.id}":\n` +
        t.errors.map((e) => `  ${e}`).join("\n"),
    );
  return t;
};
