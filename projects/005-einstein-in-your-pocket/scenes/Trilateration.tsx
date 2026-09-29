import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useTheme } from "../../../src/styles";
import { useWordFrame } from "../../../src/video/scene-context";
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
  useSeconds,
} from "./art";
import { Globe } from "./globe";
import { Satellite, useSky, type Pt } from "./sky";

const DEG = Math.PI / 180;
const d = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const reflect = (p: Pt, a: Pt, b: Pt): Pt => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  const f = { x: a.x + t * dx, y: a.y + t * dy };
  return { x: 2 * f.x - p.x, y: 2 * f.y - p.y };
};
const from = (p: Pt, deg: number, len: number): Pt => ({
  x: p.x + Math.cos(deg * DEG) * len,
  y: p.y + Math.sin(deg * DEG) * len,
});

/**
 * The core idea, as geometry — the textbook view (not to scale), so every
 * sphere and both candidate points fit in frame. Opens with a pull-back from
 * TimeSignal's horizon to the whole planet. Sphere 1 → on "second" sphere 2,
 * and the two cut each other in a CIRCLE (a tilted ring through both
 * intersection points) → on "third", a sphere through exactly two points of
 * that ring: you, and one out in space → struck out on "ground" → the fourth
 * satellite fixes the phone's clock and the fuzzy dot snaps sharp.
 */
