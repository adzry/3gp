/**
 * Geographic helpers for map templates. Pure (no d3) so Node tools and
 * tests can import them.
 */

/** Mean Earth radius (IUGG), km. */
export const EARTH_RADIUS_KM = 6371.0088;

export type LonLat = { lon: number; lat: number };

const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km (haversine). */
export const greatCircleKm = (a: LonLat, b: LonLat) => {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Total length of a multi-stop route (sum of great-circle legs), km. */
export const routeKm = (stops: LonLat[]) =>
  stops.slice(1).reduce((sum, s, i) => sum + greatCircleKm(stops[i], s), 0);

/**
 * Natural Earth detail level for a route: 1:110m for continent/world views,
 * 1:50m when zoomed into a region (coastlines stay crisp).
 */
export const detailFor = (stops: LonLat[]): "110m" | "50m" => {
  const lons = stops.map((s) => s.lon);
  const lats = stops.map((s) => s.lat);
  const span = Math.max(
    Math.max(...lons) - Math.min(...lons),
    Math.max(...lats) - Math.min(...lats),
  );
  return span < 25 ? "50m" : "110m";
};

/** "10,600 km" — rounded to 3 significant figures (routes are approximate). */
export const formatKm = (km: number) => {
  const digits = Math.max(0, Math.floor(Math.log10(Math.max(km, 1))) - 2);
  const r = Math.round(km / 10 ** digits) * 10 ** digits;
  return `${r.toLocaleString("en-US")} km`;
};
