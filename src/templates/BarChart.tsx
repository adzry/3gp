import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { z } from "zod";
import { CountUp } from "../components/CountUp";
import { Headline } from "../components/Headline";
import { Reveal } from "../components/Reveal";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { useEnter } from "../lib/motion";
import { useTheme } from "../styles";
import { SourceLine } from "./MetricCard";
import type { barChartSchema } from "./schemas";

/** Horizontal bars that grow in sequence. Highlight the bar that matters. */
export const BarChart: React.FC<z.input<typeof barChartSchema>> = ({
  title,
  unit = "",
  data,
  annotation,
  source,
}) => {
  const { u } = useLayout();
  const max = Math.max(...data.map((d) => d.value));
  const rowGap = data.length > 5 ? 18 : 28;
  return (
    <Stage dots>
      <Headline text={title} size={84} maxWidth={1600} />
      <div
        style={{
          marginTop: u(56),
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: u(rowGap),
        }}
      >
        {data.map((d, i) => (
          <Bar
            key={d.label}
            index={i}
            label={d.label}
            value={d.value}
            ratio={max === 0 ? 0 : d.value / max}
            highlight={d.highlight ?? false}
            unit={unit}
            annotation={d.highlight ? annotation : undefined}
          />
        ))}
      </div>
      {source ? <SourceLine text={source} /> : null}
    </Stage>
  );
};

const Bar: React.FC<{
  index: number;
  label: string;
  value: number;
  ratio: number;
  highlight: boolean;
  unit: string;
  annotation?: string;
}> = ({ index, label, value, ratio, highlight, unit, annotation }) => {
  const theme = useTheme();
  const { u, isVertical } = useLayout();
  const frame = useCurrentFrame();
  const delay = 16 + index * 8;
  const grow = useEnter(delay, "snappy");
  const ink = theme.texture === "paper";
  // Paper styles print bars in ink; screen styles use muted grey. Accent = the point.
  const color = highlight
    ? theme.colors.accent
    : ink
      ? theme.colors.text
      : theme.colors.muted;
  const noteOpacity = interpolate(frame, [delay + 30, delay + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelEl = (
    <div
      style={{
        width: isVertical ? undefined : u(260),
        flexShrink: 0,
        fontSize: u(40),
        fontWeight: highlight ? 700 : 500,
        color: highlight ? theme.colors.text : theme.colors.muted,
      }}
    >
      {label}
    </div>
  );
  const note = annotation ? (
    <div
      style={{
        fontFamily: theme.fonts.hand,
        fontWeight: 700,
        fontSize: u(54),
        color: theme.colors.negative,
        opacity: noteOpacity,
        transform: `rotate(-4deg)`,
        whiteSpace: "nowrap",
      }}
    >
      {isVertical ? "↑ " : "← "}
      {annotation}
    </div>
  ) : null;

  return (
    <Reveal delay={delay - 4} straight variant="fade">
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: isVertical ? "stretch" : "center",
          gap: isVertical ? u(10) : u(24),
        }}
      >
        {labelEl}
        <div
          style={{ flex: 1, display: "flex", alignItems: "center", gap: u(20) }}
        >
          <div
            style={{
              height: u(64),
              width: `${Math.max(ratio * (isVertical ? 68 : 78) * grow, 0.6)}%`,
              background: color,
              border:
                ink && highlight
                  ? `${u(3)}px solid ${theme.colors.text}`
                  : undefined,
              boxShadow: ink ? "6px 7px 0 rgba(22,21,19,0.16)" : undefined,
              borderRadius: Math.min(theme.radius, u(8)),
            }}
          />
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontWeight: 500,
              fontSize: u(38),
              whiteSpace: "nowrap",
              color: highlight ? theme.colors.text : theme.colors.muted,
            }}
          >
            <CountUp value={value} delay={delay} seconds={1} suffix={unit} />
          </div>
          {isVertical ? null : note}
        </div>
        {isVertical ? note : null}
      </div>
    </Reveal>
  );
};
