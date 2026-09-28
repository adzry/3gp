import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../lib/layout";
import { stepFrame } from "../lib/motion";
import { useTheme } from "../styles";

/**
 * The canvas every template draws on: background, texture, safe area.
 * `dots` adds a halftone dot field (editorial texture) that drifts in steps.
 */
export const Stage: React.FC<{
  children: React.ReactNode;
  align?: "center" | "start" | "end";
  justify?: "center" | "start" | "end";
  dots?: boolean;
  padded?: boolean;
  /** No background or texture — for overlays on footage / alpha renders. */
  transparent?: boolean;
  style?: React.CSSProperties;
}> = ({
  children,
  align = "start",
  justify = "center",
  dots = false,
  padded = true,
  transparent = false,
  style,
}) => {
  const theme = useTheme();
  const { safe } = useLayout();
  const flex = { start: "flex-start", center: "center", end: "flex-end" };
  return (
    <AbsoluteFill
      style={{
        backgroundColor: transparent ? undefined : theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      {dots && !transparent ? <DotField /> : null}
      {theme.texture === "paper" && !transparent ? <PaperTexture /> : null}
      <AbsoluteFill
        style={{
          padding: padded ? `${safe.y}px ${safe.x}px` : 0,
          display: "flex",
          flexDirection: "column",
          alignItems: flex[align],
          justifyContent: flex[justify],
          ...style,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Pure-CSS paper grain + print-edge vignette. No image assets needed. */
export const PaperTexture: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        opacity: 0.6,
        backgroundImage: [
          "radial-gradient(circle at 1px 1px, rgba(22,21,19,0.05) 1px, transparent 0)",
          "radial-gradient(circle at 3px 2px, rgba(22,21,19,0.035) 1px, transparent 0)",
          "radial-gradient(circle at 2px 5px, rgba(255,255,255,0.06) 1px, transparent 0)",
        ].join(","),
        backgroundSize: "3px 3px, 5px 5px, 7px 7px",
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 60%, rgba(22,21,19,0.08) 100%)",
      }}
    />
  </AbsoluteFill>
);

/** Halftone dot field. Pans at the theme's stroke fps (12fps "stutter"). */
export const DotField: React.FC<{ opacity?: number }> = ({
  opacity = 0.14,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const { u } = useLayout();
  const f = stepFrame(frame, fps, theme.strokeFps);
  const size = u(22);
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `radial-gradient(${theme.colors.text} ${u(3.2)}px, transparent ${u(3.6)}px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${f * u(0.6)}px ${f * u(0.25)}px`,
        maskImage:
          "linear-gradient(115deg, transparent 35%, black 75%, black 100%)",
      }}
    />
  );
};
