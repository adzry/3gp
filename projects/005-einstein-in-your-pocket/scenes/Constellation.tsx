import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useTheme } from "../../../src/styles";
import { useScene, useWordFrame } from "../../../src/video/scene-context";
import {
  Globe,
  KL,
  ORBIT_RATIO,
  orbitPoint,
  orbitSegments,
  project,
  surface,
  type Camera,
} from "./globe";
import { R0 } from "./TheQuestion";
import {
  BlueDot,
  EASE,
  Label,
  Mono,
  Starfield,
  Vignette,
  clampOpts,
  lerp,
  ramp,
  useFrameGeo,
  useSeconds,
} from "./art";

const PLANES = [0, 60, 120, 180, 240, 300];
const PER_PLANE = 5;

/**
 * Continuing the pull-back: the Earth recedes until the GPS shell fits — the
 * orbits are drawn TO SCALE (4.2 Earth radii), so the distance is felt, not
 * stated. Six planes draw themselves; the satellites arrive on "thirty" and
 * start to move. The camera then pushes into one of them.
 */
export const Constellation: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, S, u, dot, landscape, isVertical, safe } = useFrameGeo();

  const twenty = useWordFrame("twenty thousand", s(0.4));
  const up = useWordFrame("up", s(1.9));
  const thirty = useWordFrame("thirty", s(2.6));
  const satellites = useWordFrame("satellites", s(3.6));

  const pull = ramp(frame, 0, s(2.3), EASE.inOut);
  const R1 = S * (landscape ? 0.096 : 0.094);
  const cy1 = isVertical ? H * 0.4 : H * 0.47;
  const cam: Camera = {
    lon: KL.lon - frame * 0.06,
    lat: lerp(KL.lat, 24, pull),
    r: R0(S) * Math.exp(pull * Math.log(R1 / R0(S))),
    cx: W / 2,
    cy: lerp(dot.y, cy1, pull),
  };

  const rings = ramp(frame, up - s(0.3), s(1.6), EASE.inOut);
  const shell = ramp(frame, twenty, s(0.9));
  const callout = ramp(frame, twenty + s(0.2), s(1.2));

  // Push into one satellite at the end.
  const push = ramp(frame, durationInFrames - s(0.9), s(0.9), EASE.in);
  const target = project(cam, orbitPoint(60, 40 + durationInFrames * 0.35));
  const zoom = Math.exp(push * Math.log(5));

  const kl = project(cam, surface(KL.lon, KL.lat, 1));
  const segs = PLANES.map((n) => orbitSegments(cam, n, rings));
  const sats = PLANES.flatMap((node, pi) =>
    Array.from({ length: PER_PLANE }, (_, k) => {
      const appear = thirty + (pi * PER_PLANE + k) * 0.6;
      const p = ramp(frame, appear, s(0.35));
      const uArg = 40 + k * (360 / PER_PLANE) + pi * 23 + frame * 0.35;
      return { ...project(cam, orbitPoint(node, uArg)), p, key: `${pi}-${k}` };
    }),
  );
  const ringColor = theme.colors.text;
  const satDot = (x: number, y: number, p: number, dim: number, key: string) => (
    <g key={key} opacity={p * dim}>
      <circle cx={x} cy={y} r={u(9)} fill={theme.colors.accent} opacity={0.18} />
      <circle cx={x} cy={y} r={u(4) * (0.4 + 0.6 * p)} fill={theme.colors.accent} />
    </g>
  );
  const label = ramp(frame, satellites, s(0.5));
  const shellR = cam.r * ORBIT_RATIO;

  return (
    <>
      <Starfield
        opacity={0.8}
        zoom={1 - 0.2 * pull + (zoom - 1) * 0.3}
        pan={[0, (cy1 - dot.y) * pull * 0.3]}
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g
          transform={`translate(${target.x},${target.y}) scale(${zoom}) translate(${-target.x},${-target.y})`}
          opacity={1 - interpolate(push, [0.7, 1], [0, 1], clampOpts)}
        >
          <circle
            cx={cam.cx}
            cy={cam.cy}
            r={shellR}
            fill="none"
            stroke={theme.colors.accent}
            strokeOpacity={0.14 * shell}
            strokeWidth={u(1.2)}
            strokeDasharray={`${u(2)} ${u(8)}`}
          />
          {segs.flatMap((g, i) =>
            g.back.map((d, j) => (
              <path key={`b${i}-${j}`} d={d} fill="none" stroke={ringColor} strokeOpacity={0.13} strokeWidth={u(1.2)} />
            )),
          )}
          {sats.filter((q) => q.depth < 0).map((q) => satDot(q.x, q.y, q.p, 0.45, q.key))}
          <Globe cam={cam} />
          {kl.depth > 0 ? (
            <BlueDot x={kl.x} y={kl.y} r={u(9) * (1 - 0.45 * pull)} halo={0.7} />
          ) : null}
          {segs.flatMap((g, i) =>
            g.front.map((d, j) => (
              <path key={`f${i}-${j}`} d={d} fill="none" stroke={ringColor} strokeOpacity={0.38} strokeWidth={u(1.4)} />
            )),
          )}
          {sats.filter((q) => q.depth >= 0).map((q) => satDot(q.x, q.y, q.p, 1, q.key))}
          <g opacity={callout}>
            <line
              x1={cam.cx + cam.r}
              y1={cam.cy}
              x2={cam.cx + cam.r + (shellR - cam.r) * callout}
              y2={cam.cy}
              stroke={theme.colors.accent}
              strokeWidth={u(2)}
            />
            <circle cx={cam.cx + cam.r} cy={cam.cy} r={u(4)} fill={theme.colors.accent} />
            <circle cx={cam.cx + shellR} cy={cam.cy} r={u(4)} fill={theme.colors.accent} opacity={callout > 0.95 ? 1 : 0} />
          </g>
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: W / 2 + (cam.r + (shellR - cam.r) / 2) - u(160),
          width: u(320),
          top: cam.cy - u(78),
          textAlign: "center",
          opacity: callout * (1 - push),
        }}
      >
        <Mono size={36} color={theme.colors.accent}>20,200 km</Mono>
        <Label size={16} style={{ marginTop: u(6) }}>altitude · to scale</Label>
      </div>
      <div
        style={{
          position: "absolute",
          left: safe.x,
          top: landscape ? safe.y : H * 0.075,
          opacity: label * (1 - push),
        }}
      >
        <Mono size={30}>
          <span style={{ color: theme.colors.accent }}>≈ 30</span> satellites
        </Mono>
        <Label size={17} style={{ marginTop: u(8) }}>6 orbital planes · 55° inclination</Label>
      </div>
      <Vignette />
    </>
  );
};
