/**
 * Bespoke scenes of "Einstein in your pocket". Their words are the
 * narration's, so the props are empty: the scene owns its typography and
 * lands it on the spoken words (useWordFrame / SpokenLine).
 */
import { z } from "zod";

const none = z.object({});

export const SCENE_SCHEMAS = {
  ColdOpen: none,
  TheQuestion: none,
  Constellation: none,
  TimeSignal: none,
  Trilateration: none,
  Microsecond: none,
  Relativity: none,
  Drift: none,
  Tuned: none,
  Close: none,
  Credits: none,
};
