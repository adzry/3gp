/**
 * Project registry. `npm run new` appends to this list automatically.
 * Each video.json is validated against src/video/schema.ts when Studio loads
 * (typed `unknown` because JSON imports widen string literals).
 * `scenes` is the project's bespoke-scene registry (projects/<n>/scenes/).
 */
import type { SceneRegistry } from "../src/video/custom-scenes";
import p001 from "./001-from-3gp-to-3gp/video.json";
import p002 from "./002-voice-first-demo/video.json";
import p003 from "./003-what-is-3gp/video.json";
import p004 from "./004-sejarah-perdagangan-melaka/video.json";
import { SCENES as s004 } from "./004-sejarah-perdagangan-melaka/scenes";
import p005 from "./005-einstein-in-your-pocket/video.json";
import { SCENES as s005 } from "./005-einstein-in-your-pocket/scenes";
// <3gp:imports>

export const PROJECTS: { video: unknown; scenes?: SceneRegistry }[] = [
  { video: p001 },
  { video: p002 },
  { video: p003 },
  { video: p004, scenes: s004 },
  { video: p005, scenes: s005 },
  // <3gp:projects>
];
