import React from "react";
import { useCurrentFrame } from "remotion";
import { useTheme } from "../../../src/styles";
import { useScene, useWordFrame } from "../../../src/video/scene-context";
import { Globe } from "./globe";
import {
  EASE,
  Label,
  Mono,
  Starfield,
  Vignette,
  lerp,
  ramp,
  useFrameGeo,
  useSeconds,
} from "./art";

const SPEED_BLUE = "#7fa6e8";

/** A clock face with one sweeping hand (degrees). */
const Dial: React.FC<{
  x: number;
  y: number;
  r: number;
  angle: number;
  color: string;
  ghost?: number;
  ghostColor?: string;
}> = ({ x, y, r, angle, color, ghost, ghostColor }) => {
  const theme = useTheme();
  const hand = (a: number, len: number) => ({
    x2: x + Math.sin((a * Math.PI) / 180) * len,
    y2: y - Math.cos((a * Math.PI) / 180) * len,
  });
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={theme.colors.background} stroke={theme.colors.text} strokeOpacity={0.5} strokeWidth={r * 0.04} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * 2 * Math.PI;
        return (
          <line
            key={i}
            x1={x + Math.sin(a) * r * 0.82}
            y1={y - Math.cos(a) * r * 0.82}
            x2={x + Math.sin(a) * r * 0.94}
            y2={y - Math.cos(a) * r * 0.94}
            stroke={theme.colors.text}
            strokeOpacity={0.5}
            strokeWidth={r * 0.035}
          />
        );
      })}
      {ghost !== undefined ? (
        <line x1={x} y1={y} {...hand(ghost, r * 0.78)} stroke={ghostColor} strokeOpacity={0.45} strokeWidth={r * 0.05} strokeLinecap="round" />
      ) : null}
      <line x1={x} y1={y} {...hand(angle, r * 0.8)} stroke={color} strokeWidth={r * 0.07} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r * 0.08} fill={color} />
    </g>
  );
};

/**
 * Why the clocks disagree, and by how much. A gravity well: Earth at the
 * bottom, the satellite racing round a flatter, higher ring. Two dials —
 * ground and satellite. On "move fast" the satellite streaks and its clock
 * lags; the −7 bar grows on "seven". On "higher in Earth's gravity" the well
 * lights up, the clock runs ahead, +45 grows on "forty five". Then the net:
 * −7 slides over and cancels part of +45, leaving +38 — and a 24-hour dial
 * sweeps round it on "every single day".
 */
