// Spring configs are data here; the lint rule mistakes them for CSS animation.
/* eslint-disable @remotion/non-pure-animation */
import type { Theme } from "../types";

/** Clean, dark, modern default. Good for product, tech and social content. */
export const studio: Theme = {
  name: "studio",
  colors: {
    background: "#0e0f13",
    surface: "#1b1d24",
    text: "#f4f3ee",
    muted: "#8d909c",
    accent: "#7ce0b8",
    onAccent: "#0e0f13",
    positive: "#6fa8ff",
    negative: "#ff6b5e",
  },
  fonts: {
    display: "Inter",
    body: "Inter",
    hand: "Caveat",
    mono: "JetBrains Mono",
  },
  display: {
    weight: 800,
    uppercase: false,
    lineHeight: 1.02,
    letterSpacing: "-0.03em",
  },
  texture: "none",
  emphasis: "color",
  entrance: "rise",
  transition: "fade",
  tilt: 0,
  radius: 24,
  shadow: "0 30px 60px rgba(0,0,0,0.35)",
  strokeFps: 0,
  springs: {
    // Overdamped: confident settle, no bounce.
    enter: { damping: 200, stiffness: 100, mass: 1 },
    snappy: { damping: 120, stiffness: 180, mass: 1 },
  },
};
