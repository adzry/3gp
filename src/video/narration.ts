/**
 * Narration seen from inside one scene: the words spoken during it, with
 * frames relative to the scene's first frame. Pure (Node tools/tests import it).
 */
import type { Timeline } from "./timeline.ts";
import {
  findPhrase,
  flattenWords,
  secondsToFrame,
  type Transcript,
} from "./transcript.ts";

export type SceneWord = {
  /** Index in the whole transcript (as `npm run transcript` lists it). */
  index: number;
  text: string;
  /** Frames relative to the scene start. */
  startFrame: number;
  endFrame: number;
};

export const sceneWords = (
  timeline: Timeline,
  sceneIndex: number,
  transcript: Transcript | null | undefined,
  offsetSeconds = 0,
): SceneWord[] => {
  const scene = timeline.scenes[sceneIndex];
  if (!transcript || !scene?.words) return [];
  const [a, b] = scene.words;
  const at = (s: number) =>
    secondsToFrame(s + offsetSeconds, timeline.fps) - scene.startFrame;
  return flattenWords(transcript)
    .slice(a, b + 1)
    .map((w) => ({
      index: w.index,
      text: w.word.trim(),
      startFrame: at(w.start),
      endFrame: at(w.end),
    }));
};

/** Where `phrase` is spoken in these words (case/punctuation-insensitive), or null. */
export const findWordFrames = (
  words: SceneWord[],
  phrase: string,
): { start: number; end: number } | null => {
  const hit = findPhrase(
    words.map((w) => ({ word: w.text })),
    phrase,
  );
  return hit ? { start: words[hit[0]].startFrame, end: words[hit[1]].endFrame } : null;
};
