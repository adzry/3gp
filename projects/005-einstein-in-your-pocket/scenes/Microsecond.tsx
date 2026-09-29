import React from "react";
import { useCurrentFrame } from "remotion";
import { useTheme } from "../../../src/styles";
import { useScene, useWordFrame } from "../../../src/video/scene-context";
import {
  BlueDot,
  EASE,
  Label,
  Mono,
  Starfield,
  Vignette,
  ramp,
  useFrameGeo,
  useSeconds,
} from "./art";
import { BLOCK, City, cityToScreen } from "./city";

/**
 * The first number, felt on the ground. Back on the street plan from the
 * question: "timing is exact" brings up a clock readout; on "one microsecond"
 * its last digit ticks to 1; on "three hundred meters" a red ghost of the dot
 * slides three 100 m blocks down the street, measured by a dimension line.
 */
export const Microsecond: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, u, landscape, square, isVertical, safe } = useFrameGeo();

  const exact = useWordFrame("exact", s(1.8));
  const error = useWordFrame("error", s(2.6));
  const micro = useWordFrame("one microsecond", s(3.1));
  const meters = useWordFrame("three hundred meters", s(4.3));

  const cx = W * (landscape ? 0.36 : 0.3);
  const cy = H * (isVertical ? 0.5 : square ? 0.6 : 0.6);
  const scale = u(landscape ? 1.25 : 1.05);
  const intro = ramp(frame, 0, s(0.8));
  const readout = ramp(frame, exact - s(0.4), s(0.5));
  const tick = ramp(frame, micro + s(0.35), s(0.25));
  const slide = ramp(frame, meters - s(0.05), s(0.9), EASE.inOut);
  const ghostIn = ramp(frame, error - s(0.1), s(0.4));
  const label = ramp(frame, meters + s(0.6), s(0.4));
  const outro = ramp(frame, durationInFrames - s(0.35), s(0.35), EASE.in);

  const start = cityToScreen(0, 0, cx, cy, scale);
  const end = cityToScreen(3 * BLOCK * slide, 0, cx, cy, scale);
  const full = cityToScreen(3 * BLOCK, 0, cx, cy, scale);
  const perp = cityToScreen(0, -60, 0, 0, scale);
  const angle = (Math.atan2(full.y - start.y, full.x - start.x) * 180) / Math.PI;
  const blockTicks = [0, 1, 2, 3].map((k) => cityToScreen(k * BLOCK, 0, cx, cy, scale));

  const digits = tick > 0.5 ? "0.000 001" : "0.000 000";
  return (
    <>
      <Starfield opacity={0.3} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <City cx={cx} cy={cy} scale={scale} reveal={intro} color={theme.colors.text} water="#18295a" />
        {/* Dimension line along the street, offset to one side. */}
        <g opacity={label}>
          <line
            x1={start.x + perp.x}
            y1={start.y + perp.y}
            x2={full.x + perp.x}
            y2={full.y + perp.y}
            stroke={theme.colors.negative}
            strokeWidth={u(2)}
          />
          {blockTicks.map((t, i) => (
            <line
              key={i}
              x1={t.x + perp.x * 0.6}
              y1={t.y + perp.y * 0.6}
              x2={t.x + perp.x * 1.4}
              y2={t.y + perp.y * 1.4}
              stroke={theme.colors.negative}
              strokeWidth={u(i === 0 || i === 3 ? 2 : 1.2)}
            />
          ))}
        </g>
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={theme.colors.negative}
          strokeWidth={u(2.5)}
          strokeDasharray={`${u(4)} ${u(6)}`}
          opacity={ghostIn}
        />
        <circle
          cx={end.x}
          cy={end.y}
          r={u(13)}
          fill={theme.colors.negative}
          fillOpacity={0.35}
          stroke={theme.colors.negative}
          strokeWidth={u(2.5)}
          opacity={ghostIn}
        />
        <BlueDot x={cx} y={cy} r={u(13)} accuracy={u(26)} pulse={frame / s(1.6)} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: (start.x + full.x) / 2 + perp.x * 2.2 - u(120),
          top: (start.y + full.y) / 2 + perp.y * 2.2 - u(30),
          width: u(240),
          textAlign: "center",
          transform: `rotate(${angle}deg)`,
          opacity: label * (1 - outro),
        }}
      >
        <Mono size={40} color={theme.colors.negative}>300 m</Mono>
      </div>

      {/* The equation: 1 µs of clock error = 300 m of position error. */}
      <div
        style={{
          position: "absolute",
          left: safe.x,
          right: safe.x,
          top: landscape ? safe.y * 0.9 : square ? safe.y * 0.7 : H * 0.12,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: u(isVertical ? 34 : 60),
          flexWrap: isVertical ? "wrap" : "nowrap",
          opacity: readout * (1 - outro),
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Label size={18} color={theme.colors.accent}>Clock error</Label>
          <Mono size={isVertical ? 66 : 76} style={{ marginTop: u(8) }}>
            {digits.slice(0, -1)}
            <span style={{ color: tick > 0.5 ? theme.colors.accent : undefined }}>{digits.slice(-1)}</span>
            <span style={{ fontSize: "0.5em", color: theme.colors.muted }}> s</span>
          </Mono>
        </div>
        <Mono
          size={isVertical ? 52 : 60}
          color={theme.colors.muted}
          style={{ opacity: label, paddingBottom: u(6) }}
        >
          →
        </Mono>
        <div style={{ textAlign: "center", opacity: label }}>
          <Label size={18} color={theme.colors.negative}>Position error</Label>
          <Mono size={isVertical ? 66 : 76} color={theme.colors.negative} style={{ marginTop: u(8) }}>
            300 m
          </Mono>
        </div>
      </div>
      <Label
        size={16}
        style={{
          position: "absolute",
          left: safe.x,
          bottom: isVertical ? H * 0.2 : safe.y * 0.5,
          opacity: 0.7 * intro * (1 - outro),
        }}
      >
        1 block = 100 m · street plan illustrative
      </Label>
      <Vignette />
    </>
  );
};
