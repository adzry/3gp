import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../styles";

/**
 * One motion vocabulary for the whole lab (frame counts at 30fps).
 * Use `frames()` to convert to the composition's fps.
 * Reach for these before inventing a new timing — consistency is the style.
 */
export const DURATION = {
  instant: 6,
  fast: 10,
  base: 18,
  slow: 24,
  scene: 30,
  hold: 45,
} as const;

/** Frames between siblings in a staggered reveal. */
export const STAGGER = 4;

export const useFrames = () => {
  const { fps } = useVideoConfig();
  return (frames30: number) => Math.round((frames30 * fps) / 30);
};

/** 0→1 progress of the theme's entrance spring, starting at `delay` frames. */
export const useEnter = (delay = 0, kind: "enter" | "snappy" = "enter") => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  return spring({
    frame: frame - delay,
    fps,
    config: theme.springs[kind],
  });
};

/**
 * Quantise a frame to a lower "drawing" frame rate — the stepped, hand-made
 * feel used on pen strokes and dot fields in editorial styles. Never use it
 * on hero type.
 */
export const stepFrame = (frame: number, fps: number, stepFps: number) =>
  stepFps > 0 ? Math.floor((frame * stepFps) / fps) * (fps / stepFps) : frame;

// For randomness use Remotion's deterministic `random(seed)` — never Math.random().
