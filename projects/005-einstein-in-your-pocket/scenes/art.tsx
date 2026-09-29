/**
 * Art direction shared by every scene of "Einstein in your pocket":
 * type, easing, the starfield, and SpokenLine (words that land exactly when
 * they are spoken). Colours come from the `orbit` style pack.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useLayout } from "../../../src/lib/layout";
import { useTheme } from "../../../src/styles";
import { normalizeWord } from "../../../src/video/transcript";
import { useScene } from "../../../src/video/scene-context";

export const SERIF = "Instrument Serif";

/** Motion language: decisive ease-outs, slow symmetrical camera moves. */
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

export const clampOpts = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** 0→1 over [start, start+dur] with an easing. */
export const ramp = (
  frame: number,
  start: number,
  dur: number,
  easing: (t: number) => number = EASE.out,
) =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {
    ...clampOpts,
    easing,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hook: seconds → frames at this composition's fps. */
export const useSeconds = () => {
  const { fps } = useVideoConfig();
  return (s: number) => Math.round(s * fps);
};

/** Deterministic star positions (0–1 space) with a size and brightness. */
const STARS = Array.from({ length: 260 }, (_, i) => ({
  x: random(`sx${i}`),
  y: random(`sy${i}`),
  r: 0.4 + random(`sr${i}`) ** 3 * 1.8,
  a: 0.25 + random(`sa${i}`) * 0.6,
  depth: 0.3 + random(`sd${i}`) * 0.7,
}));

/**
 * Starfield with parallax: `pan` (px) and `zoom` move near stars more than
 * far ones, which is where the sense of depth comes from.
 */
export const Starfield: React.FC<{
  pan?: [number, number];
  zoom?: number;
  opacity?: number;
}> = ({ pan = [0, 0], zoom = 1, opacity = 1 }) => {
  const { width: W, height: H, u } = useLayout();
  const theme = useTheme();
  const frame = useCurrentFrame();
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      {STARS.map((s, i) => {
        const z = 1 + (zoom - 1) * s.depth;
        const x = (s.x - 0.5) * W * 1.2 * z + W / 2 + pan[0] * s.depth;
        const y = (s.y - 0.5) * H * 1.2 * z + H / 2 + pan[1] * s.depth;
        const tw = 0.85 + 0.15 * Math.sin(frame / 17 + i);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={u(s.r)}
            fill={theme.colors.text}
            opacity={s.a * tw}
          />
        );
      })}
    </svg>
  );
};

/**
 * Soft edge darkening that holds every frame together, plus a fine static
 * grain: texture, and dither so dark gradients don't band after encoding.
 */
export const Vignette: React.FC<{ strength?: number }> = ({
  strength = 0.55,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(3,5,12,${strength}) 100%)`,
          pointerEvents: "none",
        }}
      />
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.07, mixBlendMode: "overlay" }}
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={width} height={height} filter="url(#grain)" />
      </svg>
    </>
  );
};

/**
 * A line of type whose words appear exactly when the narrator says them
 * (matched in order against this scene's transcript words). Words listed in
 * `accent` are set in italic and coloured. Without narration, words stagger
 * from `fallbackStart`.
 */
export const SpokenLine: React.FC<{
  text: string;
  accent?: string[];
  accentColor?: string;
  fallbackStart?: number;
  size: number;
  style?: React.CSSProperties;
  /** Frames each word takes to settle. */
  settle?: number;
  align?: "left" | "center";
  lead?: number;
}> = ({
  text,
  accent = [],
  accentColor,
  fallbackStart = 0,
  size,
  style,
  settle = 9,
  align = "left",
  lead = 2,
}) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const { u } = useLayout();
  const { words } = useScene();
  const tokens = text.split(/\s+/).filter(Boolean);
  const accents = new Set(accent.map(normalizeWord));
  let cursor = 0;
  let prev = fallbackStart - 4;
  const starts = tokens.map((t) => {
    const n = normalizeWord(t);
    for (let k = cursor; k < words.length; k++) {
      if (normalizeWord(words[k].text) === n) {
        cursor = k + 1;
        prev = words[k].startFrame - lead;
        return prev;
      }
    }
    prev += 4;
    return prev;
  });
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontSize: u(size),
        lineHeight: 1.08,
        letterSpacing: "-0.012em",
        color: theme.colors.text,
        textAlign: align,
        ...style,
      }}
    >
      {tokens.map((t, i) => {
        const p = ramp(frame, starts[i], settle);
        const isAccent = accents.has(normalizeWord(t));
        return (
          <React.Fragment key={i}>
            {i > 0 ? " " : null}
            <span
              style={{
                display: "inline-block",
                opacity: p,
                transform: `translateY(${(1 - p) * u(size * 0.18)}px)`,
                filter: `blur(${(1 - p) * u(6)}px)`,
                fontStyle: isAccent ? "italic" : undefined,
                color: isAccent ? (accentColor ?? theme.colors.accent) : undefined,
              }}
            >
              {t}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Small uppercase label in the body face (axis names, callouts). */
export const Label: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, size = 22, color, style }) => {
  const theme = useTheme();
  const { u } = useLayout();
  return (
    <div
      style={{
        fontFamily: theme.fonts.body,
        fontWeight: 600,
        fontSize: u(size),
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: color ?? theme.colors.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Numbers and readouts. */
export const Mono: React.FC<{
  children: React.ReactNode;
  size: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, size, color, style }) => {
  const theme = useTheme();
  const { u } = useLayout();
  return (
    <div
      style={{
        fontFamily: theme.fonts.mono,
        fontWeight: 500,
        fontSize: u(size),
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
        color: color ?? theme.colors.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** The protagonist: the "you are here" dot, with a soft halo and a pulse. */
export const BlueDot: React.FC<{
  x: number;
  y: number;
  r: number;
  pulse?: number;
  halo?: number;
  opacity?: number;
  /** Radius (px) of the translucent accuracy disc maps draw under the dot. */
  accuracy?: number;
}> = ({ x, y, r, pulse = 0, halo = 1, opacity = 1, accuracy = 0 }) => {
  const theme = useTheme();
  const blue = theme.colors.positive;
  const ring = pulse % 1;
  return (
    <g opacity={opacity}>
      {accuracy > 0 ? (
        <circle
          cx={x}
          cy={y}
          r={accuracy}
          fill={blue}
          fillOpacity={0.1}
          stroke={blue}
          strokeOpacity={0.35}
          strokeWidth={r * 0.1}
        />
      ) : null}
      <circle cx={x} cy={y} r={r * 3.2 * halo} fill={blue} opacity={0.12} />
      {pulse > 0 ? (
        <circle
          cx={x}
          cy={y}
          r={r * (1.2 + ring * 3.2)}
          fill="none"
          stroke={blue}
          strokeWidth={r * 0.18}
          opacity={(1 - ring) * 0.7}
        />
      ) : null}
      <circle cx={x} cy={y} r={r * 1.18} fill={theme.colors.text} />
      <circle cx={x} cy={y} r={r} fill={blue} />
    </g>
  );
};

/** Shared frame geometry: where the dot lives, which format we're in. */
export const useFrameGeo = () => {
  const L = useLayout();
  const { width: W, height: H } = L;
  const landscape = W > H * 1.2;
  const square = !landscape && !L.isVertical;
  return {
    ...L,
    W,
    H,
    S: Math.min(W, H),
    landscape,
    square,
    dot: { x: W / 2, y: H * (L.isVertical ? 0.4 : 0.42) },
  };
};
