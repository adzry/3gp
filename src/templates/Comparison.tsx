import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { z } from "zod";
import { Emphasis } from "../components/Emphasis";
import { Headline } from "../components/Headline";
import { InlineMedia } from "../components/Media";
import { Reveal } from "../components/Reveal";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { STAGGER, useEnter } from "../lib/motion";
import { useTheme } from "../styles";
import type { comparisonSchema } from "./schemas";

type Side = z.input<typeof comparisonSchema>["left"];

/**
 * Two options side by side (stacked in 9:16). Both land, then the winner is
 * marked with the accent and the other side steps back.
 */
export const Comparison: React.FC<z.input<typeof comparisonSchema>> = ({
  title,
  left,
  right,
  winner = "right",
}) => {
  const { u, isVertical } = useLayout();
  const hasTitle = Boolean(title);
  const base = hasTitle ? 12 : 0;
  const verdictAt =
    base +
    34 +
    Math.max(left.points?.length ?? 0, right.points?.length ?? 0) * STAGGER;
  return (
    <Stage dots>
      {title ? <Headline text={title} size={84} maxWidth={1600} /> : null}
      <div
        style={{
          marginTop: hasTitle ? u(44) : 0,
          width: "100%",
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: "stretch",
          gap: u(isVertical ? 30 : 44),
          position: "relative",
        }}
      >
        <Panel
          side={left}
          delay={base}
          seed={1}
          state={
            winner === "none" ? "neutral" : winner === "left" ? "win" : "lose"
          }
          verdictAt={verdictAt}
        />
        <Versus delay={base + 10} />
        <Panel
          side={right}
          delay={base + 10}
          seed={2}
          state={
            winner === "none" ? "neutral" : winner === "right" ? "win" : "lose"
          }
          verdictAt={verdictAt}
        />
      </div>
    </Stage>
  );
};

const Panel: React.FC<{
  side: Side;
  delay: number;
  seed: number;
  state: "win" | "lose" | "neutral";
  verdictAt: number;
}> = ({ side, delay, seed, state, verdictAt }) => {
  const theme = useTheme();
  const { u, isVertical } = useLayout();
  const frame = useCurrentFrame();
  const verdict = useEnter(verdictAt, "snappy");
  const dim = state === "lose" ? interpolate(verdict, [0, 1], [1, 0.55]) : 1;
  const bullet = state === "win" ? "✓" : state === "lose" ? "✕" : "•";
  const bulletColor =
    state === "win"
      ? theme.colors.positive
      : state === "lose"
        ? theme.colors.negative
        : theme.colors.muted;
  const showVerdict = frame >= verdictAt;
  return (
    <Reveal delay={delay} seed={seed} style={{ flex: 1, opacity: dim }}>
      <div
        style={{
          height: "100%",
          boxSizing: "border-box",
          background: theme.colors.surface,
          borderRadius: theme.radius,
          boxShadow: theme.shadow,
          overflow: "hidden",
          borderTop: `${u(14)}px solid ${state === "win" ? theme.colors.accent : "transparent"}`,
        }}
      >
        {side.media ? (
          <InlineMedia
            src={side.media}
            style={{
              width: "100%",
              height: u(isVertical ? 220 : 260),
              display: "block",
            }}
          />
        ) : null}
        <div style={{ padding: `${u(30)}px ${u(40)}px ${u(36)}px` }}>
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontWeight: 700,
              fontSize: u(30),
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: theme.colors.muted,
            }}
          >
            {side.label}
          </div>
          <div
            style={{
              marginTop: u(10),
              fontFamily: theme.fonts.display,
              fontWeight: theme.display.weight,
              textTransform: theme.display.uppercase ? "uppercase" : "none",
              letterSpacing: theme.display.letterSpacing,
              lineHeight: 1.05,
              fontSize: u(isVertical ? 60 : 64),
              color: theme.colors.text,
            }}
          >
            {state === "win" && showVerdict ? (
              <Emphasis delay={verdictAt}>{side.title}</Emphasis>
            ) : (
              side.title
            )}
          </div>
          <div
            style={{
              marginTop: u(22),
              display: "flex",
              flexDirection: "column",
              gap: u(12),
            }}
          >
            {(side.points ?? []).map((pt, i) => (
              <Reveal
                key={i}
                delay={delay + 14 + i * STAGGER}
                straight
                variant="rise"
              >
                <div
                  style={{
                    display: "flex",
                    gap: u(16),
                    fontSize: u(isVertical ? 38 : 40),
                    lineHeight: 1.25,
                    color: theme.colors.text,
                  }}
                >
                  <span
                    style={{
                      color: bulletColor,
                      fontWeight: 700,
                      width: u(34),
                      flexShrink: 0,
                    }}
                  >
                    {bullet}
                  </span>
                  <span>{pt}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
};

const Versus: React.FC<{ delay: number }> = ({ delay }) => {
  const theme = useTheme();
  const { u, isVertical } = useLayout();
  const p = useEnter(delay, "snappy");
  const size = u(84);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        zIndex: 2,
        borderRadius: "50%",
        background: theme.colors.text,
        color: theme.colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: theme.fonts.display,
        fontWeight: theme.display.weight,
        fontSize: u(32),
        textTransform: "uppercase",
        transform: `scale(${p}) rotate(${isVertical ? 0 : -theme.tilt * 4}deg)`,
      }}
    >
      vs
    </div>
  );
};
