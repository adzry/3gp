import type { Feature, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world110 from "world-atlas/countries-110m.json";
import world50 from "world-atlas/countries-50m.json";

/** Natural Earth countries (public domain), via world-atlas. */
export type CountryFeature = Feature<Geometry, { name: string }>;

const countriesOf = (topology: unknown): CountryFeature[] => {
  const t = topology as Topology<{
    countries: GeometryCollection<{ name: string }>;
  }>;
  return (
    feature(t, t.objects.countries) as unknown as { features: CountryFeature[] }
  ).features;
};

// Parsed once per bundle, not per frame.
export const COUNTRIES = {
  "110m": countriesOf(world110),
  "50m": countriesOf(world50),
};
