// Spring configs are data here; the lint rule mistakes them for CSS animation.
/* eslint-disable @remotion/non-pure-animation */
import type { Theme } from "../types";

/**
 * "Night instrument": deep navy, warm cream type, amber for time/signal, GPS
 * blue for position, red for error. Hairline geometry, no bounce. See ./STYLE.md.
 */
export const orbit: Theme = {
  name: "orbit",
  colors: {
    background: "#0a0f1e",
    surface: "#141b31",
    text: "#f2ede3",
    muted: "#8790a8",
    accent: "#ffb547",
    onAccent: "#0a0f1e",
    positive: "#4ea8ff",
    negative: "#ff5a4f",
  },
  fonts: {
    display: "Inter",
    body: "Inter",
    hand: "Instrument Serif",
    mono: "JetBrains Mono",
  },
  display: {
    weight: 700,
    uppercase: false,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
  },
  texture: "none",
  emphasis: "color",
  entrance: "rise",
  transition: "fade",
  tilt: 0,
  radius: 14,
  shadow: "0 24px 60px rgba(0,0,0,0.45)",
  strokeFps: 0,
  springs: {
    enter: { damping: 200, stiffness: 90, mass: 1 },
    snappy: { damping: 150, stiffness: 170, mass: 1 },
  },
};
