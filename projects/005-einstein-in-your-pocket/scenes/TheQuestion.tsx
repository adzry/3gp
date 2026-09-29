import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useTheme } from "../../../src/styles";
import { useScene, useWordFrame } from "../../../src/video/scene-context";
import { City } from "./city";
import { Globe, KL } from "./globe";
import {
  BlueDot,
  EASE,
  Label,
  SpokenLine,
  Starfield,
  Vignette,
  clampOpts,
  ramp,
  useFrameGeo,
  useSeconds,
} from "./art";

/**
 * The dot gets a place: a street plan draws itself outward from it and the
 * question lands word by word. On "at all?" the camera pulls straight up —
 * streets shrink to nothing and the planet takes their place, the dot still
 * at its centre (Kuala Lumpur). Continues without a cut into Constellation.
 */
export const R0 = (S: number) => S * 0.23;

export const TheQuestion: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, S, u, dot, landscape, square, safe } = useFrameGeo();

  const simpler = useWordFrame("simpler", s(1.3));
  const atAll = useWordFrame("at all", s(4.1));

  const streets = ramp(frame, s(0.2), s(2.4), EASE.out);
  const zoomStart = atAll + s(0.35);
  const e = ramp(frame, zoomStart, durationInFrames - zoomStart, EASE.inOut);

  // Street level: 100 m block = 80 px. Pulling up shrinks the city ~40×.
  const cityScale = u(0.8) * Math.exp(-e * Math.log(40));
  const cityOpacity = 1 - interpolate(e, [0.2, 0.55], [0, 1], clampOpts);
  const R = R0(S) * Math.exp((1 - e) * Math.log(70));
  const globeOpacity = interpolate(e, [0.08, 0.4], [0, 1], clampOpts);
  const textOut = interpolate(e, [0.15, 0.6], [0, 1], clampOpts);
  const kicker = ramp(frame, simpler - s(0.1), s(0.4));

  return (
    <>
      <Starfield opacity={0.35 + 0.4 * e} zoom={1.25 - 0.25 * e} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {globeOpacity > 0 ? (
          <g opacity={globeOpacity}>
            <Globe cam={{ lon: KL.lon, lat: KL.lat, r: R, cx: dot.x, cy: dot.y }} />
          </g>
        ) : null}
        {cityOpacity > 0 ? (
          <City
            cx={dot.x}
            cy={dot.y}
            scale={cityScale}
            reveal={streets}
            color={theme.colors.text}
            water="#16254f"
            opacity={cityOpacity}
          />
        ) : null}
        <BlueDot
          x={dot.x}
          y={dot.y}
          r={u(15) - u(6) * e}
          pulse={frame / s(1.6)}
          halo={1 - 0.5 * e}
          accuracy={u(70) * streets * (1 - e)}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: safe.x,
          right: safe.x,
          top: landscape ? u(120) : square ? u(90) : H * 0.13,
          textAlign: "center",
          opacity: 1 - textOut,
          transform: `translateY(${-textOut * u(30)}px)`,
        }}
      >
        <Label style={{ opacity: kicker, marginBottom: u(18) }}>
          Start with a simpler question
        </Label>
        <SpokenLine
          text="How does it know where you are at all?"
          accent={["all?"]}
          accentColor={theme.colors.positive}
          size={landscape ? 78 : square ? 64 : 80}
          align="center"
        />
      </div>
      <Label
        size={18}
        style={{
          position: "absolute",
          right: safe.x,
          bottom: safe.y * 0.6,
          opacity: 0.8 * streets * (1 - textOut),
        }}
      >
        Street plan: illustrative
      </Label>
      <Vignette />
    </>
  );
};
