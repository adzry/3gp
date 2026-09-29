import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { z } from "zod";
import { Headline } from "../components/Headline";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { stepFrame } from "../lib/motion";
import { useTheme } from "../styles";
import { SourceLine } from "./MetricCard";
import type { lineChartSchema } from "./schemas";

const fmt = (v: number) =>
  v.toLocaleString("en-US", { maximumFractionDigits: 2 });

/**
 * A trend over time. The line draws itself left→right; points appear as the
 * line reaches them; the highlighted point gets a ring and a hand-written note.
 * Zero-based y-axis by default — don't exaggerate change.
 */
export const LineChart: React.FC<z.input<typeof lineChartSchema>> = ({
  title,
  unit = "",
  data,
  highlight,
  annotation,
  zeroBased = true,
  source,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, width, isVertical, safe } = useLayout();

  // Chart geometry in output pixels.
  const W = width - safe.x * 2;
  const H = u(isVertical ? 760 : 470);
  const padTop = u(70); // room for value labels above points
  const padBottom = u(64); // x labels
  const padX = u(24);
  const values = data.map((d) => d.value);
  const lo = zeroBased ? Math.min(0, ...values) : Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i: number) => padX + (i / (data.length - 1)) * (W - padX * 2);
  const y = (v: number) =>
    padTop + (1 - (v - lo) / span) * (H - padTop - padBottom);
  const path = data
    .map(
      (d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`,
    )
    .join(" ");

  // Draw progress: starts after the headline lands, ~1.6s.
  const start = 14;
  const p = interpolate(frame, [start, start + 1.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const reached = (i: number) => p >= i / (data.length - 1) - 1e-6;
  const done = start + 1.6 * fps;

  const ink = theme.texture === "paper";
  const lineColor = ink ? theme.colors.text : theme.colors.accent;
  const labelEvery = Math.ceil(data.length / (isVertical ? 5 : 9));
  const hl =
    highlight !== undefined && highlight < data.length ? highlight : null;
  // Put the highlight's labels where the line isn't: on a rising line the
  // upper-left and lower-right of a point are empty (mirrored when falling).
  const rising =
    hl === null ||
    (data[hl + 1]?.value ?? data[hl].value) >=
      (data[hl - 1]?.value ?? data[hl].value);
  // …but never push the note off the chart: flip sides if it doesn't fit.
  const noteW = annotation ? annotation.length * u(26) : 0;
  const fitsRight = hl !== null && x(hl) + u(44) + noteW <= W;
  const fitsLeft = hl !== null && x(hl) - u(44) - noteW >= 0;
  const noteRight = !fitsRight ? false : !fitsLeft ? true : rising;
  // Keep the note clear of the line: find the lowest point of the line across
  // the note's horizontal span and sit below it (approximate text width).
  const lineYAt = (px: number) => {
    const t = ((px - padX) / (W - padX * 2)) * (data.length - 1);
    const i = Math.max(0, Math.min(data.length - 2, Math.floor(t)));
    const f = Math.max(0, Math.min(1, t - i));
    return y(data[i].value) + (y(data[i + 1].value) - y(data[i].value)) * f;
  };
  let noteY = 0;
  if (hl !== null && annotation) {
    const w = noteW;
    const x0 = noteRight ? x(hl) + u(44) : x(hl) - u(44) - w;
    let lowest = y(data[hl].value);
    for (let k = 0; k <= 8; k++)
      lowest = Math.max(lowest, lineYAt(x0 + (w * k) / 8));
    const below = Math.max(y(data[hl].value) + u(78), lowest + u(62));
    if (below <= H - padBottom - u(8)) {
      noteY = below;
    } else {
      // No room under the line: go above it, over the value label. The line
      // is lower on this side, so the space above is clear.
      let highest = y(data[hl].value);
      for (let k = 0; k <= 8; k++)
        highest = Math.min(highest, lineYAt(x0 + (w * k) / 8));
      noteY = Math.min(y(data[hl].value) - u(96), highest - u(24));
    }
  }

  // Highlight ring draws after the line passes it, at the theme's stroke fps.
  const ringStart =
    hl === null ? 0 : start + (hl / (data.length - 1)) * 1.6 * fps + 6;
  const ring = interpolate(
    stepFrame(frame - ringStart, fps, theme.strokeFps),
    [0, 0.5 * fps],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const endLabel = interpolate(frame, [done, done + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const label: React.CSSProperties = {
    fontFamily: theme.fonts.mono,
    fontSize: u(30),
    fill: theme.colors.muted,
  };

  return (
    <Stage dots>
      <Headline text={title} size={84} maxWidth={1600} />
      <svg
        width={W}
        height={H}
        style={{ marginTop: u(36), overflow: "visible" }}
      >
        {/* baseline */}
        <line
          x1={0}
          x2={W}
          y1={y(lo)}
          y2={y(lo)}
          stroke={theme.colors.muted}
          strokeOpacity={0.5}
          strokeWidth={u(2)}
        />
        {zeroBased ? (
          <text x={0} y={y(lo) - u(10)} style={label}>
            0{unit}
          </text>
        ) : null}
        {/* area wash (screen styles only) */}
        {!ink ? (
          <path
            d={`${path} L${x(data.length - 1)},${y(lo)} L${x(0)},${y(lo)} Z`}
            fill={lineColor}
            opacity={0.12}
            style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}
          />
        ) : null}
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth={u(ink ? 7 : 6)}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
        />
        {data.map((d, i) => {
          const isHl = i === hl;
          const isLast = i === data.length - 1;
          return (
            <g key={i} opacity={reached(i) ? 1 : 0}>
              <circle
                cx={x(i)}
                cy={y(d.value)}
                r={u(isHl ? 12 : 8)}
                fill={isHl ? theme.colors.accent : lineColor}
                stroke={ink ? theme.colors.text : theme.colors.background}
                strokeWidth={u(3)}
              />
              {i % labelEvery === 0 || isLast ? (
                <text x={x(i)} y={H - u(14)} textAnchor="middle" style={label}>
                  {d.label}
                </text>
              ) : null}
              {isLast || isHl ? (
                <text
                  x={isLast ? x(i) : x(i) + (rising ? -u(30) : u(30))}
                  // A highlighted last point sits above its ring (r = 34).
                  y={y(d.value) - u(isLast ? (isHl ? 50 : 26) : 30)}
                  textAnchor={isLast || rising ? "end" : "start"}
                  opacity={isLast ? endLabel : 1}
                  style={{
                    ...label,
                    fill: theme.colors.text,
                    fontSize: u(36),
                    fontWeight: 500,
                  }}
                >
                  {fmt(d.value)}
                  {unit}
                </text>
              ) : null}
            </g>
          );
        })}
        {hl !== null ? (
          <g>
            <circle
              cx={x(hl)}
              cy={y(data[hl].value)}
              r={u(34)}
              fill="none"
              stroke={theme.colors.negative}
              strokeWidth={u(5)}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - ring}
              transform={`rotate(-80 ${x(hl)} ${y(data[hl].value)})`}
            />
            {annotation ? (
              <text
                x={x(hl) + (noteRight ? u(44) : -u(44))}
                y={noteY}
                textAnchor={noteRight ? "start" : "end"}
                opacity={ring}
                style={{
                  fontFamily: theme.fonts.hand,
                  fontWeight: 700,
                  fontSize: u(54),
                  fill: theme.colors.negative,
                }}
              >
                {annotation}
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>
      {source ? <SourceLine text={source} /> : null}
    </Stage>
  );
};
