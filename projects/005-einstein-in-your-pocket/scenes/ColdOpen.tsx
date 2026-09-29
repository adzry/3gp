import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useTheme } from "../../../src/styles";
import { useScene, useWordFrame } from "../../../src/video/scene-context";
import {
  BlueDot,
  EASE,
  SpokenLine,
  Starfield,
  Vignette,
  clampOpts,
  ramp,
  useFrameGeo,
  useSeconds,
} from "./art";

/**
 * Darkness, one blue dot. As the narrator says "correcting", a red ghost of
 * the dot slides away — the error GPS is fighting — and on "Einstein" it is
 * pulled back, with an amber flash. The whole film in five seconds.
 */
export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, u, dot, landscape, square } = useFrameGeo();

  const correcting = useWordFrame("correcting", s(2));
  const einstein = useWordFrame("Einstein", s(2.8));

  const dotIn = ramp(frame, s(0.1), s(0.5));
  const drift = ramp(frame, correcting, einstein - correcting, EASE.inOut);
  const snap = ramp(frame, einstein, s(0.35), EASE.out);
  const ghostOffset = u(170) * drift * (1 - snap);
  const ghostOpacity = interpolate(drift, [0, 0.2], [0, 0.85], clampOpts) * (1 - snap);
  const flash = snap > 0 && snap < 1 ? 1 - snap : 0;
  const textOut = ramp(frame, durationInFrames - s(0.55), s(0.5), EASE.in);

  const r = u(15);
  return (
    <>
      <Starfield opacity={0.35 * dotIn} zoom={1 + frame / 2400} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <line
          x1={dot.x}
          y1={dot.y}
          x2={dot.x + ghostOffset}
          y2={dot.y - ghostOffset * 0.35}
          stroke={theme.colors.negative}
          strokeWidth={u(2)}
          strokeDasharray={`${u(4)} ${u(6)}`}
          opacity={ghostOpacity * 0.8}
        />
        <circle
          cx={dot.x + ghostOffset}
          cy={dot.y - ghostOffset * 0.35}
          r={r}
          fill={theme.colors.negative}
          fillOpacity={0.35}
          stroke={theme.colors.negative}
          strokeWidth={u(2.5)}
          opacity={ghostOpacity}
        />
        {flash > 0 ? (
          <circle
            cx={dot.x}
            cy={dot.y}
            r={r * (1.4 + snap * 4)}
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth={u(3)}
            opacity={flash}
          />
        ) : null}
        <BlueDot
          x={dot.x}
          y={dot.y}
          r={r * dotIn}
          pulse={frame > s(0.6) ? (frame - s(0.6)) / s(1.6) : 0}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: dot.y + u(landscape ? 110 : 130),
          display: "flex",
          justifyContent: "center",
          padding: `0 ${u(90)}px`,
          opacity: 1 - textOut,
          transform: `translateY(${-textOut * u(20)}px)`,
        }}
      >
        <SpokenLine
          text="Right now, the phone in your pocket is correcting for Einstein."
          accent={["Einstein."]}
          size={landscape ? 84 : square ? 70 : 88}
          align="center"
          style={{ maxWidth: u(landscape ? 1500 : 900) }}
        />
      </div>
      <Vignette />
    </>
  );
};
