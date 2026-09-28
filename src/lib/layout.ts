import { useVideoConfig } from "remotion";

/**
 * Resolution-independent sizing. Every size in 3gp is written for a 1080px
 * short edge, then scaled — so the same template works in 16:9, 9:16 and 1:1.
 *
 * Minimums (from Remotion's video-layout guidance, at 1080 short edge):
 *   headline >= 84, important supporting text >= 44.
 */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const s = Math.min(width, height) / 1080;
  return {
    width,
    height,
    /** Scale a 1080-based pixel value. */
    u: (px: number) => px * s,
    isVertical: height > width,
    /** Safe area padding: keep key content inside this. */
    safe: { x: 80 * s * (width > height ? 1.5 : 1), y: 100 * s },
  };
};
