// Spring configs are data here; the lint rule mistakes them for CSS animation.
/* eslint-disable @remotion/non-pure-animation */
import type { Theme } from "../types";

/**
 * "Printed, not lit": ink on cream paper, one yellow highlighter, hard offset
 * shadows, hand-drawn annotation. See ./STYLE.md for the full rules.
 */
export const voxEditorial: Theme = {
  name: "vox-editorial",
  colors: {
    background: "#f2ecdf",
    surface: "#e6dcc6",
    text: "#161513",
    muted: "#5d574c",
    accent: "#ffd200",
    onAccent: "#161513",
    positive: "#2f5fe8",
    negative: "#e5483f",
  },
  fonts: {
    display: "Archivo Black",
    body: "Inter",
    hand: "Caveat",
    mono: "JetBrains Mono",
  },
  display: {
    weight: 400,
    uppercase: true,
    lineHeight: 0.98,
    letterSpacing: "-0.01em",
  },
  texture: "paper",
  emphasis: "highlighter",
  entrance: "slap",
  transition: "sheet-wipe",
  tilt: 0.6,
  radius: 2,
  shadow: "10px 12px 0 rgba(22,21,19,0.16)",
  strokeFps: 12,
  springs: {
    // Slight settle for the slap-in; still no rubbery bounce.
    enter: { damping: 18, stiffness: 140, mass: 0.9 },
    snappy: { damping: 26, stiffness: 220, mass: 0.8 },
  },
};
