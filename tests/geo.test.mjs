import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EARTH_RADIUS_KM,
  detailFor,
  formatKm,
  greatCircleKm,
  routeKm,
} from "../src/lib/geo.ts";

const close = (a, b, eps) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("great-circle distance matches the sphere's geometry", () => {
  // A quarter of the equator is π/2 · R.
  close(greatCircleKm({ lon: 0, lat: 0 }, { lon: 90, lat: 0 }), (Math.PI / 2) * EARTH_RADIUS_KM, 1e-6);
  // Equator → pole, too.
  close(greatCircleKm({ lon: 0, lat: 0 }, { lon: 0, lat: 90 }), (Math.PI / 2) * EARTH_RADIUS_KM, 1e-6);
  // Antipodes = half the circumference.
  close(greatCircleKm({ lon: 0, lat: 0 }, { lon: 180, lat: 0 }), Math.PI * EARTH_RADIUS_KM, 1e-6);
  // One degree of longitude on the equator ≈ 111.195 km.
  close(greatCircleKm({ lon: 0, lat: 0 }, { lon: 1, lat: 0 }), 111.195, 0.001);
});

test("distance is symmetric and zero for the same point", () => {
  const a = { lon: 101.69, lat: 3.14 };
  const b = { lon: -0.13, lat: 51.51 };
  close(greatCircleKm(a, b), greatCircleKm(b, a), 1e-9);
  assert.equal(greatCircleKm(a, a), 0);
});

test("routeKm sums the legs", () => {
  const stops = [{ lon: 0, lat: 0 }, { lon: 1, lat: 0 }, { lon: 2, lat: 0 }];
  close(routeKm(stops), 2 * greatCircleKm(stops[0], stops[1]), 1e-9);
});

test("detailFor picks 1:50m for regional routes, 1:110m for wide ones", () => {
  assert.equal(detailFor([{ lon: 101, lat: 3 }, { lon: 103.8, lat: 1.35 }]), "50m");
  assert.equal(detailFor([{ lon: 101, lat: 3 }, { lon: -0.1, lat: 51.5 }]), "110m");
});

test("formatKm rounds to 3 significant figures", () => {
  assert.equal(formatKm(10563.4), "10,600 km");
  assert.equal(formatKm(312.6), "313 km");
  assert.equal(formatKm(45.2), "45 km");
  assert.equal(formatKm(0.4), "0 km");
});
