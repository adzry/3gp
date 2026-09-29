import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useLayout } from "../../../src/lib/layout";
import { useTheme } from "../../../src/styles";
import { useScene, useWordFrame } from "../../../src/video/scene-context";
import {
  EASE,
  Label,
  Starfield,
  Vignette,
  clampOpts,
  lerp,
  ramp,
  useFrameGeo,
  useSeconds,
} from "./art";
import { Satellite } from "./sky";

const NOMINAL = "10.230 000 000 00";
const OFFSET = "10.229 999 995 43"; // IS-GPS: 10.22999999543 MHz

/** One odometer digit rolling from `a` to `b` (0–1), vertically. */
const RollDigit: React.FC<{
  a: string;
  b: string;
  p: number;
  size: number;
  color: string;
  changed: string;
}> = ({ a, b, p, size, color, changed }) => {
  const theme = useTheme();
  if (!/\d/.test(a)) {
    return <span style={{ display: "inline-block", width: a === " " ? "0.3em" : undefined }}>{a}</span>;
  }
  const from = Number(a);
  const to = Number(b);
  const down = to < from;
  const v = lerp(from, to, p);
  const lo = Math.floor(v);
  const frac = v - lo;
  const moved = a !== b;
  return (
    <span
      style={{
        display: "inline-block",
        height: size * 1.1,
        overflow: "hidden",
        verticalAlign: "top",
        position: "relative",
        width: "0.62em",
        color: moved && p > 0 ? changed : color,
        fontFamily: theme.fonts.mono,
      }}
    >
      {[lo, (lo + 1) % 10].map((n, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translateY(${(i - frac) * size * 1.1 * (down ? 1 : 1)}px)`,
          }}
        >
          {n}
        </span>
      ))}
    </span>
  );
};

const Readout: React.FC<{ from: string; to: string; p: number; size: number; color: string; changed: string }> = ({
  from,
  to,
  p,
  size,
  color,
  changed,
}) => {
  const { u } = useLayout();
  return (
    <div style={{ fontSize: u(size), lineHeight: 1.1, whiteSpace: "nowrap", color, fontFamily: "JetBrains Mono" }}>
      {from.split("").map((c, i) => (
        <RollDigit
          key={i}
          a={c}
          b={to[i]}
          // Digits ripple right-to-left, like a real counter settling.
          p={Math.min(1, Math.max(0, p * 1.6 - (i / from.length) * 0.6))}
          size={u(size)}
          color={color}
          changed={changed}
        />
      ))}
      <span style={{ fontSize: "0.42em", marginLeft: "0.4em" }}>MHz</span>
    </div>
  );
};

/**
 * The fix. A satellite clock's frequency, big: on "tuned … slightly slow" it
 * rolls down to the value from the GPS spec, 10.22999999543 MHz ("on the
 * ground"). On "in orbit" the whole readout lifts off and rolls back to
 * 10.23 — relativity doing the rest. Two tick tracks, orbit and ground,
 * slip against each other until "in step", when they lock and flash.
 */
export const Tuned: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, u, landscape, isVertical, square } = useFrameGeo();

  const tuned = useWordFrame("tuned", s(1));
  const slow = useWordFrame("slightly slow", s(1.6));
  const ground = useWordFrame("ground", s(2.6));
  const orbit = useWordFrame("in orbit", s(3.6));
  const step = useWordFrame("in step", s(4.6));

  const intro = ramp(frame, 0, s(0.6));
  const down = ramp(frame, tuned, slow - tuned + s(0.8), EASE.inOut);
  const lift = ramp(frame, orbit - s(0.2), s(1), EASE.inOut);
  const up = ramp(frame, orbit + s(0.3), s(1.1), EASE.inOut);
  const lock = ramp(frame, step - s(0.2), s(0.6), EASE.out);
  const flash = interpolate(frame, [step + s(0.3), step + s(0.45), step + s(1.2)], [0, 1, 0], clampOpts);
  const ticksIn = ramp(frame, orbit + s(0.4), s(0.5));
  const outro = ramp(frame, durationInFrames - s(0.5), s(0.45), EASE.in);

  const size = landscape ? 108 : square ? 84 : 76;
  const blockY = H * (isVertical ? 0.36 : 0.42) - lift * u(isVertical ? 120 : 130);
  const inOrbit = up > 0;

  // Tick tracks.
  const trackW = W * (landscape ? 0.64 : 0.84);
  const tx0 = (W - trackW) / 2;
  const spacing = u(64);
  const scroll = (frame * u(3)) % spacing;
  const slip = (1 - lock) * (Math.sin(frame / 9) * spacing * 0.35 + spacing * 0.3);
  const trackY = H * (isVertical ? 0.56 : 0.66);
  const n = Math.floor(trackW / spacing) + 2;

  return (
    <>
      <Starfield opacity={0.5} pan={[0, lift * u(40)]} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <g opacity={lift}>
          <Satellite x={W / 2} y={blockY - u(110)} size={u(80)} />
        </g>
        <g opacity={ticksIn}>
          {[0, 1].map((row) => {
            const y = trackY + row * u(70);
            return (
              <g key={row}>
                <line x1={tx0} y1={y} x2={tx0 + trackW} y2={y} stroke={theme.colors.muted} strokeOpacity={0.4} strokeWidth={u(1.2)} />
                {Array.from({ length: n }, (_, k) => {
                  const x = tx0 + k * spacing - scroll + (row === 0 ? slip : 0);
                  if (x < tx0 || x > tx0 + trackW) return null;
                  return (
                    <line
                      key={k}
                      x1={x}
                      y1={y - u(22)}
                      x2={x}
                      y2={y + u(22)}
                      stroke={row === 0 ? theme.colors.accent : theme.colors.text}
                      strokeWidth={u(3.5)}
                    />
                  );
                })}
                {row === 0 && flash > 0
                  ? Array.from({ length: n }, (_, k) => {
                      const x = tx0 + k * spacing - scroll;
                      if (x < tx0 || x > tx0 + trackW) return null;
                      return (
                        <line key={`f${k}`} x1={x} y1={y} x2={x} y2={y + u(70)} stroke={theme.colors.accent} strokeWidth={u(1.5)} opacity={flash} />
                      );
                    })
                  : null}
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: trackY - u(56), opacity: ticksIn * (1 - outro) }}>
        <Label size={17} color={theme.colors.accent} style={{ position: "absolute", left: tx0 }}>
          orbit
        </Label>
        <Label size={17} style={{ position: "absolute", left: tx0, top: u(70) + u(56) + u(28) }}>
          ground
        </Label>
        <Label
          size={15}
          color={theme.colors.accent}
          style={{ position: "absolute", right: tx0, opacity: lock }}
        >
          in step
        </Label>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: blockY,
          textAlign: "center",
          opacity: intro * (1 - outro),
        }}
      >
        <Label size={18} style={{ marginBottom: u(14) }} color={inOrbit ? theme.colors.text : theme.colors.muted}>
          {inOrbit ? "In orbit, as seen from Earth" : frame > ground - s(0.2) ? "Set on the ground, before launch" : "Satellite clock frequency"}
        </Label>
        <div style={{ display: "inline-block" }}>
          <Readout
            from={inOrbit ? OFFSET : NOMINAL}
            to={inOrbit ? NOMINAL : OFFSET}
            p={inOrbit ? up : down}
            size={size}
            color={theme.colors.text}
            changed={inOrbit ? theme.colors.text : theme.colors.accent}
          />
        </div>
      </div>
      <Label
        size={14}
        style={{ position: "absolute", left: 0, right: 0, textAlign: "center", bottom: isVertical ? H * 0.2 : u(30), opacity: 0.7 * intro * (1 - outro) }}
      >
        Frequency offset from the GPS interface specification (IS-GPS)
      </Label>
      <Vignette />
    </>
  );
};
