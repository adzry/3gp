import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useTheme } from "../../../src/styles";
import { useScene, useWordFrame } from "../../../src/video/scene-context";
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
import { Horizon, Satellite, clockText, useSky } from "./sky";

/** 20,200 km ÷ 299,792.458 km/s. */
const DELAY = 0.06738;
/** Signals are drawn 20× slower than light so the eye can follow them. */
const SLOW = 20;
const SENT = 5; // the timestamp we follow: 12:00:05.000000

/**
 * Time becomes distance. The satellite's atomic clock runs; on "broadcasts"
 * amber wavefronts leave it; the one stamped 12:00:05 reaches the phone on
 * "hears", and the phone's own clock shows it arrived 0.067 s late. The
 * equation builds line by line on the narration — Δt, × c, = 20,200 km —
 * and the distance becomes a ring around the satellite: the first sphere.
 */
export const TimeSignal: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, u, sat, phone, earth, landscape, isVertical } = useSky();

  const clockAt = useWordFrame("atomic clock", s(1.05));
  const broadcast = useWordFrame("broadcasts", s(3.9));
  const hears = useWordFrame("hears", s(6.4));
  const late = useWordFrame("late", s(8));
  const light = useWordFrame("speed of light", s(10));
  const distance = useWordFrame("distance", s(11.7));

  // Arrive from the constellation push-in: big and central, then settle.
  const settle = ramp(frame, 0, s(1.1), EASE.out);
  const satX = lerp(W / 2, sat.x, settle);
  const satY = lerp(H * 0.42, sat.y, settle);
  const satSize = u(lerp(260, 96, settle));

  const dist = phone.y - sat.y;
  const travel = s(DELAY * SLOW);
  const keyEmit = hears - travel;
  const firstEmit = Math.min(broadcast, keyEmit - s(1.1));
  const period = s(0.55);
  const emits: number[] = [];
  for (let t = keyEmit; t >= firstEmit; t -= period) emits.unshift(t);
  for (let t = keyEmit + period; t < late + s(0.4); t += period) emits.push(t);

  const outro = ramp(frame, durationInFrames - s(0.5), s(0.45), EASE.in);
  const readouts = 1 - outro;
  const colX = sat.x + u(landscape ? 200 : 150);

  const satClock = ramp(frame, clockAt - s(0.1), s(0.4));
  const phoneIn = ramp(frame, hears - s(0.15), s(0.4));
  const dtIn = ramp(frame, late - s(0.05), s(0.4));
  const cIn = ramp(frame, light - s(0.05), s(0.4));
  const kmIn = ramp(frame, distance - s(0.1), s(0.45));
  const ruler = ramp(frame, distance - s(0.35), s(0.9), EASE.inOut);
  const ring = ramp(frame, distance + s(0.3), s(1.3), EASE.inOut);
  const phoneTime = (frame - hears) / s(1) / SLOW + SENT + DELAY;
  const satTime = (frame - keyEmit) / s(1) / SLOW + SENT;

  const circumference = 2 * Math.PI * dist;
  return (
    <>
      <Starfield opacity={0.6} zoom={1.1 - 0.1 * settle} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* The satellite's orbit, a dotted arc around the planet below. */}
        <circle
          cx={earth.x}
          cy={earth.y}
          r={earth.y - sat.y}
          fill="none"
          stroke={theme.colors.text}
          strokeOpacity={0.22}
          strokeWidth={u(1.4)}
          strokeDasharray={`${u(2)} ${u(9)}`}
          strokeDashoffset={-frame * u(0.6)}
        />
        {emits.map((t, i) => {
          const p = (frame - t) / travel;
          if (p <= 0 || p > 1.35) return null;
          const key = t === keyEmit;
          const fade = key ? 1 : 0.55;
          return (
            <circle
              key={i}
              cx={sat.x}
              cy={sat.y}
              r={p * dist}
              fill="none"
              stroke={theme.colors.accent}
              strokeWidth={u(key ? 2.6 : 1.6)}
              opacity={fade * interpolate(p, [0, 0.1, 1, 1.35], [0, 1, 0.9, 0], clampOpts)}
            />
          );
        })}
        {ring > 0 ? (
          <circle
            cx={sat.x}
            cy={sat.y}
            r={dist}
            fill="none"
            stroke={theme.colors.text}
            strokeOpacity={0.7}
            strokeWidth={u(1.8)}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ring)}
            transform={`rotate(90 ${sat.x} ${sat.y})`}
          />
        ) : null}
        <Horizon />
        {/* The distance as a dimension line, satellite → phone. */}
        <g opacity={ruler}>
          <line
            x1={sat.x - u(46)}
            y1={phone.y}
            x2={sat.x - u(46)}
            y2={phone.y - dist * ruler}
            stroke={theme.colors.accent}
            strokeWidth={u(2)}
          />
          <line x1={sat.x - u(58)} y1={phone.y} x2={sat.x - u(34)} y2={phone.y} stroke={theme.colors.accent} strokeWidth={u(2)} />
          <line
            x1={sat.x - u(58)}
            y1={phone.y - dist * ruler}
            x2={sat.x - u(34)}
            y2={phone.y - dist * ruler}
            stroke={theme.colors.accent}
            strokeWidth={u(2)}
          />
        </g>
        <Satellite x={satX} y={satY} size={satSize} light={0.6 + 0.4 * Math.sin(frame / 4) ** 2} />
        <BlueDot x={phone.x} y={phone.y} r={u(11)} halo={0.8} pulse={phoneIn > 0 ? (frame - hears) / s(1.2) : 0} />
      </svg>

      {/* Satellite clock */}
      <div style={{ position: "absolute", left: colX, top: sat.y - u(40), opacity: satClock * readouts }}>
        <Label size={17} color={theme.colors.accent}>Atomic clock · satellite</Label>
        <Mono size={34} style={{ marginTop: u(6) }}>
          {clockText(frame < keyEmit ? satTime : Math.max(SENT, satTime))}
        </Mono>
      </div>

      {/* The equation, one line per spoken beat */}
      <div
        style={{
          position: "absolute",
          left: colX,
          top: sat.y + (phone.y - sat.y) * (isVertical ? 0.3 : 0.28),
          opacity: readouts,
        }}
      >
        <div style={{ opacity: dtIn, transform: `translateX(${(1 - dtIn) * u(-16)}px)` }}>
          <Mono size={isVertical ? 44 : 52} color={theme.colors.accent}>
            Δt 0.067380 s
          </Mono>
        </div>
        <div style={{ opacity: cIn, transform: `translateX(${(1 - cIn) * u(-16)}px)`, marginTop: u(10) }}>
          <Mono size={isVertical ? 44 : 52} color={theme.colors.text}>
            × 299,792 km/s
          </Mono>
          <Label size={16} style={{ marginTop: u(4) }}>speed of light</Label>
        </div>
        <div
          style={{
            opacity: kmIn,
            transform: `translateX(${(1 - kmIn) * u(-16)}px)`,
            marginTop: u(16),
            borderTop: `${u(2)}px solid ${theme.colors.muted}`,
            paddingTop: u(12),
          }}
        >
          <Mono size={isVertical ? 52 : 64} color={theme.colors.accent}>
            = 20,200 km
          </Mono>
        </div>
      </div>

      {/* The phone's view */}
      <div
        style={{
          position: "absolute",
          left: colX,
          top: phone.y - u(isVertical ? 150 : 132),
          opacity: phoneIn * readouts,
        }}
      >
        <Label size={17} color={theme.colors.positive}>Your phone</Label>
        <div style={{ display: "flex", gap: u(18), alignItems: "baseline", marginTop: u(6) }}>
          <Label size={14}>stamp</Label>
          <Mono size={28} color={theme.colors.accent}>{clockText(SENT)}</Mono>
        </div>
        <div style={{ display: "flex", gap: u(18), alignItems: "baseline" }}>
          <Label size={14}>heard</Label>
          <Mono size={28}>{clockText(Math.max(SENT + DELAY, phoneTime))}</Mono>
        </div>
      </div>

      <Label
        size={15}
        style={{
          position: "absolute",
          left: sat.x - u(isVertical ? 20 : 400),
          top: (sat.y + phone.y) / 2 + u(isVertical ? 120 : 0),
          width: u(330),
          whiteSpace: "nowrap",
          textAlign: isVertical ? "left" : "right",
          opacity: interpolate(frame, [broadcast, broadcast + s(0.4), late + s(0.6), late + s(1)], [0, 0.9, 0.9, 0], clampOpts),
        }}
      >
        signal shown 20× slower
      </Label>
      <Vignette />
    </>
  );
};
