import React from "react";
import {
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { stepFrame } from "../lib/motion";
import { useTheme } from "../styles";

/**
 * A rough hand-drawn loop around whatever it wraps — for annotating evidence.
 * Drawn at the theme's stroke fps (stepped in editorial styles).
 */
export const HandCircle: React.FC<{
  children: React.ReactNode;
  delay?: number;
  seconds?: number;
  color?: string;
  seed?: number;
  /** In the 200×100 viewBox units. */
  strokeWidth?: number;
}> = ({
  children,
  delay = 0,
  seconds = 0.7,
  color,
  seed = 1,
  strokeWidth = 1.6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const f = stepFrame(frame - delay, fps, theme.strokeFps);
  const p = interpolate(f, [0, seconds * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const d = roughEllipse(seed);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: "-7%",
          top: "-12%",
          width: "114%",
          height: "124%",
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <path
          d={d}
          fill="none"
          stroke={color ?? theme.colors.negative}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
        />
      </svg>
    </span>
  );
};

/** A slightly-more-than-one-turn wobbly ellipse, deterministic per seed. */
const roughEllipse = (seed: number) => {
  const pts: string[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * 1.12 - Math.PI * 0.6;
    const wobble = 1 + (random(`${seed}-${i}`) - 0.5) * 0.06;
    const grow = 1 + (i / steps) * 0.07;
    const x = 100 + Math.cos(t) * 96 * wobble * grow;
    const y = 50 + Math.sin(t) * 46 * wobble * grow;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
};
