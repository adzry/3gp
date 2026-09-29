import { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";
import { findWordFrames, type SceneWord } from "./narration";

export type SceneInfo = {
  index: number;
  durationInFrames: number;
  /** Narration spoken during this scene; frames relative to the scene start. */
  words: SceneWord[];
  /** True when the words come from a DRAFT transcript (estimated timing). */
  draft: boolean;
};

export const SceneContext = createContext<SceneInfo | null>(null);

/** The current scene (works standalone too: the whole composition, no words). */
export const useScene = (): SceneInfo => {
  const ctx = useContext(SceneContext);
  const { durationInFrames } = useVideoConfig();
  return ctx ?? { index: 0, durationInFrames, words: [], draft: false };
};

/** Duration of the current scene (templates may be used standalone too). */
export const useSceneDuration = () => useScene().durationInFrames;

const warned = new Set<string>();

/**
 * Frame (relative to the scene start) where `phrase` begins to be spoken in
 * this scene — or `fallback` when the scene has no narration. Use it to land
 * a beat on a word: `const hit = useWordFrame("throat of Venice", 60);`
 * A phrase that is not in the scene's narration also falls back, with a
 * console warning (it usually means the script and recording diverged).
 */
export const useWordFrame = (phrase: string, fallback: number): number => {
  const { words, index } = useScene();
  if (!words.length) return fallback;
  const hit = findWordFrames(words, phrase);
  if (!hit) {
    const key = `${index}:${phrase}`;
    if (warned.has(key)) return fallback;
    warned.add(key);
    console.warn(
      `[3gp] scene ${index + 1}: "${phrase}" is not spoken in this scene — using frame ${fallback}`,
    );
    return fallback;
  }
  return hit.start;
};
