import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useTheme } from "../styles";

/**
 * Wraps each scene of a SceneVideo and applies the theme's scene transition:
 *  - fade: short fade in / out
 *  - sheet-wipe: a paper sheet sweeps off the new scene (the only editorial cut)
 */
export const SceneShell: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({ children, durationInFrames, isFirst, isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const t = Math.round(0.4 * fps);

  if (theme.transition === "sheet-wipe") {
    const p = interpolate(frame, [0, t], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
    return (
      <AbsoluteFill>
        {children}
        {isFirst ? null : (
          <AbsoluteFill
            style={{
              background: theme.colors.surface,
              transform: `translateX(${p * 105}%) rotate(${1.5 * (1 - p)}deg)`,
              boxShadow: theme.shadow,
            }}
          />
        )}
      </AbsoluteFill>
    );
  }

  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, t / 2], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = isLast
    ? 1
    : interpolate(frame, [durationInFrames - t / 2, durationInFrames], [1, 0], {
        extrapolateLeft: "clamp",
      });
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
};