export const Relativity: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, S, u, landscape, square, safe } = useFrameGeo();

  const differently = useWordFrame("differently", s(2));
  const fast = useWordFrame("move fast", s(4.1));
  const slows = useWordFrame("slows", s(5));
  const seven = useWordFrame("seven", s(6.2));
  const higher = useWordFrame("higher", s(8.7));
  const gravity = useWordFrame("gravity", s(9.5));
  const speeds = useWordFrame("speeds", s(10.4));
  const fortyFive = useWordFrame("forty five", s(11.4));
  const net = useWordFrame("Net result", s(13));
  const thirtyEight = useWordFrame("thirty eight", s(13.9));
  const everyDay = useWordFrame("every single day", s(15.9));

  // --- The gravity well -------------------------------------------------
  const wcx = W * 0.5;
  const wcy = H * (landscape ? 0.1 : square ? 0.1 : 0.09);
  const span = landscape ? S * 0.62 : square ? W * 0.44 : W * 0.6;
  const r0 = span * 0.07;
  const depthMax = S * (landscape ? 0.33 : square ? 0.3 : 0.42);
  // A log-spaced funnel: steep near the Earth, nearly flat far out.
  const depth = (r: number) => depthMax * (r0 / r) ** 0.85;
  const tilt = 0.24;
  const rings = Array.from({ length: 10 }, (_, k) => r0 * 1.33 ** k);
  const rSat = rings[7];
  const intro = ramp(frame, 0, s(1.2), EASE.out);
  const wellOut = ramp(frame, net - s(0.1), s(0.7), EASE.in);
  const wellGlow = ramp(frame, gravity - s(0.1), s(0.6)) * (1 - ramp(frame, speeds + s(1.5), s(0.8)));
  const streak = ramp(frame, fast - s(0.15), s(0.4)) * (1 - ramp(frame, higher, s(0.6)));
  // Satellite: steady orbit, visibly quicker while "fast" is the subject.
  let phi = 0;
  for (let f = 0; f < frame; f++) phi += 0.02 + 0.03 * ramp(f, fast - s(0.15), s(0.4)) * (1 - ramp(f, higher, s(0.6)));
  const satPos = (a: number) => ({
    x: wcx + rSat * Math.cos(a),
    y: wcy + depth(rSat) + rSat * tilt * Math.sin(a),
  });
  const sat = satPos(phi);
  const earthY = wcy + depth(r0) + r0 * 0.55;

  // --- The two clocks ----------------------------------------------------
  const base = frame * 3;
  const lag = ramp(frame, slows, s(0.8)) * -14;
  const lead = ramp(frame, speeds, s(0.9)) * 64;
  const satAngle = base + lag + lead;
  const dialR = u(landscape ? 58 : 46);
  // Each clock sits where it lives: one deep in the well, one up on the orbit.
  const dials = [
    { x: wcx - r0 * 1.6 - dialR * 1.4, y: earthY },
    { x: Math.min(W - dialR * 1.6, wcx + rSat + dialR * 2.3), y: wcy + depth(rSat) - dialR * 0.6 },
  ];
  const dialIn = ramp(frame, s(0.3), s(0.6)) * (1 - wellOut);
  const diff = ramp(frame, differently - s(0.2), s(0.6));

  // --- The number line (µs per day) --------------------------------------
  const axisY = H * (landscape ? 0.74 : square ? 0.76 : 0.6);
  const x0 = W * (landscape ? 0.14 : 0.08);
  const x1 = W * (landscape ? 0.86 : 0.92);
  const vMin = -10;
  const vMax = 50;
  const X = (v: number) => lerp(x0, x1, (v - vMin) / (vMax - vMin));
  const axisIn = ramp(frame, slows - s(0.4), s(0.6));
  const sevenP = ramp(frame, seven - s(0.1), s(0.7));
  const fortyP = ramp(frame, fortyFive - s(0.1), s(0.9));
  const cancel = ramp(frame, net + s(0.1), s(0.9), EASE.inOut);
  const merge = ramp(frame, net + s(0.9), s(0.5), EASE.inOut);
  const barH = u(landscape ? 34 : 30);
  // −7 bar: at [−7, 0], slides to [38, 45] to cancel, then disappears.
  const sevenFrom = lerp(-7, 38, cancel);
  const sevenTo = lerp(0, 45, cancel);
  const gravityTo = lerp(45, 38, merge);
  const bigIn = ramp(frame, thirtyEight - s(0.1), s(0.5));
  const dayP = ramp(frame, everyDay, s(1.3), EASE.inOut);
  const count = Math.round(38 * ramp(frame, thirtyEight - s(0.1), s(0.8), EASE.out));

  const ringColor = theme.colors.text;
  return (
    <>
      <Starfield opacity={0.45} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* Well: rings + radial lines */}
        <g opacity={intro * (1 - wellOut)}>
          {rings.map((r, i) => (
            <ellipse
              key={i}
              cx={wcx}
              cy={wcy + depth(r)}
              rx={r}
              ry={r * tilt}
              fill="none"
              stroke={i < 3 ? theme.colors.positive : ringColor}
              strokeOpacity={(i < 3 ? 0.35 + 0.5 * wellGlow : 0.16) + (i === 6 ? 0.2 : 0)}
              strokeWidth={u(i === 6 ? 1.8 : 1.2)}
            />
          ))}
          {Array.from({ length: 16 }, (_, k) => {
            const a = (k / 16) * 2 * Math.PI;
            const pts = rings
              .map((r) => `${(wcx + r * Math.cos(a)).toFixed(1)},${(wcy + depth(r) + r * tilt * Math.sin(a)).toFixed(1)}`)
              .join("L");
            return (
              <path key={k} d={`M${pts}`} fill="none" stroke={ringColor} strokeOpacity={0.1 + 0.15 * wellGlow} strokeWidth={u(1)} />
            );
          })}
          <Globe cam={{ lon: 101.69, lat: 10, r: r0 * 0.85, cx: wcx, cy: earthY }} />
          {/* Speed: a motion streak behind the satellite */}
          {Array.from({ length: 14 }, (_, k) => {
            const p = satPos(phi - (k + 1) * 0.03);
            return <circle key={k} cx={p.x} cy={p.y} r={u(5) * (1 - k / 14)} fill={SPEED_BLUE} opacity={streak * 0.5 * (1 - k / 14)} />;
          })}
          <circle cx={sat.x} cy={sat.y} r={u(11)} fill={theme.colors.accent} opacity={0.2} />
          <circle cx={sat.x} cy={sat.y} r={u(6)} fill={theme.colors.accent} />
          {/* Height: satellite ring vs the deep well */}
          <g opacity={ramp(frame, higher - s(0.1), s(0.5)) * (1 - ramp(frame, speeds + s(1.5), s(0.8)))}>
            <line
              x1={wcx + rSat * 1.02}
              y1={wcy + depth(rSat)}
              x2={wcx + rSat * 1.02}
              y2={earthY}
              stroke={theme.colors.accent}
              strokeWidth={u(1.6)}
              strokeDasharray={`${u(3)} ${u(5)}`}
            />
          </g>
        </g>

        {/* Dials */}
        <g opacity={dialIn}>
          <Dial x={dials[0].x} y={dials[0].y} r={dialR} angle={base} color={theme.colors.text} />
          <Dial
            x={dials[1].x}
            y={dials[1].y}
            r={dialR}
            angle={satAngle}
            color={lead > 1 ? theme.colors.accent : lag < -1 ? SPEED_BLUE : theme.colors.text}
            ghost={diff > 0 ? base : undefined}
            ghostColor={theme.colors.text}
          />
        </g>

        {/* Number line */}
        <g opacity={axisIn}>
          <line x1={x0} y1={axisY} x2={x1} y2={axisY} stroke={theme.colors.muted} strokeWidth={u(1.5)} />
          {[-10, 0, 10, 20, 30, 40, 50].map((v) => (
            <g key={v}>
              <line x1={X(v)} y1={axisY - u(v === 0 ? 70 : 8)} x2={X(v)} y2={axisY + u(8)} stroke={v === 0 ? theme.colors.text : theme.colors.muted} strokeWidth={u(v === 0 ? 2 : 1.2)} />
            </g>
          ))}
          {sevenP > 0 && merge < 1 ? (
            <rect
              x={X(lerp(-7 * sevenP, sevenFrom, cancel))}
              y={axisY - barH - u(4) + (cancel > 0 ? -barH * 0.25 : 0)}
              width={Math.max(0, X(sevenTo) - X(lerp(-7 * sevenP, sevenFrom, cancel)))}
              height={barH * (cancel > 0 ? 1.5 : 1)}
              fill={cancel > 0 ? theme.colors.negative : SPEED_BLUE}
              opacity={cancel > 0 ? 0.6 * (1 - merge) : 0.85}
            />
          ) : null}
          {fortyP > 0 ? (
            <rect
              x={X(0)}
              y={axisY - barH - u(4)}
              width={(X(gravityTo) - X(0)) * fortyP}
              height={barH}
              fill={theme.colors.accent}
              opacity={0.55 + 0.45 * merge}
            />
          ) : null}
        </g>
      </svg>

      {/* Axis + bar labels */}
      <div style={{ position: "absolute", left: X(0) - u(100), width: u(200), top: axisY + u(16), textAlign: "center", opacity: axisIn }}>
        <Label size={17}>ground clocks</Label>
      </div>
      <div style={{ position: "absolute", left: X(50) - u(160), width: u(200), top: axisY + u(16), textAlign: "right", opacity: axisIn }}>
        <Label size={17}>µs per day</Label>
      </div>
      <div
        style={{
          position: "absolute",
          right: W - X(0) + u(14),
          top: axisY - barH * 2 - u(12) - u(34),
          textAlign: "right",
          opacity: sevenP * (1 - cancel),
          whiteSpace: "nowrap",
        }}
      >
        <Mono size={landscape ? 42 : 34} color={SPEED_BLUE}>−7</Mono>
        <Label size={16} color={SPEED_BLUE}>speed · slower</Label>
      </div>
      <div
        style={{
          position: "absolute",
          left: X(0) + u(14),
          top: axisY - barH - u(4) - u(62),
          opacity: fortyP * (1 - merge),
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: u(12) }}>
          <Mono size={landscape ? 42 : 34} color={theme.colors.accent}>+45</Mono>
          <Label size={16} color={theme.colors.accent}>gravity · faster</Label>
        </span>
      </div>

      {/* Dial labels */}
      {dials.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x - u(110), width: u(220), top: d.y + dialR + u(12), textAlign: "center", opacity: dialIn }}>
          <Label size={15} color={i === 1 ? theme.colors.accent : undefined}>
            {i === 0 ? "clock on the ground" : "clock in orbit"}
          </Label>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: sat.x - u(70),
          width: u(140),
          textAlign: "center",
          top: sat.y - u(52),
          opacity: streak * (1 - wellOut),
        }}
      >
        <Mono size={26} color={SPEED_BLUE}>3.9 km/s</Mono>
      </div>
      <div
        style={{
          position: "absolute",
          left: wcx + rSat * 1.02 + u(14),
          top: (wcy + depth(rSat) + earthY) / 2 - u(20),
          opacity: wellGlow * (1 - wellOut),
          maxWidth: u(260),
        }}
      >
        <Label size={15} color={theme.colors.accent}>higher up · weaker gravity</Label>
      </div>

      {/* The net result */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * (landscape ? 0.14 : square ? 0.16 : 0.2),
          textAlign: "center",
          opacity: bigIn,
          transform: `scale(${lerp(0.94, 1, bigIn)})`,
        }}
      >
        <Mono size={landscape ? 150 : 120} color={theme.colors.accent} style={{ letterSpacing: "-0.04em" }}>
          +{count} µs
        </Mono>
        <Label size={22} style={{ marginTop: u(10), opacity: ramp(frame, everyDay, s(0.5)) }}>
          gained every day, per satellite clock
        </Label>
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {dayP > 0 ? (
          <circle
            cx={W / 2}
            cy={H * (landscape ? 0.25 : square ? 0.27 : 0.27)}
            r={S * (landscape ? 0.2 : 0.22)}
            fill="none"
            stroke={theme.colors.accent}
            strokeOpacity={0.5}
            strokeWidth={u(2)}
            strokeDasharray={2 * Math.PI * S * (landscape ? 0.2 : 0.22)}
            strokeDashoffset={2 * Math.PI * S * (landscape ? 0.2 : 0.22) * (1 - dayP)}
            transform={`rotate(-90 ${W / 2} ${H * (landscape ? 0.25 : square ? 0.27 : 0.27)})`}
            opacity={1 - ramp(frame, durationInFrames - s(0.6), s(0.5))}
          />
        ) : null}
      </svg>
      <Label size={14} style={{ position: "absolute", left: safe.x * 0.5, top: safe.y * 0.4, opacity: 0.7 * dialIn }}>
        Clock drift exaggerated · well schematic
      </Label>
      <Vignette />
    </>
  );
};
