/**
 * The "sky" set shared by TimeSignal and Trilateration: a curved horizon,
 * the phone on it, and the first satellite straight above. Keeping one
 * geometry lets the range ring that ends TimeSignal BE the first sphere of
 * Trilateration.
 */
import React from "react";
import { useTheme } from "../../../src/styles";
import { useFrameGeo } from "./art";

export type Pt = { x: number; y: number };

export const useSky = () => {
  const g = useFrameGeo();
  const { W, H, S, landscape, square } = g;
  const horizonY = H * (landscape ? 0.72 : square ? 0.74 : 0.64);
  const pathX = W * (landscape ? 0.42 : square ? 0.36 : 0.3);
  const earthR = S * 3.2;
  const earth = { x: pathX, y: horizonY + earthR };
  const phone: Pt = { x: pathX, y: horizonY };
  const sat: Pt = { x: pathX, y: H * (landscape ? 0.15 : square ? 0.15 : 0.13) };
  return { ...g, horizonY, earth, earthR, phone, sat };
};

/** The ground: a huge Earth whose top edge is the horizon, with a glow line. */
export const Horizon: React.FC<{ opacity?: number; glow?: number }> = ({
  opacity = 1,
  glow = 0,
}) => {
  const { earth, earthR, u } = useSky();
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient
          id="groundFade"
          cx={earth.x}
          cy={earth.y}
          r={earthR}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0.9} stopColor="#0d1430" stopOpacity={1} />
          <stop offset={1} stopColor="#16214a" stopOpacity={1} />
        </radialGradient>
      </defs>
      <circle cx={earth.x} cy={earth.y} r={earthR} fill="url(#groundFade)" />
      <circle
        cx={earth.x}
        cy={earth.y}
        r={earthR}
        fill="none"
        stroke="#4ea8ff"
        strokeOpacity={0.35 + 0.4 * glow}
        strokeWidth={u(1.5 + 2 * glow)}
      />
    </g>
  );
};

/** A GPS satellite in hairlines: body, two ruled solar wings, the clock light. */
export const Satellite: React.FC<{
  x: number;
  y: number;
  size: number;
  light?: number;
  opacity?: number;
}> = ({ x, y, size, light = 1, opacity = 1 }) => {
  const theme = useTheme();
  const b = size * 0.36;
  const wing = size * 0.9;
  const wh = size * 0.34;
  const stroke = theme.colors.text;
  const sw = Math.max(1, size * 0.028);
  const ribs = [0.25, 0.5, 0.75];
  return (
    <g opacity={opacity}>
      {[-1, 1].map((side) => {
        const x0 = side < 0 ? x - b - size * 0.08 - wing : x + b + size * 0.08;
        return (
          <g key={side}>
            <line
              x1={side < 0 ? x - b : x + b}
              y1={y}
              x2={side < 0 ? x0 + wing : x0}
              y2={y}
              stroke={stroke}
              strokeWidth={sw}
            />
            <rect
              x={x0}
              y={y - wh / 2}
              width={wing}
              height={wh}
              fill="#16214a"
              stroke={stroke}
              strokeWidth={sw}
            />
            {ribs.map((r) => (
              <line
                key={r}
                x1={x0 + wing * r}
                y1={y - wh / 2}
                x2={x0 + wing * r}
                y2={y + wh / 2}
                stroke={stroke}
                strokeOpacity={0.5}
                strokeWidth={sw * 0.7}
              />
            ))}
          </g>
        );
      })}
      <rect
        x={x - b}
        y={y - b}
        width={b * 2}
        height={b * 2}
        fill={theme.colors.background}
        stroke={stroke}
        strokeWidth={sw}
      />
      <circle cx={x} cy={y} r={b * 0.9} fill={theme.colors.accent} opacity={0.18 * light} />
      <circle cx={x} cy={y} r={b * 0.32} fill={theme.colors.accent} opacity={light} />
    </g>
  );
};

/** Clock time as a readout: 12:00:05.067380 (hh:mm:ss.µµµµµµ). */
export const clockText = (seconds: number) => {
  const total = 12 * 3600 + seconds;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const us = Math.round((total - Math.floor(total)) * 1e6) % 1e6;
  const p = (n: number, w: number) => String(n).padStart(w, "0");
  return `${p(h, 2)}:${p(m, 2)}:${p(s, 2)}.${p(us, 6)}`;
};
