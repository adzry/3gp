import {
  geoBounds,
  geoMercator,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import React, { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { z } from "zod";
import { Emphasis } from "../../../src/components/Emphasis";
import { Reveal } from "../../../src/components/Reveal";
import { Stage } from "../../../src/components/Stage";
import { splitWithPhrases } from "../../../src/components/WordReveal";
import { useLayout } from "../../../src/lib/layout";
import { stepFrame } from "../../../src/lib/motion";
import { COUNTRIES } from "../../../src/lib/world";
import { useTheme } from "../../../src/styles";
import { SourceLine } from "../../../src/templates/MetricCard";
import { useScene, useWordFrame } from "../../../src/video/scene-context";
import type { SCENE_SCHEMAS } from "./schemas";

type LonLat = [number, number];
type Pt = [number, number];

// The spice route, schematic (sea lanes, not a survey): Maluku → Melaka → Venice.
const MALUKU: LonLat = [127.38, 0.79];
const MELAKA: LonLat = [102.25, 2.19];
const VENICE: LonLat = [12.34, 45.44];
const EAST: LonLat[] = [
  MALUKU,
  [126.8, -1.6],
  [123.2, -5.9],
  [118.5, -6.3],
  [112, -5.4],
  [107.4, -3.2],
  [105.6, -0.6],
  [104.3, 1.15],
  [103.2, 1.3],
  MELAKA,
];
const WEST: LonLat[] = [
  MELAKA,
  [101.0, 2.95],
  [99.9, 4.0],
  [98.7, 5.35],
  [97.0, 6.3],
  [94.8, 6.5],
  [81.0, 5.2],
  [72.5, 9.0],
  [60, 12.6],
  [50, 12.3],
  [44.6, 12.3],
  [43.3, 12.8],
  [41.3, 15.6],
  [38.4, 20.6],
  [35.4, 25.6],
  [33.1, 28.6],
  [32.5, 29.9],
  [30.6, 30.6],
  [29.9, 31.3],
  [27.0, 33.2],
  [22.0, 35.0],
  [19.3, 38.6],
  [18.8, 40.4],
  [16.3, 42.4],
  [13.8, 44.4],
  VENICE,
];
/** A point in the strait's water, for its name. */
const STRAIT_NAME: LonLat = [100.3, 3.55];
/** Where the "hand" closes: the strait just north-west of Melaka. */
const STRAIT: LonLat = [101.25, 2.8];
const STRAIT_AXIS: [LonLat, LonLat] = [
  [103.3, 1.35],
  [99.3, 4.3],
];

type Box = { west: number; east: number; south: number; north: number };
const WIDE: Box = { west: 7, east: 132, south: -8, north: 48 };
const TIGHT: Box = { west: 99.3, east: 104.6, south: 0.4, north: 4.6 };

const bboxOf = (b: Box): GeoPermissibleObjects => ({
  type: "MultiPoint",
  coordinates: [
    [b.west, b.south],
    [b.east, b.north],
  ],
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** The first `t` (0–1) of a polyline, by length. */
const partial = (pts: Pt[], t: number): Pt[] => {
  if (t <= 0) return [];
  const seg = pts.slice(1).map((p, i) => dist(pts[i], p));
  let left = seg.reduce((s, l) => s + l, 0) * Math.min(1, t);
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(pts[i + 1]);
      left -= seg[i];
      continue;
    }
    const k = left / seg[i];
    out.push([
      lerp(pts[i][0], pts[i + 1][0], k),
      lerp(pts[i][1], pts[i + 1][1], k),
    ]);
    break;
  }
  return out;
};

/** Smooth path through points (quadratic curves via midpoints). */
const smooth = (pts: Pt[]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    d += `Q${pts[i][0]},${pts[i][1]} ${m[0]},${m[1]}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${last[0]},${last[1]}`;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * "Whoever is lord of Malacca has his hand on the throat of Venice."
 *
 * The camera opens tight on the Strait of Malacca, then pulls back while the
 * spice route draws west until Venice appears at the far end of the world —
 * the geography the quote is about. When the quote reaches "throat of
 * Venice" (or the narrator says it), a red grip closes on the strait and a
 * pulse runs up the route to Venice.
 */
export const ThroatOfVenice: React.FC<
  z.output<(typeof SCENE_SCHEMAS)["ThroatOfVenice"]>
> = ({ kicker, quote, emphasis, attribution, labels, source, cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const { durationInFrames } = useScene();
  const { u, width: W, height: H, safe, isVertical } = useLayout();
  const landscape = W > H * 1.2;
  const f = (s: number) => Math.round(s * fps);

  // Beats (seconds on a silent track; narration moves the quote and grip).
  const pullStart = f(1.2);
  const pullEnd = f(3.8);
  const quoteAt = useWordFrame(cues.quote, f(2.3));
  const words = quote.split(/\s+/).length;
  const gripAt = Math.max(
    useWordFrame(cues.grip, quoteAt + words * 3 + f(0.3)),
    pullEnd,
  );

  // Where the map is framed, and where the quote card sits, per format.
  const mapRect = landscape
    ? { x: W * 0.42, y: safe.y * 0.6, w: W * 0.58 - safe.x * 0.5, h: H - safe.y * 1.6 }
    : { x: 0, y: safe.y * 0.5, w: W, h: H * (isVertical ? 0.55 : 0.5) };

  const inset = u(40);
  const insetX = landscape ? inset : safe.x * 0.5 + inset;

  const geo = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [mapRect.x + insetX, mapRect.y + inset],
        [mapRect.x + mapRect.w - insetX, mapRect.y + mapRect.h - inset],
      ],
      bboxOf(WIDE),
    );
    const p = (ll: LonLat) => (projection(ll) ?? [0, 0]) as Pt;
    const toPath = geoPath(projection);
    const rect = (b: Box) => {
      const a = p([b.west, b.north]);
      const c = p([b.east, b.south]);
      return { cx: (a[0] + c[0]) / 2, cy: (a[1] + c[1]) / 2, w: c[0] - a[0], h: c[1] - a[1] };
    };
    const axis = STRAIT_AXIS.map(p);
    const along = [axis[1][0] - axis[0][0], axis[1][1] - axis[0][1]];
    const len = Math.hypot(along[0], along[1]);
    return {
      // Only the countries near the route: fewer paths to draw per frame.
      land: COUNTRIES["50m"]
        .filter((c) => {
          const [[w, so], [e, no]] = geoBounds(c as GeoPermissibleObjects);
          return e > WIDE.west - 30 && w < WIDE.east + 30 && no > WIDE.south - 20 && so < WIDE.north + 20;
        })
        .map((c) => toPath(c as GeoPermissibleObjects) ?? ""),
      east: EAST.map(p),
      west: WEST.map(p),
      melaka: p(MELAKA),
      venice: p(VENICE),
      maluku: p(MALUKU),
      strait: p(STRAIT),
      straitName: p(STRAIT_NAME),
      axis: [along[0] / len, along[1] / len] as Pt,
      wide: rect(WIDE),
      tight: rect(TIGHT),
    };
    // The projection depends only on the frame size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H]);

  // Camera: tight on the strait → the whole route. Zoom is interpolated in log
  // space and the centre follows the zoom, so the pull-back feels even.
  const e = interpolate(frame, [pullStart, pullEnd], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const R = { cx: mapRect.x + mapRect.w / 2, cy: mapRect.y + mapRect.h / 2 };
  // The projection is fitted to the wide view, so the wide zoom is 1.
  const kTight = Math.min(
    (mapRect.w - 2 * insetX) / geo.tight.w,
    (mapRect.h - 2 * inset) / geo.tight.h,
  );
  const kWide = 1;
  const k = Math.exp(lerp(Math.log(kTight), Math.log(kWide), e));
  const c = (1 / k - 1 / kTight) / (1 / kWide - 1 / kTight);
  const cx = lerp(geo.tight.cx, geo.wide.cx, c);
  const cy = lerp(geo.tight.cy, geo.wide.cy, c);
  const S = (p: Pt): Pt => [R.cx + k * (p[0] - cx), R.cy + k * (p[1] - cy)];

  // Route drawing: the eastern leg arrives at Melaka, the western leg rides
  // the pull-back to Venice.
  const eastP = interpolate(frame, [f(0.15), f(1.1)], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const westP = interpolate(frame, [pullStart + f(0.2), pullEnd + f(0.1)], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const eastS = geo.east.map(S);
  const westS = geo.west.map(S);

  // The grip: two pen strokes close on the strait; a pulse runs to Venice.
  const penFrame = stepFrame(frame, fps, theme.strokeFps);
  const grip = interpolate(penFrame, [gripAt, gripAt + f(0.35)], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(2)),
  });
  const pulse = interpolate(frame, [gripAt + f(0.2), gripAt + f(1.3)], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const pulseSeg = (() => {
    if (pulse <= 0 || pulse >= 1) return "";
    const head = partial(westS, pulse);
    const tail = partial(westS, Math.max(0, pulse - 0.12));
    if (!tail.length) return smooth(head);
    return smooth([tail[tail.length - 1], ...head.slice(tail.length - 1)]);
  })();
  const veniceHit = interpolate(frame, [gripAt + f(1.2), gripAt + f(1.6)], [0, 1], clamp);

  const st = S(geo.strait);
  const sn = S(geo.straitName);
  // Text runs along the strait, reading left to right.
  const straitAngle = (() => {
    const a = (Math.atan2(geo.axis[1], geo.axis[0]) * 180) / Math.PI;
    return a > 90 ? a - 180 : a < -90 ? a + 180 : a;
  })();
  const n: Pt = [-geo.axis[1], geo.axis[0]];
  const gap = Math.max(k * 5, u(34)) * lerp(1.25, 0.62, grip);
  const arm = Math.max(k * 9, u(46));
  const gripStroke = (side: 1 | -1) => {
    const c0: Pt = [st[0] + n[0] * gap * side, st[1] + n[1] * gap * side];
    const a: Pt = [c0[0] - (geo.axis[0] * arm) / 2, c0[1] - (geo.axis[1] * arm) / 2];
    const b: Pt = [c0[0] + (geo.axis[0] * arm) / 2, c0[1] + (geo.axis[1] * arm) / 2];
    const bulge: Pt = [c0[0] + n[0] * side * arm * 0.45, c0[1] + n[1] * side * arm * 0.45];
    return `M${a[0]},${a[1]}Q${bulge[0]},${bulge[1]} ${b[0]},${b[1]}`;
  };
  const gripOpacity = interpolate(penFrame, [gripAt - f(0.1), gripAt + f(0.05)], [0, 1], clamp);

  const mel = S(geo.melaka);
  const ven = S(geo.venice);
  const mal = S(geo.maluku);
  const labelIn = (at: number) => interpolate(frame, [at, at + f(0.3)], [0, 1], clamp);
  const straitNote = interpolate(frame, [f(0.5), f(0.9), pullStart + f(0.6), pullStart + f(1.1)], [0, 1, 1, 0], clamp);
  const veniceIn = labelIn(pullEnd - f(0.1));
  const malukuIn = labelIn(pullStart + f(1.2));
  const outro = interpolate(frame, [durationInFrames - f(0.5), durationInFrames], [1, 0], clamp);

  const route = theme.colors.positive;
  const pen = theme.colors.negative;
  const labelBox = (
    p: Pt,
    text: string,
    o: number,
    side: "left" | "right" | "below",
    strong = true,
  ) => {
    const fs = u(30);
    const w = text.length * fs * 0.6 + u(28);
    const h = u(46);
    const x = Math.min(
      Math.max(
        side === "right" ? p[0] + u(22) : side === "left" ? p[0] - u(22) - w : p[0] - w / 2,
        safe.x * 0.5,
      ),
      W - safe.x * 0.5 - w,
    );
    const y = side === "below" ? p[1] + u(20) : p[1] - h / 2;
    return (
      <g opacity={o}>
        <circle cx={p[0]} cy={p[1]} r={u(10)} fill={theme.colors.text} stroke={theme.colors.background} strokeWidth={u(4)} />
        {strong ? <rect x={x} y={y} width={w} height={h} rx={theme.radius} fill={theme.colors.text} /> : null}
        <text
          x={x + w / 2}
          y={y + h / 2 + fs * 0.35}
          textAnchor="middle"
          style={{
            fontFamily: theme.fonts.body,
            fontWeight: 700,
            fontSize: fs,
            fill: strong ? theme.colors.background : theme.colors.text,
            // Unboxed labels get a paper halo so lines never cut through them.
            stroke: strong ? undefined : theme.colors.background,
            strokeWidth: strong ? undefined : u(8),
            paintOrder: "stroke",
            strokeLinejoin: "round",
          }}
        >
          {text}
        </text>
      </g>
    );
  };

  // Quote card.
  // Words reveal one by one; a glued token ("." after the highlighted phrase)
  // stays on its word's line, and the quotation marks ride the first/last word.
  const tokens = splitWithPhrases(quote, [emphasis]);
  const groups: { t: (typeof tokens)[number]; d: number; i: number }[][] = [];
  let wordIndex = 0;
  tokens.forEach((t, i) => {
    const d = quoteAt + wordIndex * 3;
    wordIndex += t.text.split(" ").length;
    if (t.glue && groups.length) groups[groups.length - 1].push({ t, d, i });
    else groups.push([{ t, d, i }]);
  });
  const cardStyle: React.CSSProperties = landscape
    ? { left: safe.x, width: W * 0.4 - safe.x, top: H * 0.5, transform: "translateY(-50%)" }
    : {
        left: safe.x,
        right: safe.x,
        top: mapRect.y + mapRect.h + u(isVertical ? 30 : 10),
      };
  const quoteSize = u(landscape ? 50 : isVertical ? 58 : 46);

  return (
    <Stage padded={false}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: outro }}>
        <g transform={`translate(${R.cx - k * cx},${R.cy - k * cy}) scale(${k})`}>
          {geo.land.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={theme.colors.surface}
              stroke={theme.colors.muted}
              strokeOpacity={0.45}
              strokeWidth={u(1.2)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <path d={smooth(partial(eastS, eastP))} fill="none" stroke={route} strokeWidth={u(7)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={smooth(partial(westS, westP))} fill="none" stroke={route} strokeWidth={u(7)} strokeLinecap="round" strokeLinejoin="round" />
        {pulseSeg ? (
          <path d={pulseSeg} fill="none" stroke={pen} strokeWidth={u(12)} strokeLinecap="round" />
        ) : null}
        <g opacity={gripOpacity}>
          {([1, -1] as const).map((side) => (
            <path
              key={side}
              d={gripStroke(side)}
              fill="none"
              stroke={pen}
              strokeWidth={u(9)}
              strokeLinecap="round"
            />
          ))}
        </g>
        <text
          x={sn[0]}
          y={sn[1]}
          textAnchor="middle"
          opacity={straitNote}
          style={{ fontFamily: theme.fonts.hand, fontWeight: 700, fontSize: u(60), fill: pen }}
          transform={`rotate(${straitAngle} ${sn[0]} ${sn[1]})`}
        >
          {labels.strait}
        </text>
        {labelBox(mal, labels.maluku, malukuIn, "below", false)}
        {labelBox(ven, labels.venice, veniceIn, "right")}
        {veniceHit > 0 ? (
          <circle
            cx={ven[0]}
            cy={ven[1]}
            r={u(18) + u(40) * veniceHit}
            fill="none"
            stroke={pen}
            strokeWidth={u(6)}
            opacity={1 - veniceHit * 0.7}
          />
        ) : null}
        {labelBox(mel, labels.melaka, labelIn(f(0.9)), "right")}
      </svg>

      <div style={{ position: "absolute", ...cardStyle, opacity: outro }}>
        <Reveal delay={quoteAt - f(0.25)} seed={7}>
          <div
            style={{
              background: theme.colors.background,
              boxShadow: theme.shadow,
              border: `${u(3)}px solid ${theme.colors.text}`,
              padding: `${u(landscape ? 44 : 36)}px ${u(44)}px`,
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontWeight: 700,
                fontSize: u(26),
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: theme.colors.muted,
                marginBottom: u(18),
              }}
            >
              {kicker}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontWeight: 700,
                fontSize: quoteSize,
                lineHeight: 1.16,
                letterSpacing: "-0.01em",
              }}
            >
              {groups.map((g, gi) => (
                <React.Fragment key={gi}>
                  {gi > 0 ? " " : null}
                  <span style={{ whiteSpace: "nowrap" }}>
                    {g.map(({ t, d, i }) => {
                      const text = `${i === 0 ? "“" : ""}${t.text}${i === tokens.length - 1 ? "”" : ""}`;
                      return (
                        <Reveal key={i} as="span" delay={d} seed={i} straight>
                          {t.emphasized ? <Emphasis delay={gripAt}>{text}</Emphasis> : text}
                        </Reveal>
                      );
                    })}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <Reveal delay={quoteAt + words * 3 + f(0.2)} straight>
              <div style={{ marginTop: u(22), fontSize: u(landscape ? 28 : 32), color: theme.colors.muted }}>
                {attribution}
              </div>
            </Reveal>
          </div>
        </Reveal>
      </div>
      <SourceLine text={source} />
    </Stage>
  );
};
