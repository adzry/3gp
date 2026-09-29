import { defineScenes } from "../../../src/video/custom-scenes";
import { SCENE_SCHEMAS } from "./schemas";
import { ThroatOfVenice } from "./ThroatOfVenice";

export const SCENES = defineScenes(SCENE_SCHEMAS, { ThroatOfVenice });