export const Trilateration: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { W, H, S, u, phone: phoneTS, landscape, square, isVertical } = useSky();

  const sphere = useWordFrame("sphere", s(1.95));
  const second = useWordFrame("second narrows", s(2.7));
  const circle = useWordFrame("circle", s(3.9));
  const third = useWordFrame("third", s(4.7));
  const points = useWordFrame("two points", s(5.7));
  const ground = useWordFrame("ground", s(7.9));
  const fourth = useWordFrame("fourth", s(8.7));
  const clock = useWordFrame("own clock", s(10));

  // The planet and the satellites around it (not to scale).
  const EC: Pt = landscape
    ? { x: W * 0.36, y: H * 0.64 }
    : square
      ? { x: W * 0.4, y: H * 0.62 }
      : { x: W * 0.5, y: H * 0.54 };
  const R = landscape ? S * 0.24 : square ? S * 0.19 : W * 0.2;
  const P = from(EC, -62, R);
  const A = from(P, -94, R * 1.25);
  const B = from(P, -152, R * 1.35);
  const D = from(P, -24, R * 1.22);

  // Spheres 1 ∩ 2 = a circle through P and its mirror P' (drawn as a ring).
  const Pp = reflect(P, A, B);
  const M2 = { x: (P.x + Pp.x) / 2, y: (P.y + Pp.y) / 2 };
  const a = d(P, Pp) / 2;
  const b = a * 0.32;
  const ex = { x: (P.x - M2.x) / a, y: (P.y - M2.y) / a };
  const ny = { x: -ex.y, y: ex.x };
  const E = (t: number): Pt => ({
    x: M2.x + a * Math.cos(t) * ex.x + b * Math.sin(t) * ny.x,
    y: M2.y + a * Math.cos(t) * ex.y + b * Math.sin(t) * ny.y,
  });
  // Everything that must be readable stays inside this box (legend excluded).
  const box = landscape
    ? { x0: W * 0.06, x1: W * 0.66, y0: H * 0.1, y1: H * 0.86 }
    : { x0: W * 0.08, x1: W * 0.92, y0: H * 0.08, y1: H * (square ? 0.9 : 0.66) };
  const inBox = (p: Pt, m = 0) =>
    p.x > box.x0 + m && p.x < box.x1 - m && p.y > box.y0 + m && p.y < box.y1 - m;
  // Q: the on-screen ring point farthest out in space (and clear of P).
  let Q = E(Math.PI);
  let bestQ = -1;
  for (let i = 0; i < 180; i++) {
    const q = E((i / 180) * 2 * Math.PI);
    const score = d(q, EC);
    if (inBox(q, u(40)) && d(q, P) > R * 0.5 && score > bestQ) {
      bestQ = score;
      Q = q;
    }
  }
  // Satellite 3 sits on the bisector of PQ, so its sphere passes through
  // both. Among candidates, take the one farthest from the other satellites.
  const M3 = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
  const pq = d(P, Q);
  const n3 = { x: -(Q.y - P.y) / pq, y: (Q.x - P.x) / pq };
  let C = { x: M3.x + n3.x * R, y: M3.y + n3.y * R };
  let bestC = -1;
  for (let t = -R * 2.2; t <= R * 2.2; t += R * 0.05) {
    const c = { x: M3.x + n3.x * t, y: M3.y + n3.y * t };
    if (!inBox(c, u(30)) || d(c, EC) < R * 1.25) continue;
    const score = Math.min(d(c, A), d(c, B), d(c, D));
    if (score > bestC) {
      bestC = score;
      C = c;
    }
  }

  // Pull back from TimeSignal's horizon to the whole planet.
  const pull = ramp(frame, 0, s(1.3), EASE.inOut);
  const k = Math.exp((1 - pull) * Math.log(6));
  const ox = lerp(phoneTS.x, P.x, pull);
  const oy = lerp(phoneTS.y, P.y, pull);
  const camera = `translate(${ox},${oy}) scale(${k}) translate(${-P.x},${-P.y})`;

  const grow = (start: number) => ramp(frame, start - s(0.25), s(0.9), EASE.inOut);
  const spheres = [
    { c: A, g: 1, n: 1, at: -s(1) },
    { c: B, g: grow(second), n: 2, at: second },
    { c: C, g: grow(third), n: 3, at: third },
    { c: D, g: grow(fourth), n: 4, at: fourth },
  ];
  const shellFill = ramp(frame, sphere - s(0.1), s(0.6));
  const ring = ramp(frame, circle - s(0.15), s(0.8), EASE.inOut);
  const pts = ramp(frame, points - s(0.1), s(0.4));
  const strike = ramp(frame, ground - s(0.1), s(0.45));
  const fix = ramp(frame, clock, s(0.5), EASE.out);
  const flash = interpolate(frame, [clock, clock + s(0.15), clock + s(0.9)], [0, 1, 0], clampOpts);

  const ringPath = Array.from({ length: 121 }, (_, i) => {
    const p = E(Math.PI * 0 + (i / 120) * 2 * Math.PI * ring);
    return `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join("");

  const legend = [
    { n: "1", t: "a sphere", at: sphere },
    { n: "2", t: "a circle", at: circle },
    { n: "3", t: "two points", at: points },
    { n: "4", t: "your clock", at: clock },
  ];
  const current = legend.reduce((acc, l, i) => (frame >= l.at - s(0.1) ? i : acc), -1);
  const ns = { vectorEffect: "non-scaling-stroke" as const };

  return (
    <>
      <Starfield opacity={0.7} zoom={1 + (k - 1) * 0.05} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g transform={camera}>
          {spheres.map((sp, i) =>
            sp.g > 0 ? (
              <circle
                key={i}
                cx={sp.c.x}
                cy={sp.c.y}
                r={d(sp.c, P) * sp.g}
                fill={theme.colors.positive}
                fillOpacity={0.05 * (i === 0 ? shellFill : sp.g)}
                stroke={flash > 0 ? theme.colors.accent : theme.colors.text}
                strokeOpacity={0.5 + 0.5 * flash}
                strokeWidth={u(1.6 + 1.6 * flash)}
                {...ns}
              />
            ) : null,
          )}
          <Globe cam={{ lon: 60, lat: 20, r: R, cx: EC.x, cy: EC.y }} />
          {ring > 0 ? (
            <path
              d={ringPath}
              fill="none"
              stroke={theme.colors.positive}
              strokeWidth={u(3)}
              opacity={1 - 0.6 * strike}
              {...ns}
            />
          ) : null}
          {spheres.map((sp, i) => (
            <g key={`s${i}`} opacity={i === 0 ? 1 : ramp(frame, sp.at - s(0.5), s(0.4))}>
              <Satellite x={sp.c.x} y={sp.c.y} size={u(48) / k} />
            </g>
          ))}
        </g>
        {pts > 0 ? (
          <g>
            <circle cx={Q.x} cy={Q.y} r={u(13)} fill="none" stroke={theme.colors.text} strokeWidth={u(2.5)} opacity={pts * (1 - 0.6 * strike)} />
            <g opacity={strike} stroke={theme.colors.negative} strokeWidth={u(3.5)} strokeLinecap="round">
              <line x1={Q.x - u(17)} y1={Q.y - u(17)} x2={Q.x + u(17)} y2={Q.y + u(17)} />
              <line x1={Q.x - u(17)} y1={Q.y + u(17)} x2={Q.x + u(17)} y2={Q.y - u(17)} />
            </g>
            <circle cx={P.x} cy={P.y} r={u(13)} fill="none" stroke={theme.colors.text} strokeWidth={u(2.5)} opacity={pts * (1 - strike)} />
          </g>
        ) : null}
        <BlueDot
          x={lerp(phoneTS.x, P.x, pull)}
          y={lerp(phoneTS.y, P.y, pull)}
          r={u(10)}
          opacity={Math.max(0.55, strike)}
          accuracy={u(46) * (1 - fix) * strike + u(10) * strike}
          pulse={fix > 0 ? (frame - clock) / s(1.4) : 0}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: Q.x + u(24),
          top: Q.y - u(12),
          opacity: strike,
        }}
      >
        <Label size={16} color={theme.colors.negative}>in space</Label>
      </div>
      {spheres.map((sp, i) => (
        <Mono
          key={`n${i}`}
          size={24}
          color={theme.colors.muted}
          style={{
            position: "absolute",
            left: sp.c.x + u(34),
            top: sp.c.y - u(46),
            opacity: pull * (i === 0 ? 1 : ramp(frame, sp.at - s(0.4), s(0.4))),
          }}
        >
          {sp.n}
        </Mono>
      ))}
      <div
        style={{
          position: "absolute",
          ...(landscape
            ? { left: W * 0.72, top: H * 0.34 }
            : square
              ? { left: W * 0.7, top: H * 0.66 }
              : { left: W * 0.1, top: H * 0.7 }),
          display: isVertical ? "flex" : "block",
          gap: u(30),
          flexWrap: "wrap",
        }}
      >
        {legend.map((l, i) => {
          const on = ramp(frame, l.at - s(0.1), s(0.35));
          const active = i === current;
          return (
            <div
              key={l.n}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: u(14),
                marginBottom: isVertical ? 0 : u(14),
                opacity: on * (active ? 1 : 0.4),
              }}
            >
              <Mono size={landscape ? 44 : isVertical ? 44 : 34} color={active ? theme.colors.accent : theme.colors.text}>
                {l.n}
              </Mono>
              <Label size={landscape ? 21 : isVertical ? 21 : 17} color={active ? theme.colors.text : undefined}>
                {l.t}
              </Label>
            </div>
          );
        })}
      </div>
      <Label size={15} style={{ position: "absolute", left: u(40), top: u(34), opacity: 0.75 * pull }}>
        Not to scale · spheres drawn as circles
      </Label>
      <Vignette />
    </>
  );
};
