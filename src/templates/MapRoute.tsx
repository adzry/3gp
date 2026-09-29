import {
  geoEqualEarth,
  geoInterpolate,
  geoMercator,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import type { Feature, Geometry } from "geojson";
import React, { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world110 from "world-atlas/countries-110m.json";
import world50 from "world-atlas/countries-50m.json";
import type { z } from "zod";
import { Headline } from "../components/Headline";
import { Stage } from "../components/Stage";
import { detailFor, formatKm, greatCircleKm } from "../lib/geo";
import { placeLabels } from "../lib/labels";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";
import { useSceneDuration } from "../video/scene-context";
import { SourceLine } from "./MetricCard";
import type { mapRouteSchema } from "./schemas";

type CountryFeature = Feature<Geometry, { name: string }>;

const countriesOf = (topology: unknown): CountryFeature[] => {
  const t = topology as Topology<{
    countries: GeometryCollection<{ name: string }>;
  }>;
  return (
    feature(t, t.objects.countries) as unknown as { features: CountryFeature[] }
  ).features;
};
// Parsed once per bundle, not per frame.
const COUNTRIES = {
  "110m": countriesOf(world110),
  "50m": countriesOf(world50),
};

/** Natural Earth country names available for `highlight`. */
export const COUNTRY_NAMES = COUNTRIES["110m"].map((c) => c.properties.name);

/**
 * A journey on a map: the map frames the route, the path draws itself at a
 * constant speed with a moving head, each stop lands as the route reaches it,
 * and the great-circle distance counts up. Offline (Natural Earth vectors,
 * public domain), deterministic, and styled by the theme.
 */
export const MapRoute: React.FC<z.input<typeof mapRouteSchema>> = ({
  title,
  stops,
  path = "arc",
  highlight = [],
  showDistance = true,
  padding = 0.35,
  source,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = useSceneDuration();
  const { u, width, height, safe, isVertical } = useLayout();
  const ink = theme.texture === "paper";

  const detail = detailFor(stops);
  // Default props (e.g. `highlight = []`) are new arrays every frame, so the
  // expensive map projection is keyed on content instead of identity.
  const contentKey = JSON.stringify({ stops, path, highlight, padding });
  const top = safe.y + (title ? u(150) : 0);
  const bottom =
    height - safe.y - u(showDistance || source ? (isVertical ? 170 : 70) : 0);

  // Projection fitted to the route (+ padding), memoised: it never changes per frame.
  const geo = useMemo(() => {
    const projection = detail === "50m" ? geoMercator() : geoEqualEarth();
    const route = {
      type: "LineString" as const,
      coordinates: stops.map((s) => [s.lon, s.lat]),
    };
    const areaW = width - safe.x * 2;
    const areaH = bottom - top;
    const inset = (Math.min(areaW, areaH) * padding) / 2;
    projection.fitExtent(
      [
        [safe.x + inset, top + inset],
        [width - safe.x - inset, bottom - inset],
      ],
      route,
    );
    const toPath = geoPath(projection);
    const wanted = new Set(highlight.map((h) => h.toLowerCase()));
    // 1:50m is a superset of 1:110m; tiny countries (e.g. Singapore) only
    // exist at 1:50m and simply have nothing to tint on a world-scale map.
    const unknown = highlight.filter(
      (h) =>
        !COUNTRIES["50m"].some(
          (c) => c.properties.name.toLowerCase() === h.toLowerCase(),
        ),
    );
    if (unknown.length) {
      throw new Error(
        `MapRoute: unknown country name(s): ${unknown.join(", ")} (use Natural Earth names, e.g. "United Kingdom")`,
      );
    }
    const land = COUNTRIES[detail].map((c) => ({
      d: toPath(c as GeoPermissibleObjects) ?? "",
      hl: wanted.has(c.properties.name.toLowerCase()),
    }));
    const legs = stops.slice(1).map((b, i) => {
      const a = stops[i];
      const geom: GeoPermissibleObjects = {
        type: "LineString",
        coordinates: [
          [a.lon, a.lat],
          [b.lon, b.lat],
        ],
      };
      const pa = projection([a.lon, a.lat]) ?? [0, 0];
      const pb = projection([b.lon, b.lat]) ?? [0, 0];
      // "line" = straight on the map; "arc" = great circle (d3 resamples it).
      const d =
        path === "arc"
          ? (toPath(geom) ?? "")
          : `M${pa[0]},${pa[1]}L${pb[0]},${pb[1]}`;
      const len =
        path === "arc"
          ? toPath.measure(geom)
          : Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      return {
        d,
        len: Math.max(len, 1),
        km: greatCircleKm(a, b),
        interp: geoInterpolate([a.lon, a.lat], [b.lon, b.lat]),
        pa,
        pb,
      };
    });
    const points = stops.map((s) => projection([s.lon, s.lat]) ?? [0, 0]);
    const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
    const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
    const labels = placeLabels(
      points as [number, number][],
      stops.map((s) => ({ w: s.name.length * u(19) + u(36), h: u(50) })),
      { x: safe.x, y: top, w: width - safe.x * 2, h: bottom - top },
      { offset: u(22), gap: u(8), marker: u(14) },
    );
    return {
      projection,
      land,
      legs,
      points,
      labels,
      center: [cx, cy] as const,
    };
    // Keyed on content (not array identity): the map is computed once per scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, detail, width, safe.x, top, bottom]);

  // Draw at constant on-screen speed across all legs.
  const start = 14;
  const drawFrames = Math.min(
    duration * 0.6,
    (1 + 0.9 * geo.legs.length) * fps,
  );
  const p = interpolate(frame, [start, start + drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const totalLen = geo.legs.reduce((s, l) => s + l.len, 0);
  const along = p * totalLen;
  let cum = 0;
  const legProgress = geo.legs.map((l) => {
    const local = Math.min(1, Math.max(0, (along - cum) / l.len));
    cum += l.len;
    return local;
  });
  const cumAt = (i: number) =>
    geo.legs.slice(0, i).reduce((s, l) => s + l.len, 0);
  const kmSoFar = geo.legs.reduce((s, l, i) => s + l.km * legProgress[i], 0);

  // Moving head of the route.
  const activeLeg = Math.max(
    0,
    legProgress.findIndex((x) => x < 1),
  );
  const legIdx = legProgress.every((x) => x >= 1)
    ? geo.legs.length - 1
    : activeLeg;
  const leg = geo.legs[legIdx];
  const t = legProgress[legIdx];
  const head =
    path === "arc"
      ? (geo.projection(leg.interp(t)) ?? leg.pb)
      : [
          leg.pa[0] + (leg.pb[0] - leg.pa[0]) * t,
          leg.pa[1] + (leg.pb[1] - leg.pa[1]) * t,
        ];

  const push = interpolate(frame, [0, duration], [1, 1.06]);
  const routeColor = ink ? theme.colors.negative : theme.colors.accent;
  // A stop lands as the route arrives (finishing exactly on arrival, so the
  // final stop is fully shown too).
  const reveal = (d: number) =>
    interpolate(along, [d - totalLen * 0.04, d], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <Stage padded={false}>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <g
          style={{
            transform: `scale(${push})`,
            transformOrigin: `${geo.center[0]}px ${geo.center[1]}px`,
          }}
        >
          {geo.land.map((c, i) => (
            <path
              key={i}
              d={c.d}
              fill={c.hl ? theme.colors.accent : theme.colors.surface}
              fillOpacity={c.hl && !ink ? 0.45 : 1}
              stroke={ink ? theme.colors.muted : theme.colors.background}
              strokeOpacity={ink ? 0.45 : 1}
              strokeWidth={u(1.2)}
            />
          ))}
          {geo.legs.map((l, i) => (
            <path
              key={i}
              d={l.d}
              fill="none"
              stroke={routeColor}
              strokeWidth={u(6)}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - legProgress[i]}
            />
          ))}
          {p > 0 && p < 1 ? (
            <circle
              cx={head[0]}
              cy={head[1]}
              r={u(11)}
              fill={routeColor}
              stroke={theme.colors.background}
              strokeWidth={u(4)}
            />
          ) : null}
          {geo.points.map((pt, i) => {
            const o =
              i === 0
                ? interpolate(frame, [4, 14], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : reveal(cumAt(i));
            const name = stops[i].name;
            const box = geo.labels[i];
            // Leader line to labels pushed away from their point.
            const edgeY = box.y + box.h / 2 < pt[1] ? box.y + box.h : box.y;
            return (
              <g key={i} opacity={o}>
                {box.leader ? (
                  <line
                    x1={pt[0]}
                    y1={pt[1]}
                    x2={Math.min(
                      Math.max(pt[0], box.x + u(12)),
                      box.x + box.w - u(12),
                    )}
                    y2={edgeY}
                    stroke={theme.colors.text}
                    strokeWidth={u(2.5)}
                  />
                ) : null}
                <circle
                  cx={pt[0]}
                  cy={pt[1]}
                  r={u(12) * (0.6 + 0.4 * o)}
                  fill={theme.colors.text}
                  stroke={theme.colors.background}
                  strokeWidth={u(4)}
                />
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={Math.min(theme.radius, u(10))}
                  fill={theme.colors.text}
                />
                <text
                  x={box.x + box.w / 2}
                  y={box.y + box.h - u(15)}
                  textAnchor="middle"
                  style={{
                    fontFamily: theme.fonts.body,
                    fontWeight: 700,
                    fontSize: u(30),
                    fill: theme.colors.background,
                  }}
                >
                  {name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {title ? (
        <div
          style={{
            position: "absolute",
            left: safe.x,
            right: safe.x,
            top: safe.y,
          }}
        >
          <Headline text={title} size={72} maxWidth={1500} />
        </div>
      ) : null}
      {showDistance ? (
        <div
          style={{
            position: "absolute",
            // Vertical: sit above the (wrapping) source line instead of beside it.
            ...(isVertical
              ? { left: safe.x, bottom: safe.y * 0.6 + u(84) }
              : { right: safe.x, bottom: safe.y * 0.6 }),
            fontFamily: theme.fonts.mono,
            fontWeight: 500,
            fontSize: u(40),
            color: theme.colors.text,
            opacity: interpolate(frame, [start, start + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          ≈ {formatKm(kmSoFar)}
        </div>
      ) : null}
      {source || showDistance ? (
        <SourceLine
          text={[
            source,
            showDistance
              ? "distance = great-circle, computed from coordinates"
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
      ) : null}
    </Stage>
  );
};
