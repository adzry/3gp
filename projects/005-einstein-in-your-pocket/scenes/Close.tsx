import { geoContains, geoEqualEarth, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { COUNTRIES } from "../../../src/lib/world";
import { useTheme } from "../../../src/styles";
import { useWordFrame } from "../../../src/video/scene-context";
import {
  BlueDot,
  EASE,
  SpokenLine,
  Starfield,
  Vignette,
  lerp,
  ramp,
  useFrameGeo,
  useSeconds,
} from "./art";
import { KL, NIGHT } from "./globe";

const LAND: FeatureCollection = { type: "FeatureCollection", features: COUNTRIES["110m"] };

/** Deterministic "phones": random points on land (not population data). */
const PHONES: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; out.length < 420 && i < 20000; i++) {
    const lon = -170 + random(`plon${i}`) * 340;
    const lat = -50 + random(`plat${i}`) * 115;
    if (geoContains(LAND, [lon, lat])) out.push([lon, lat]);
  }
  return out;
})();

/**
 * Every map, every dot. The world at night; blue dots bloom across the land
 * in a ripple outward from Kuala Lumpur on "every blue dot … every map".
 * On "proof that Einstein" the camera pushes into one dot — ours — the rest
 * fall away, and the last line lands word by word. It ends where the film
 * began: one dot in the dark.
 */
export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { W, H, u, dot, landscape, square, isVertical } = useFrameGeo();

  const blue = useWordFrame("blue dot", s(0.4));
  const map = useWordFrame("every map", s(1.1));
  const proof = useWordFrame("proof", s(2.9));

  const projection = geoEqualEarth().fitExtent(
    [
      [W * 0.03, H * (isVertical ? 0.3 : 0.1)],
      [W * 0.97, H * (isVertical ? 0.6 : 0.78)],
    ],
    LAND,
  );
  const kl = projection([KL.lon, KL.lat]) ?? [0, 0];
  const path = geoPath(projection);

  const push = ramp(frame, proof - s(0.2), s(1.6), EASE.inOut);
  const k = Math.exp(push * Math.log(7));
  const tx = lerp(kl[0], dot.x, push);
  const ty = lerp(kl[1], dot.y, push);
  const camera = `translate(${tx},${ty}) scale(${k}) translate(${-kl[0]},${-kl[1]})`;
  const mapIn = ramp(frame, 0, s(0.8));
  const others = 1 - ramp(frame, proof, s(0.9));
  const maxD = Math.hypot(W, H);
  const lineIn = ramp(frame, s(0.1), s(0.5));

  return (
    <>
      <Starfield opacity={0.4} zoom={1 + push * 0.4} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g transform={camera} opacity={mapIn}>
          <path
            d={path(LAND) ?? ""}
            fill={NIGHT.land}
            stroke={NIGHT.coast}
            strokeWidth={u(0.8) / k}
            opacity={1 - 0.7 * push}
          />
          {PHONES.map(([lon, lat], i) => {
            const p = projection([lon, lat]);
            if (!p) return null;
            const dist = Math.hypot(p[0] - kl[0], p[1] - kl[1]) / maxD;
            const wave = i % 3 === 0 ? blue : map;
            const on = ramp(frame, wave + dist * s(1.4), s(0.3));
            const tw = 0.75 + 0.25 * Math.sin(frame / 8 + i);
            return (
              <g key={i} opacity={on * others * tw}>
                <circle cx={p[0]} cy={p[1]} r={u(7) / k} fill={theme.colors.positive} opacity={0.18} />
                <circle cx={p[0]} cy={p[1]} r={u(2.6) / k} fill={theme.colors.positive} />
              </g>
            );
          })}
        </g>
        <BlueDot
          x={tx}
          y={ty}
          r={lerp(u(5), u(15), push)}
          pulse={frame / s(1.6)}
          opacity={ramp(frame, blue - s(0.2), s(0.3))}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: dot.y + u(landscape ? 110 : 130) + (1 - push) * u(isVertical ? 520 : 260),
          display: "flex",
          justifyContent: "center",
          padding: `0 ${u(90)}px`,
          opacity: lineIn,
        }}
      >
        <SpokenLine
          text="Every blue dot on every map is a small, daily proof that Einstein was right."
          accent={["Einstein"]}
          size={landscape ? 70 : square ? 58 : 70}
          align="center"
          style={{ maxWidth: u(landscape ? 1500 : 900) }}
        />
      </div>
      <Vignette strength={0.5 + 0.2 * push} />
    </>
  );
};
