import React from "react";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { z } from "zod";
import { resolveSrc } from "../components/Media";
import { Reveal } from "../components/Reveal";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { STAGGER, useEnter } from "../lib/motion";
import { useTheme } from "../styles";
import type { logoRevealSchema } from "./schemas";

/** Wordmark sting: accent mark draws, letters land, tagline settles. */
export const LogoReveal: React.FC<z.input<typeof logoRevealSchema>> = ({
  wordmark,
  tagline,
  logo,
}) => {
  const theme = useTheme();
  const { u } = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = useEnter(0, "snappy");
  const letters = [...wordmark];
  const underline = interpolate(
    frame,
    [8 + letters.length * STAGGER, 8 + letters.length * STAGGER + 0.5 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <Stage align="center" dots>
      {logo ? (
        <Reveal>
          <Img
            src={resolveSrc(logo)}
            style={{ height: u(220), marginBottom: u(40) }}
          />
        </Reveal>
      ) : (
        <div
          style={{
            width: u(90),
            height: u(90),
            marginBottom: u(40),
            background: theme.colors.accent,
            borderRadius: theme.radius,
            boxShadow: theme.shadow,
            transform: `scale(${mark}) rotate(${(1 - mark) * -90 + theme.tilt * 4}deg)`,
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          fontFamily: theme.fonts.display,
          fontWeight: theme.display.weight,
          letterSpacing: theme.display.letterSpacing,
          textTransform: theme.display.uppercase ? "uppercase" : "none",
          fontSize: u(200),
          lineHeight: 1,
        }}
      >
        {letters.map((ch, i) => (
          <Reveal as="span" key={i} delay={8 + i * STAGGER} seed={i}>
            {ch === " " ? " " : ch}
          </Reveal>
        ))}
        <div
          style={{
            height: u(14),
            marginTop: u(12),
            background: theme.colors.accent,
            transform: `scaleX(${underline})`,
            transformOrigin: "left",
          }}
        />
      </div>
      {tagline ? (
        <Reveal delay={8 + letters.length * STAGGER + 12} straight>
          <div
            style={{
              marginTop: u(40),
              fontSize: u(46),
              color: theme.colors.muted,
              textAlign: "center",
            }}
          >
            {tagline}
          </div>
        </Reveal>
      ) : null}
    </Stage>
  );
};
