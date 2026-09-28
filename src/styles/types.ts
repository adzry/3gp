import type { SpringConfig } from "remotion";

/**
 * A style pack is pure data. Components never hard-code colours, fonts or
 * motion — they read the active Theme, so one template can render in any style.
 */
export type Theme = {
  name: string;
  colors: {
    /** Canvas colour behind everything. */
    background: string;
    /** Cards, panels, bars that are not the focus. */
    surface: string;
    /** Primary text / ink / outlines. */
    text: string;
    /** Secondary text, captions, sources. */
    muted: string;
    /** The ONE emphasis colour (highlighter, key bar, active caption word). */
    accent: string;
    /** Text drawn on top of `accent`. */
    onAccent: string;
    /** "New / good / the answer" signal. */
    positive: string;
    /** "Old / cost / friction / negation" signal. */
    negative: string;
  };
  fonts: {
    display: string;
    body: string;
    hand: string;
    mono: string;
  };
  display: {
    weight: number;
    uppercase: boolean;
    lineHeight: number;
    letterSpacing: string;
  };
  /** Background texture drawn by <Stage>. */
  texture: "none" | "paper";
  /** How <Emphasis> marks a key word. */
  emphasis: "highlighter" | "color";
  /** How elements enter. `slap` = paper slap-in (scale down + settle crooked). */
  entrance: "rise" | "slap";
  /** How scenes change in a SceneVideo. */
  transition: "fade" | "sheet-wipe";
  /** Degrees of deliberate off-axis settle for cards (editorial imperfection). */
  tilt: number;
  radius: number;
  /** Depth. Editorial styles use hard offset shadows, never glows. */
  shadow: string;
  /** Hand-drawn strokes animate at this fps (stepped). 0 = smooth. */
  strokeFps: number;
  springs: {
    enter: Partial<SpringConfig>;
    snappy: Partial<SpringConfig>;
  };
};
