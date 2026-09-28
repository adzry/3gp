/**
 * Project registry. `npm run new` appends to this list automatically.
 * Each video.json is validated against src/video/schema.ts when Studio loads
 * (typed `unknown` because JSON imports widen string literals).
 */
import p001 from "./001-from-3gp-to-3gp/video.json";
// <3gp:imports>

export const PROJECTS: unknown[] = [
  p001,
  // <3gp:projects>
];
