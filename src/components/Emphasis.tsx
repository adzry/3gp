import React from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useTheme } from "../styles";

/**
 * Marks THE key word of a beat. One per scene is the rule.
 *  - theme.emphasis "highlighter": a marker swipe behind the word, left→right
 *  - theme.emphasis "color": the word shifts to the accent colour
 *  - kind "strike": a negative-coloured bar strikes through the word
 * The text colour never changes in highlighter mode — the marker is the device.
 */
export const Emphasis: React.FC<{
  children: React.ReactNode;
  delay?: number;
  kind?: "mark" | "strike";
}> = ({ children, delay = 0, kind = "mark" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const p = interpolate(frame - delay, [0, 0.45 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  if (kind === "strike") {
    return (
      <span style={{ position: "relative", display: "inline-block" }}>
        {children}
        <span
          style={{
            position: "absolute",
            left: "-4%",
            right: "-4%",
            top: "48%",
            height: "0.12em",
            background: theme.colors.negative,
            transform: `rotate(-2.5deg) scaleX(${p})`,
            transformOrigin: "left center",
          }}
        />
      </span>
    );
  }

  if (theme.emphasis === "color") {
    return (
      <span
        style={{
          color: interpolateColors(
            p,
            [0, 1],
            [theme.colors.text, theme.colors.accent],
          ),
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <span style={{ position: "relative", display: "inline-block", zIndex: 0 }}>
      <span
        style={{
          position: "absolute",
          left: "-0.12em",
          right: "-0.12em",
          top: "8%",
          bottom: "2%",
          background: theme.colors.accent,
          transform: `scaleX(${p}) rotate(-0.6deg)`,
          transformOrigin: "left center",
          zIndex: -1,
        }}
      />
      {children}
    </span>
  );
};
