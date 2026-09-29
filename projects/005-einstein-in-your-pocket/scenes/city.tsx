/**
 * An illustrative street plan measured in METRES around the phone (0, 0):
 * 100 m blocks, avenues every 500 m, one river. Drawn at any scale, so the
 * same city carries the question (street level), the 300 m error and the
 * 10 km drift. It is schematic — scenes label it so.
 */
import React from "react";
import { random } from "remotion";

export const BLOCK = 100;
/** The street plan runs off-axis, like a real city on a north-up map. */
export const CITY_ROTATION = -14;

/** A point in the city (metres) → screen, for things that sit ON the streets. */
export const cityToScreen = (
  mx: number,
  my: number,
  cx: number,
  cy: number,
  scale: number,
) => {
  const a = (CITY_ROTATION * Math.PI) / 180;
  return {
    x: cx + (mx * Math.cos(a) - my * Math.sin(a)) * scale,
    y: cy + (mx * Math.sin(a) + my * Math.cos(a)) * scale,
  };
};
const EXTENT = 40000;

type Street = { vertical: boolean; offset: number; major: boolean; tilt: number };

const STREETS: Street[] = (() => {
  const out: Street[] = [];
  for (let k = -EXTENT / BLOCK; k <= EXTENT / BLOCK; k++) {
    for (const vertical of [true, false]) {
      const major = k % 5 === 0;
      // Minor streets thin out with distance, so the far city stays calm.
      if (!major && Math.abs(k) > 60) continue;
      // Far out, even avenues thin out: a city dissolving into country.
      if (Math.abs(k) > 120 && random(`far${k}${vertical}`) > 0.5) continue;
      out.push({
        vertical,
        offset: k * BLOCK + (major ? 0 : (random(`j${k}${vertical}`) - 0.5) * 18),
        major,
        tilt: (random(`t${k}${vertical}`) - 0.5) * 0.012,
      });
    }
  }
  return out;
})();

/** River centreline (metres), a lazy S through the city. */
const RIVER: [number, number][] = Array.from({ length: 60 }, (_, i) => {
  const y = -EXTENT + (i / 59) * EXTENT * 2;
  return [650 + Math.sin(y / 1900) * 900 + Math.sin(y / 700) * 120, y];
});

export const City: React.FC<{
  /** Screen position of (0, 0) m. */
  cx: number;
  cy: number;
  /** Pixels per metre. */
  scale: number;
  /** 0–1: streets reveal outward from the centre. */
  reveal?: number;
  color: string;
  water: string;
  opacity?: number;
  strokeScale?: number;
}> = ({ cx, cy, scale, reveal = 1, color, water, opacity = 1, strokeScale = 1 }) => {
  // Streets draw outward from the phone over the first ~2.5 km.
  const reach = reveal >= 1 ? Infinity : reveal * 2500;
  const X = (m: number) => cx + m * scale;
  const Y = (m: number) => cy + m * scale;
  const river = RIVER.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join("L");
  return (
    <g opacity={opacity} transform={`rotate(${CITY_ROTATION} ${cx} ${cy})`}>
      <path
        d={`M${river}`}
        fill="none"
        stroke={water}
        strokeWidth={Math.max(1.5, 70 * scale)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={Math.min(1, reveal * 1.5)}
      />
      {STREETS.map((s, i) => {
        const d = Math.abs(s.offset);
        if (d > reach) return null;
        const fade = Math.min(1, (reach - d) / 250);
        const L = EXTENT;
        const a = s.vertical
          ? [X(s.offset - L * s.tilt), Y(-L), X(s.offset + L * s.tilt), Y(L)]
          : [X(-L), Y(s.offset + L * s.tilt), X(L), Y(s.offset - L * s.tilt)];
        return (
          <line
            key={i}
            x1={a[0]}
            y1={a[1]}
            x2={a[2]}
            y2={a[3]}
            stroke={color}
            strokeOpacity={(s.major ? 0.3 : 0.1) * fade}
            strokeWidth={(s.major ? 1.8 : 1) * strokeScale}
          />
        );
      })}
    </g>
  );
};
