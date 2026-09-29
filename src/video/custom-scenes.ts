import type React from "react";
import { createContext } from "react";
import type { z } from "zod";

/** A project's bespoke scenes: props schemas (pure zod) + components. */
export type SceneRegistry = {
  schemas: Record<string, z.ZodType>;
  components: Record<string, React.FC<never>>;
};

/**
 * Pair a project's scene schemas (projects/<n>/scenes/schemas.ts) with their
 * components. The types make both lists match exactly and give each
 * component its parsed props.
 */
export const defineScenes = <S extends Record<string, z.ZodType>>(
  schemas: S,
  components: { [K in keyof S]: React.FC<z.output<S[K]>> },
): SceneRegistry => ({
  schemas,
  components: components as SceneRegistry["components"],
});

export const EMPTY_SCENES: SceneRegistry = { schemas: {}, components: {} };

/** The registry of the project being rendered (set in src/Root.tsx). */
export const CustomScenesContext = createContext<SceneRegistry>(EMPTY_SCENES);
