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
import { City } from "./city";

/** Where the uncorrected position wanders over a day (0–1 → metres). */
const ghostAt = (t: number) => {
  const dist = 10000 * t;
  const a = -0.6 + 0.9 * Math.sin(t * 5.1) * (1 - t * 0.4) + t * 0.8;
  return { x: Math.cos(a) * dist, y: Math.sin(a) * dist };
};

/**
 * The consequence, at city scale. The street plan pulls back until 10 km
 * fits; a red "uncorrected" copy of the dot wanders off as the hour counter
 * runs to 24 h, the error ring growing with it — reaching 10 km as the
 * narrator says "ten kilometers".
 */
export const Drift: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, S, u, landscape, isVertical, safe } = useFrameGeo();

  const drift = useWordFrame("drift", s(1.95));
  const ten = useWordFrame("ten kilometers", s(2.8));
  const day = useWordFrame("a day", s(3.75));

  const cx = W / 2;
  const cy = H * (isVertical ? 0.44 : 0.5);
  const R10 = S * (landscape ? 0.36 : 0.34);
  const pull = ramp(frame, 0, s(1.3), EASE.inOut);
  const scale = Math.exp(Math.log(u(0.55)) + pull * (Math.log(R10 / 10000) - Math.log(u(0.55))));

  // Drift reaches 10 km on "ten", then settles by "a day".
  const p1 = ramp(frame, drift - s(0.5), ten - drift + s(0.5), EASE.inOut) * 0.97;
  const p2 = ramp(frame, ten, day - ten + s(0.3), EASE.out) * 0.03;
  const t = p1 + p2;
  const g = ghostAt(t);
  const ghost = { x: cx + g.x * scale, y: cy + g.y * scale };
  const r = Math.hypot(g.x, g.y) * scale;
  const trail = Array.from({ length: 40 }, (_, k) => {
    const q = ghostAt((t * k) / 39);
    return `${k ? "L" : "M"}${(cx + q.x * scale).toFixed(1)},${(cy + q.y * scale).toFixed(1)}`;
  }).join("");
  const hours = Math.min(24, Math.round(24 * t));
  const label = ramp(frame, ten, s(0.4));
  const outro = ramp(frame, durationInFrames - s(0.3), s(0.3), EASE.in);
  const on = ramp(frame, drift - s(0.6), s(0.4));

  return (
    <>
      <Starfield opacity={0.3} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <City cx={cx} cy={cy} scale={scale} color={theme.colors.text} water="#18295a" strokeScale={0.8} opacity={0.75} />
        {r > 1 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={theme.colors.negative}
            fillOpacity={0.06}
            stroke={theme.colors.negative}
            strokeWidth={u(2)}
            strokeDasharray={`${u(6)} ${u(7)}`}
          />
        ) : null}
        <path d={trail} fill="none" stroke={theme.colors.negative} strokeWidth={u(2.5)} strokeOpacity={0.7 * on} strokeLinecap="round" />
        <g opacity={label}>
          <line x1={cx} y1={cy} x2={cx - r} y2={cy} stroke={theme.colors.text} strokeWidth={u(1.5)} />
          <line x1={cx - r} y1={cy - u(10)} x2={cx - r} y2={cy + u(10)} stroke={theme.colors.text} strokeWidth={u(1.5)} />
        </g>
        <circle cx={ghost.x} cy={ghost.y} r={u(12)} fill={theme.colors.negative} fillOpacity={0.4} stroke={theme.colors.negative} strokeWidth={u(2.5)} opacity={on} />
        <BlueDot x={cx} y={cy} r={u(12)} pulse={frame / s(1.6)} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - r / 2 - u(150),
          width: u(300),
          top: cy - u(70),
          textAlign: "center",
          opacity: label * (1 - outro),
        }}
      >
        <Mono size={52}>≈ 10 km</Mono>
      </div>
      <div
        style={{
          position: "absolute",
          ...(landscape ? { right: safe.x, top: safe.y } : { left: safe.x, top: H * 0.08 }),
          textAlign: landscape ? "right" : "left",
          opacity: on * (1 - outro),
        }}
      >
        <Label size={17} color={theme.colors.negative}>Without the correction</Label>
        <Mono size={64} style={{ marginTop: u(6) }}>
          {String(hours).padStart(2, "0")}
          <span style={{ fontSize: "0.45em", color: theme.colors.muted }}> h</span>
        </Mono>
        <Label size={15}>since clocks were last in step</Label>
      </div>
      <Label
        size={15}
        style={{ position: "absolute", left: safe.x, bottom: isVertical ? H * 0.2 : safe.y * 0.5, opacity: 0.7 * pull * (1 - outro) }}
      >
        Drift path illustrative · ≈10 km/day (Ohio State, Pogge)
      </Label>
      <Vignette />
    </>
  );
};
