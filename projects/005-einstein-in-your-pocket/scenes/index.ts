import { defineScenes } from "../../../src/video/custom-scenes";
import { Close } from "./Close";
import { ColdOpen } from "./ColdOpen";
import { Constellation } from "./Constellation";
import { Credits } from "./Credits";
import { Drift } from "./Drift";
import { Microsecond } from "./Microsecond";
import { Relativity } from "./Relativity";
import { SCENE_SCHEMAS } from "./schemas";
import { TheQuestion } from "./TheQuestion";
import { TimeSignal } from "./TimeSignal";
import { Trilateration } from "./Trilateration";
import { Tuned } from "./Tuned";

export const SCENES = defineScenes(SCENE_SCHEMAS, {
  ColdOpen,
  TheQuestion,
  Constellation,
  TimeSignal,
  Trilateration,
  Microsecond,
  Relativity,
  Drift,
  Tuned,
  Close,
  Credits,
});
