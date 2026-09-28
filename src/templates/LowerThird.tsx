import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { z } from "zod";
import { BackgroundMedia } from "../components/Media";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { useEnter } from "../lib/motion";
import { useTheme } from "../styles";
import { useSceneDuration } from "../video/scene-context";
import type { lowerThirdSchema } from "./schemas";

/** Name + role identifier. Enters with an accent bar, exits before the cut. */
export const LowerThird: React.FC<z.input<typeof lowerThirdSchema>> = ({
  name,
  role,
  side = "left",
  background,
}) => {
  const theme = useTheme();
  const { u } = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = useSceneDuration();
  const bar = useEnter(0, "snappy");
  const text = useEnter(8);
  const exit = interpolate(
    frame,
    [duration - 0.5 * fps, duration - 0.1 * fps],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const dir = side === "left" ? -1 : 1;

  return (
    <>
      {background ? <BackgroundMedia src={background} /> : null}
      <Stage
        justify="end"
        align={side === "left" ? "start" : "end"}
        transparent={Boolean(background)}
      >
        <div
          style={{
            display: "flex",
            flexDirection: side === "left" ? "row" : "row-reverse",
            alignItems: "stretch",
            gap: u(20),
            opacity: exit,
            transform: `translateX(${(1 - exit) * dir * u(60)}px) rotate(${-dir * theme.tilt * 0.5}deg)`,
          }}
        >
          <div
            style={{
              width: u(14),
              background: theme.colors.accent,
              transform: `scaleY(${bar})`,
              transformOrigin: "bottom",
            }}
          />
          <div
            style={{
              background: theme.colors.surface,
              boxShadow: theme.shadow,
              borderRadius: theme.radius,
              padding: `${u(22)}px ${u(34)}px`,
              clipPath: `inset(0 ${side === "left" ? (1 - text) * 100 : 0}% 0 ${side === "right" ? (1 - text) * 100 : 0}%)`,
              textAlign: side,
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontWeight: theme.display.weight,
                textTransform: theme.display.uppercase ? "uppercase" : "none",
                letterSpacing: theme.display.letterSpacing,
                fontSize: u(64),
                lineHeight: 1.05,
                color: theme.colors.text,
              }}
            >
              {name}
            </div>
            {role ? (
              <div
                style={{
                  marginTop: u(8),
                  fontSize: u(38),
                  fontWeight: 500,
                  color: theme.colors.muted,
                }}
              >
                {role}
              </div>
            ) : null}
          </div>
        </div>
      </Stage>
    </>
  );
};
