import { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";

/** Duration of the current scene (templates may be used standalone too). */
export const SceneDurationContext = createContext<number | null>(null);

export const useSceneDuration = () => {
  const ctx = useContext(SceneDurationContext);
  const { durationInFrames } = useVideoConfig();
  return ctx ?? durationInFrames;
};
