/**
 * The night Earth and its GPS orbits, drawn with one orthographic camera so
 * the globe (d3-geo) and the 3D orbit geometry line up exactly.
 */
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import React from "react";
import { COUNTRIES } from "../../../src/lib/world";

export const KL = { lon: 101.69, lat: 3.14 };
/** GPS orbit radius in Earth radii: (6,371 + 20,200) / 6,371. */
export const ORBIT_RATIO = (6371 + 20200) / 6371;
export const INCLINATION = 55;

export const NIGHT = {
  ocean: "#0f1731",
  land: "#1d2748",
  coast: "#3a4a7a",
  grat: "#1a2446",
  rim: "#4ea8ff",
};

const LAND: FeatureCollection = {
  type: "FeatureCollection",
  features: COUNTRIES["110m"],
};
const GRATICULE = geoGraticule10();

const DEG = Math.PI / 180;

export type Camera = {
  lon: number;
  lat: number;
  r: number;
  cx: number;
  cy: number;
};

/** 3D point (Earth radii; x→lon 0, z→north) → screen [x, y] + depth (>0 faces camera). */
export const project = (c: Camera, p: [number, number, number]) => {
  const l = c.lon * DEG;
  const e = c.lat * DEG;
  const v = [Math.cos(e) * Math.cos(l), Math.cos(e) * Math.sin(l), Math.sin(e)];
  const right = [-Math.sin(l), Math.cos(l), 0];
  const up = [-Math.sin(e) * Math.cos(l), -Math.sin(e) * Math.sin(l), Math.cos(e)];
  const dot = (a: number[]) => a[0] * p[0] + a[1] * p[1] + a[2] * p[2];
  return {
    x: c.cx + dot(right) * c.r,
    y: c.cy - dot(up) * c.r,
    depth: dot(v),
  };
};

/** Lon/lat on the surface (or at `alt` Earth radii) → 3D point. */
export const surface = (
  lon: number,
  lat: number,
  alt = 1,
): [number, number, number] => [
  alt * Math.cos(lat * DEG) * Math.cos(lon * DEG),
  alt * Math.cos(lat * DEG) * Math.sin(lon * DEG),
  alt * Math.sin(lat * DEG),
];

/** A point of an orbit (plane RAAN `node`°, argument `u`°), in Earth radii. */
export const orbitPoint = (
  node: number,
  u: number,
  radius = ORBIT_RATIO,
  inc = INCLINATION,
): [number, number, number] => {
  const U = u * DEG;
  const O = node * DEG;
  const I = inc * DEG;
  return [
    radius * (Math.cos(U) * Math.cos(O) - Math.sin(U) * Math.cos(I) * Math.sin(O)),
    radius * (Math.cos(U) * Math.sin(O) + Math.sin(U) * Math.cos(I) * Math.cos(O)),
    radius * Math.sin(U) * Math.sin(I),
  ];
};

/** The globe itself: ocean disc, graticule, land, atmosphere rim. */
export const Globe: React.FC<{
  cam: Camera;
  landOpacity?: number;
  strokeScale?: number;
}> = ({ cam, landOpacity = 1, strokeScale = 1 }) => {
  const projection = geoOrthographic()
    .rotate([-cam.lon, -cam.lat])
    .scale(cam.r)
    .translate([cam.cx, cam.cy])
    .clipAngle(90);
  const path = geoPath(projection);
  const sw = Math.max(0.6, cam.r / 260) * strokeScale;
  const id = `g${Math.round(cam.r)}`;
  return (
    <g>
      <defs>
        <radialGradient
          id={`atmo${id}`}
          cx={cam.cx}
          cy={cam.cy}
          r={cam.r * 1.16}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0.84} stopColor={NIGHT.rim} stopOpacity={0} />
          <stop offset={0.87} stopColor={NIGHT.rim} stopOpacity={0.28} />
          <stop offset={1} stopColor={NIGHT.rim} stopOpacity={0} />
        </radialGradient>
        <radialGradient
          id={`shade${id}`}
          cx={cam.cx - cam.r * 0.35}
          cy={cam.cy - cam.r * 0.4}
          r={cam.r * 1.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0} stopColor="#9fc4ff" stopOpacity={0.1} />
          <stop offset={0.55} stopColor="#000" stopOpacity={0} />
          <stop offset={1} stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <circle cx={cam.cx} cy={cam.cy} r={cam.r * 1.16} fill={`url(#atmo${id})`} />
      <circle cx={cam.cx} cy={cam.cy} r={cam.r} fill={NIGHT.ocean} />
      <path
        d={path(GRATICULE) ?? ""}
        fill="none"
        stroke={NIGHT.grat}
        strokeWidth={sw}
      />
      <path
        d={path(LAND) ?? ""}
        fill={NIGHT.land}
        stroke={NIGHT.coast}
        strokeWidth={sw}
        opacity={landOpacity}
      />
      <circle cx={cam.cx} cy={cam.cy} r={cam.r} fill={`url(#shade${id})`} />
      <circle
        cx={cam.cx}
        cy={cam.cy}
        r={cam.r}
        fill="none"
        stroke={NIGHT.rim}
        strokeOpacity={0.45}
        strokeWidth={Math.max(0.8, cam.r * 0.006)}
      />
    </g>
  );
};

/** An orbit ring split into its far (behind the globe) and near halves. */
export const orbitSegments = (
  cam: Camera,
  node: number,
  reveal = 1,
  steps = 180,
) => {
  const back: string[] = [];
  const front: string[] = [];
  let cur: { side: "back" | "front"; pts: string[] } | null = null;
  const flush = () => {
    if (cur && cur.pts.length > 1)
      (cur.side === "back" ? back : front).push(`M${cur.pts.join("L")}`);
  };
  const last = Math.round(steps * Math.min(1, reveal));
  for (let k = 0; k <= last; k++) {
    const p = project(cam, orbitPoint(node, (k / steps) * 360 + node * 0.5));
    const side = p.depth < 0 ? "back" : "front";
    const pt = `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    if (!cur || cur.side !== side) {
      if (cur) cur.pts.push(pt);
      flush();
      cur = { side, pts: [pt] };
    } else cur.pts.push(pt);
  }
  flush();
  return { back, front };
};
